"""Tessera matrix runner.

Fans the `legal_contract_review` Inspect task over the matrix
{assemblies} x {models}, runs k trials per cell (Inspect `epochs=k`), collects
F1 + cost + latency + tokens, computes pass@1 / pass^k, and emits the contract
§3 ingestion JSON (one object per cell) to stdout and a file.

Honesty rules (research §5; lane brief):
- Cells that can't run — assembly stubbed (OMC) or model absent — are emitted as
  clearly-marked *skipped* entries with the precise reason. Scores are NEVER
  fabricated; skipped cells carry null metrics.

Usage:
    python runner.py --k 2 --limit 2                      # local 2x2 (bare runs, OMC skips)
    python runner.py --harness bare-agent.md --model ollama/qwen3:8b --limit 1 --k 1
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from inspect_ai import eval as inspect_eval
from inspect_ai.log import EvalLog

from assemblies import assembly_names, get_assembly
from cost import compute_cost
from metrics import (
    DEFAULT_PASS_THRESHOLD,
    mean_f1,
    pass_at_1,
    pass_hat_k,
)
from models import DEFAULT_MODEL_IDS, OLLAMA_BASE_URL, is_local_model, resolve_model
from suites.legal_contract_review import legal_contract_review

SUITE = "legal_contract_review"
DOMAIN = "legal"
FIXTURE_PATH = (
    Path(__file__).parent / "suites" / "legal_contract_review" / "fixtures" / "cuad_subset.json"
)


# ---------------------------------------------------------------------------
# Suite hash (version of the data under test)
# ---------------------------------------------------------------------------


def suite_hash(path: Path = FIXTURE_PATH) -> str:
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    return f"sha256:{digest}"


# ---------------------------------------------------------------------------
# Model availability (best-effort pre-flight)
# ---------------------------------------------------------------------------


def local_model_available(model_id: str, base_url: str = OLLAMA_BASE_URL) -> tuple[bool, str | None]:
    """Check the Ollama tags endpoint for the model. Best-effort; never raises."""
    name = model_id.split("/", 1)[1] if "/" in model_id else model_id
    parsed = urlparse(base_url)
    tags_url = f"{parsed.scheme}://{parsed.netloc}/api/tags"
    try:
        with urllib.request.urlopen(tags_url, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, OSError, ValueError) as e:
        return False, f"Ollama not reachable at {tags_url}: {e}"
    available = {m.get("name", "") for m in data.get("models", [])}
    if name in available or f"{name}:latest" in available:
        return True, None
    return False, f"model '{name}' not pulled in Ollama (have: {sorted(available)})"


def model_available(model_id: str) -> tuple[bool, str | None]:
    if is_local_model(model_id):
        return local_model_available(model_id)
    # API models: defer to Inspect's provider key resolution at run time.
    return True, None


# ---------------------------------------------------------------------------
# Extraction from EvalLog
# ---------------------------------------------------------------------------


def _sample_f1(sample: Any) -> float | None:
    scores = getattr(sample, "scores", None) or {}
    for sc in scores.values():
        value = getattr(sc, "value", None)
        if isinstance(value, dict) and "f1" in value:
            try:
                return float(value["f1"])
            except (TypeError, ValueError):
                return None
    return None


@dataclass
class CellMetrics:
    trials_by_task: dict[str, list[float]]
    per_task: list[dict[str, Any]]
    input_tokens: int
    output_tokens: int
    total_tokens: int
    latency_ms: int
    n_samples: int


def extract_cell_metrics(logs: list[EvalLog]) -> CellMetrics:
    """Collapse one or more EvalLogs (k trials via epochs) into matrix metrics."""
    trials_by_task: dict[str, list[float]] = {}
    per_task: list[dict[str, Any]] = []
    input_tokens = output_tokens = total_tokens = 0
    working_times: list[float] = []
    n_samples = 0

    for log in logs:
        # Token usage from the aggregate stats (per-model).
        usage_map = getattr(getattr(log, "stats", None), "model_usage", None) or {}
        for usage in usage_map.values():
            input_tokens += getattr(usage, "input_tokens", 0) or 0
            output_tokens += getattr(usage, "output_tokens", 0) or 0
            total_tokens += getattr(usage, "total_tokens", 0) or 0

        for sample in getattr(log, "samples", None) or []:
            n_samples += 1
            slug = str(sample.id)
            epoch = int(getattr(sample, "epoch", 1) or 1)
            f1 = _sample_f1(sample)
            wt = getattr(sample, "working_time", None) or getattr(sample, "total_time", None)
            if wt:
                working_times.append(float(wt))
            if f1 is None:
                continue
            trials_by_task.setdefault(slug, []).append(f1)
            per_task.append(
                {
                    "task_slug": slug,
                    "metric": "f1",
                    "value": round(f1, 6),
                    "trial": max(epoch - 1, 0),  # contract trial is 0-based
                }
            )

    latency_ms = int(round(1000 * (sum(working_times) / len(working_times)))) if working_times else 0
    return CellMetrics(
        trials_by_task=trials_by_task,
        per_task=per_task,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=total_tokens,
        latency_ms=latency_ms,
        n_samples=n_samples,
    )


# ---------------------------------------------------------------------------
# Cell records (contract §3)
# ---------------------------------------------------------------------------


def _base_record(harness: str, model_id: str, k: int) -> dict[str, Any]:
    return {
        "harness": harness,
        "model_id": model_id,
        "suite": SUITE,
        "domain": DOMAIN,
        "k": k,
        "pass_at_1": None,
        "pass_hat_k": None,
        "f1": None,
        "cost_usd": None,
        "latency_ms": None,
        "total_tokens": None,
        "runner_image_digest": None,
        "suite_hash": suite_hash(),
        "per_task": [],
    }


def skipped_record(harness: str, model_id: str, k: int, reason: str) -> dict[str, Any]:
    rec = _base_record(harness, model_id, k)
    rec["skipped"] = True
    rec["skip_reason"] = reason
    return rec


def run_cell(
    harness: str,
    model_id: str,
    k: int,
    limit: int | None,
    log_dir: str,
    threshold: float = DEFAULT_PASS_THRESHOLD,
    display: str = "none",
) -> dict[str, Any]:
    """Run a single matrix cell and return its contract §3 record (or skipped)."""
    assembly = get_assembly(harness)
    if not assembly.available:
        return skipped_record(harness, model_id, k, assembly.unavailable_reason or "assembly unavailable")

    ok, reason = model_available(model_id)
    if not ok:
        return skipped_record(harness, model_id, k, reason or "model unavailable")

    try:
        solver = assembly.solver(model=None)  # inherit the model under test
        task = legal_contract_review(solver=solver)
        model = resolve_model(model_id)
        logs = inspect_eval(
            task,
            model=model,
            epochs=k,
            limit=limit,
            log_dir=log_dir,
            display=display,
            score=True,
        )
    except Exception as e:  # noqa: BLE001 — surface as honest skip, never fabricate
        return skipped_record(harness, model_id, k, f"eval raised: {type(e).__name__}: {e}")

    if not logs or any(getattr(lg, "status", None) == "error" for lg in logs):
        err = next((getattr(lg, "error", None) for lg in logs if getattr(lg, "error", None)), None)
        return skipped_record(harness, model_id, k, f"eval did not complete cleanly: {err}")

    m = extract_cell_metrics(logs)
    rec = _base_record(harness, model_id, k)
    rec.update(
        {
            "pass_at_1": round(pass_at_1(m.trials_by_task, threshold), 6),
            "pass_hat_k": round(pass_hat_k(m.trials_by_task, threshold), 6),
            "f1": round(mean_f1(m.trials_by_task), 6),
            "cost_usd": round(compute_cost(model_id, m.input_tokens, m.output_tokens), 6),
            "latency_ms": m.latency_ms,
            "total_tokens": m.total_tokens,
            "per_task": m.per_task,
        }
    )
    return rec


def run_matrix(
    harnesses: list[str],
    models: list[str],
    k: int,
    limit: int | None,
    log_dir: str,
    threshold: float = DEFAULT_PASS_THRESHOLD,
    display: str = "none",
) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for harness in harnesses:
        for model_id in models:
            print(f"[runner] cell: {harness} x {model_id} (k={k}, limit={limit})", file=sys.stderr)
            rec = run_cell(harness, model_id, k, limit, log_dir, threshold, display)
            status = "SKIPPED: " + rec["skip_reason"] if rec.get("skipped") else f"f1={rec['f1']} pass@1={rec['pass_at_1']} pass^k={rec['pass_hat_k']}"
            print(f"[runner]   -> {status}", file=sys.stderr)
            records.append(rec)
    return records


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Tessera matrix runner → contract §3 JSON")
    p.add_argument("--harness", action="append", dest="harnesses",
                   help="assembly name (repeatable). Default: all declared assemblies.")
    p.add_argument("--model", action="append", dest="models",
                   help="model id (repeatable). Default: local models.")
    p.add_argument("--k", type=int, default=2, help="trials per cell (epochs). Default 2.")
    p.add_argument("--limit", type=int, default=None, help="limit samples per trial (smoke runs).")
    p.add_argument("--threshold", type=float, default=DEFAULT_PASS_THRESHOLD,
                   help=f"F1 pass threshold for pass@1/pass^k. Default {DEFAULT_PASS_THRESHOLD}.")
    p.add_argument("--out", default="runs/matrix.json", help="output JSON file path.")
    p.add_argument("--log-dir", default="logs", help="Inspect .eval log dir.")
    p.add_argument("--display", default="none", choices=["none", "plain", "rich", "full", "conversation"],
                   help="Inspect display mode. Default none.")
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    harnesses = args.harnesses or assembly_names()
    models = args.models or DEFAULT_MODEL_IDS

    records = run_matrix(
        harnesses=harnesses,
        models=models,
        k=args.k,
        limit=args.limit,
        log_dir=args.log_dir,
        threshold=args.threshold,
        display=args.display,
    )

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(records, indent=2) + "\n", encoding="utf-8")

    # Contract §3 JSON to stdout (the ingestion payload).
    json.dump(records, sys.stdout, indent=2)
    sys.stdout.write("\n")
    print(f"[runner] wrote {len(records)} cell record(s) to {out_path}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
