# Tessera Engine (`apps/engine`)

The benchmark **engine** for Tessera v0. It fans an *assembled agent*
(`harness × model`) over the real `legal_contract_review` Inspect suite, runs
`k` trials per cell, and emits the **contract §3 ingestion JSON** (one object per
matrix cell) that Lane C persists and Lane D renders on the leaderboard.

> Unit under test = the **assembled agent**, not the bare model (research §3/§6).
> v0 compares `oh-my-claudecode` vs `bare-agent.md` across local Ollama models.

This is a **standalone `uv` Python project** — intentionally *outside* the
pnpm/JS workspace (it has no `package.json`; `pnpm-workspace.yaml` only globs JS
packages under `apps/*`). Build/test it with `uv`, not `pnpm`.

## Layout

```
apps/engine/
├── pyproject.toml          # uv project; deps inspect-ai, litellm, pytest; pytest config
├── models.py               # model registry (local Ollama @ :11435; API models commented)
├── cost.py                 # token→USD price table + cost (0 for local). Unit-tested.
├── metrics.py              # pass@1 / pass^k / pass@k reliability math. Unit-tested.
├── runner.py               # fans eval() over {assembly}×{model}, k trials, emits §3 JSON
├── assemblies/             # the "assembly object" — first-class swappable unit-under-test
│   ├── loader.py           #   Assembly dataclass + agent.md frontmatter parser
│   ├── bare_agent.py       #   bare-agent.md → real Inspect react() agent (always available)
│   ├── bare-agent.md       #   system prompt + tool/entrypoint declaration
│   ├── oh_my_claudecode.py #   OMC via Inspect Agent Bridge (stub by default — see below)
│   └── oh-my-claudecode.md
├── suites/                 # Lane B's committed suite — DO NOT MODIFY
│   └── legal_contract_review/   (dataset.py, tools.py, scorer.py, task.py, fixtures, tests/)
└── tests/                  # engine unit tests (cost, metrics, assemblies)
```

## Setup (uv; Python 3.11+)

System Python is 3.9.6 (too old for Inspect AI). Use `uv`:

```bash
cd apps/engine
uv venv --python 3.11
uv sync --extra dev
```

Shell hygiene (the zsh `node`/`pnpm` are shadowed by a broken nvm function):
`unset -f node pnpm npm npx nvm _omc_load_nvm 2>/dev/null`.

## Tests

```bash
cd apps/engine
uv run pytest          # or: .venv/bin/python -m pytest
```

Runs **53 tests**: the 29 committed suite tests (scorer/tools/dataset) **plus**
24 engine tests (cost, pass^k math, assembly registry). The suite tests import
via `apps.engine.suites...`; `pyproject.toml`'s `[tool.pytest.ini_options]`
sets `pythonpath = [".", "../.."]` so both the repo-root package path and the
bare engine modules resolve — **no PYTHONPATH hack needed**.

## Running the matrix

```bash
# Full local matrix: {bare-agent.md, oh-my-claudecode} × {qwen3:8b, qwen3:14b}
uv run python runner.py --k 2 --limit 2

# A single cell (the live smoke):
OPENAI_API_KEY=ollama uv run python runner.py \
  --harness bare-agent.md --model ollama/qwen3:8b --k 1 --limit 1
```

The runner writes the contract §3 JSON array to `--out` (default
`runs/matrix.json`) and to **stdout**; progress goes to stderr. Each object:

```json
{ "harness": "bare-agent.md", "model_id": "ollama/qwen3:8b",
  "suite": "legal_contract_review", "domain": "legal", "k": 2,
  "pass_at_1": 0.5, "pass_hat_k": 0.0, "f1": 0.58,
  "cost_usd": 0.0, "latency_ms": 41230, "total_tokens": 18450,
  "runner_image_digest": null, "suite_hash": "sha256:...",
  "per_task": [ { "task_slug": "cuad-0001", "metric": "f1", "value": 0.6, "trial": 0 } ] }
```

A "pass" for pass@1/pass^k is `F1 ≥ --threshold` (default 0.5) on a trial.
**pass^k** (all k trials pass) is the honest reliability signal (research §1).

### Cells that can't run are SKIPPED, never faked

Honesty rule (research §5): a cell whose assembly is unavailable (OMC stub) or
whose model is absent is emitted with `"skipped": true`, a precise
`"skip_reason"`, and **null metrics** — scores are never fabricated.

## Local models — Ollama on :11435 (NOT 11434)

Default 11434 is the user's Apple FoundationModels server. Ollama for this
project runs on **127.0.0.1:11435**:

```bash
OLLAMA_HOST=127.0.0.1:11435 ollama list      # qwen3:8b, qwen3:14b
```

`models.py` binds local models to `http://127.0.0.1:11435/v1`
(override with `TESSERA_OLLAMA_BASE_URL`). API models (incl. **Kimi K2 / M4**)
are listed-but-commented in `models.py`; `cost.py` already carries reference
prices so an API cell gets a real `$` the moment it's enabled.

## OMC Agent-Bridge status (be precise)

`bare-agent.md` is a **real** Inspect `react()` agent and runs live today.

`oh-my-claudecode` is wired through Inspect's **Agent Bridge** but ships as a
**documented stub** (`available=False`) in this lane. The bridge *interface*
(`_omc_bridge_agent` in `assemblies/oh_my_claudecode.py`) is real and correct;
the exact remaining gap to flip it on:

1. **OMC must speak to the bridge** — the OMC/Claude-Code CLI must issue its
   model calls with `model="inspect"` against the endpoint Inspect exposes during
   a run (base_url/model via env), or be invoked in-process from the bridge fn.
2. **Tool parity** — the bridged OMC must call the same `search_clauses` /
   `get_section` tools so the comparison to the baseline is fair.
3. **Enable flag** — set `TESSERA_ENABLE_OMC_BRIDGE=1` once 1+2 are done.

Until then the runner emits OMC cells as skipped with this reason. This is the
known integration gap handed to M2/integration.

## Data & licensing

The suite uses a tiny curated CUAD-derived fixture (12 samples) — see
`suites/legal_contract_review/README.md`. Categories follow CUAD © The Atticus
Project (CC-BY-4.0).
