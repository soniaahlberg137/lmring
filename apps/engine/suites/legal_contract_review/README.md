# Legal Contract-Review Suite (`legal_contract_review`)

Domain: **legal** · Suite: **legal_contract_review** · Harness: **Inspect AI**

Benchmarks an *assembled agent* (harness × model) on contract redlining: given a
contract it cannot see directly and a **risk playbook** of clause categories, the
agent must investigate the contract with retrieval tools, **flag the risky clauses
that are present**, and propose a redline for each. Scoring is a programmatic
**precision / recall / F1** over the flagged clause categories vs. the gold
issue-list — no LLM-as-judge in the primary score.

## Inspect shape

```
Dataset (dataset.py) → load_contract solver → Agent/Solver → Scorer (scorer.py)
```

- **`dataset.py`** — builds `Sample`s from `fixtures/cuad_subset.json`. `input` =
  risk playbook + instructions (the contract text is withheld from the prompt);
  `target` = gold issue-list (comma-separated canonical categories, `""` = no
  risk); `metadata.sections` carries the contract for the tools.
- **`tools.py`** — `search_clauses(query)` and `get_section(n)` over the per-sample
  contract (string-backed, no network). The retrieval logic is pure/testable; the
  `@tool` wrappers read the contract from the Inspect store, seeded by the
  `load_contract()` solver.
- **`scorer.py`** — parses the agent's JSON answer, normalizes category labels,
  computes set-overlap P/R/F1 (the headline `f1` feeds the runner's `per_task`
  array), plus a secondary `redline_coverage` metric (did it propose a change for
  flagged clauses?) and an `exact` set-match accuracy.
- **`task.py`** — assembles the `@task legal_contract_review`. The runner injects
  the assembly under test via `solver=`; standalone it falls back to a default
  `react()` agent so the baseline is runnable.

## Running

Create a Python 3.11+ venv (the engine venv; this suite assumes `inspect_ai` is
available) and run the baseline:

```bash
# from apps/engine
uv venv --python 3.11 && source .venv/bin/activate
uv pip install inspect-ai pytest

# unit tests (no model needed)
python -m pytest suites/legal_contract_review/tests --import-mode=importlib -q

# live baseline against local Ollama (model qwen3:8b on 127.0.0.1:11435)
export OLLAMA_BASE_URL=http://127.0.0.1:11435/v1 OPENAI_API_KEY=ollama
inspect eval suites/legal_contract_review/task.py --model ollama/qwen3:8b --limit 2
```

The runner can also import `legal_contract_review(solver=<assembly>)` directly to
swap in the assembled agent under test while keeping the dataset and scorer fixed.

## Metrics

| metric | meaning |
|---|---|
| `f1` (headline) | set-overlap F1 of flagged categories vs. gold |
| `precision`, `recall` | components of F1 |
| `exact` | 1.0 iff flagged set == gold set (accuracy aggregate) |
| `redline_coverage` | fraction of flagged clauses with a non-empty redline (secondary) |

Empty-gold convention: a contract with no risky clauses scores F1=1.0 only if the
agent flags nothing; any false positive scores 0.0.

## Data & licensing — CUAD

The clause categories follow the taxonomy of **CUAD** (Contract Understanding
Atticus Dataset, v1), created by **The Atticus Project** and released under
**CC-BY-4.0**.

- Project: https://www.atticusprojectai.org/cuad
- Paper: Hendrycks et al., "CUAD: An Expert-Annotated NLP Dataset for Legal
  Contract Review" (NeurIPS 2021) — https://arxiv.org/abs/2103.06268
- Archive (Zenodo): https://zenodo.org/records/4595826

This suite ships only a **tiny curated subset** (`fixtures/cuad_subset.json`, 12
samples) so it runs offline and deterministically. The clause text is
paraphrased/abridged from common commercial-contract patterns and labelled with
CUAD's category names; **no large CUAD files are vendored**. To expand the suite,
fetch the full corpus (see `download.py`) and convert it to the fixture schema.

Attribution: portions derived from CUAD © The Atticus Project, licensed CC-BY-4.0.

## Contamination / bias notes (research §5)

- Primary score is **programmatic F1**, not LLM-as-judge — avoids self-preference,
  position, and verbosity bias when the judged model is also a contestant.
- Gold labels are held in the fixture as the authoritative key; the contract text
  is withheld from the prompt and only reachable through tools, reducing trivial
  prompt-pattern matching.
- For a living benchmark, rotate/expand the vendored subset from full CUAD on a
  cadence to mitigate contamination drift.
