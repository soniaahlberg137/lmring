"""
Tessera HAL Sidecar

Receives benchmark jobs from lmring, runs hal-eval, and posts results back.

Usage:
  cp .env.example .env          # fill in values
  pip install -r requirements.txt
  uvicorn sidecar:app --port 8765
"""

import asyncio
import json
import logging
import os
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("sidecar")

HAL_DIR = Path(os.environ["HAL_DIR"])
LMRING_CALLBACK_URL = os.environ["LMRING_CALLBACK_URL"]
SIDECAR_SECRET = os.environ["TESSERA_SIDECAR_SECRET"]
# Allow override for non-PATH installations (e.g. inside a venv)
HAL_EVAL_CMD = os.environ.get("HAL_EVAL_CMD", "hal-eval")

# Maps HAL benchmark name → the key inside results{} that holds the primary score (0–1 range)
SCORE_KEYS: dict[str, str] = {
    "gaia": "average",
    "mmlu": "accuracy",
    "swebench_verified": "resolved",
    "swebench_verified_mini": "resolved",
    "taubench_retail": "average",
    "taubench_airline": "average",
    "corebench_easy": "score",
    "corebench_medium": "score",
    "corebench_hard": "score",
}

app = FastAPI(title="Tessera HAL Sidecar")


class RunJob(BaseModel):
    agentId: str
    agentName: str
    baseModel: str
    systemPrompt: str | None = None
    benchmark: str = "gaia"


def _extract_score(raw: dict, benchmark: str) -> float | None:
    # Some benchmarks (e.g. GAIA) produce a flat {task_id: {score, reward, ...}} structure
    # with no top-level "results" wrapper. Detect this by checking whether values are task dicts.
    results = raw.get("results", raw)  # fall back to raw itself if no "results" key

    # If values are task-result dicts (have a "score" or "reward" key), aggregate them
    sample = next(iter(results.values()), None) if results else None
    if isinstance(sample, dict) and ("reward" in sample or "score" in sample):
        rewards = [v["reward"] for v in results.values() if isinstance(v.get("reward"), (int, float))]
        if rewards:
            return sum(rewards) / len(rewards)
        # Fallback: fraction of tasks with score == True
        scores = [v["score"] for v in results.values() if isinstance(v.get("score"), bool)]
        return sum(scores) / len(scores) if scores else None

    # Standard case: results is a flat {key: numeric_value} dict
    key = SCORE_KEYS.get(benchmark, "score")
    val = results.get(key)
    if val is not None:
        return float(val)
    for v in results.values():
        if isinstance(v, (int, float)):
            return float(v)
    return None


async def _callback(payload: dict) -> None:
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                LMRING_CALLBACK_URL,
                json=payload,
                headers={"x-sidecar-secret": SIDECAR_SECRET},
            )
            if resp.status_code not in (200, 201):
                log.warning("Callback returned %s: %s", resp.status_code, resp.text[:200])
    except Exception as exc:
        log.error("Callback failed: %s", exc)


async def _run_benchmark(job: RunJob) -> None:
    benchmark = job.benchmark
    tessera_agent_dir = HAL_DIR / "agents" / "tessera_agent"
    hal_run_id = f"tessera-{job.agentId[:8]}-{benchmark}"
    started_at = datetime.now(timezone.utc).isoformat()

    # Write agent config to a temp file so hal-eval/tessera_agent can read it
    # (avoids shell-quoting issues with long system prompts)
    tmp_dir = Path(tempfile.mkdtemp(prefix=f"tessera-{job.agentId[:8]}-"))
    config_file = tmp_dir / "config.json"
    config_file.write_text(
        json.dumps({
            "agent_id": job.agentId,
            "agent_name": job.agentName,
            "base_model": job.baseModel,
            "system_prompt": job.systemPrompt or "",
        }),
        encoding="utf-8",
    )

    cmd = [
        HAL_EVAL_CMD,
        "--benchmark", benchmark,
        "--agent_dir", str(tessera_agent_dir),
        "--agent_function", "main.run",
        "--agent_name", f"{job.agentName} ({job.baseModel})",
        "--run_id", hal_run_id,
        "-A", f"config_path={config_file}",
    ]

    log.info("Starting benchmark run: %s", hal_run_id)
    log.info("Command: %s", " ".join(cmd))

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(HAL_DIR),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()

        if proc.returncode != 0:
            stderr_tail = stderr.decode(errors="replace")[-2000:]
            raise RuntimeError(f"hal-eval exited {proc.returncode}:\n{stderr_tail}")

        result_path = HAL_DIR / "results" / benchmark / hal_run_id / f"{hal_run_id}.json"
        if not result_path.exists():
            raise FileNotFoundError(f"Result file not found: {result_path}")

        with open(result_path, encoding="utf-8") as f:
            raw = json.load(f)

        score = _extract_score(raw, benchmark)
        completed_at = datetime.now(timezone.utc).isoformat()

        log.info("Run %s completed — score: %s", hal_run_id, score)

        await _callback({
            "agentId": job.agentId,
            "benchmarkName": benchmark,
            "status": "completed",
            "halRunId": hal_run_id,
            "score": score,
            "rawResults": raw,
            "startedAt": started_at,
            "completedAt": completed_at,
        })

    except Exception as exc:
        log.error("Run %s failed: %s", hal_run_id, exc)
        await _callback({
            "agentId": job.agentId,
            "benchmarkName": benchmark,
            "status": "failed",
            "halRunId": hal_run_id,
            "error": str(exc)[:1000],
            "startedAt": started_at,
            "completedAt": datetime.now(timezone.utc).isoformat(),
        })
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


@app.post("/run", status_code=202)
async def run(job: RunJob, x_sidecar_secret: str = Header(...)):
    if x_sidecar_secret != SIDECAR_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if not (HAL_DIR / "agents" / "tessera_agent").exists():
        raise HTTPException(
            status_code=503,
            detail=f"tessera_agent not found in {HAL_DIR}/agents/. Set it up in hal-harness first.",
        )

    asyncio.create_task(_run_benchmark(job))
    return {"status": "accepted", "agentId": job.agentId, "benchmark": job.benchmark}


@app.get("/health")
def health():
    hal_eval_found = shutil.which(HAL_EVAL_CMD) is not None
    tessera_agent_exists = (HAL_DIR / "agents" / "tessera_agent").exists()
    return {
        "status": "ok",
        "hal_dir": str(HAL_DIR),
        "hal_eval_found": hal_eval_found,
        "tessera_agent_exists": tessera_agent_exists,
    }
