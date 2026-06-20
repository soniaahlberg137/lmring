"""Dataset loader for the legal contract-review suite.

Builds Inspect `Sample`s from the vendored CUAD subset. Each sample's:
  - input    = a risk playbook (which clause categories are risky to flag) plus
               instructions; the contract text itself is NOT in the prompt — the
               agent must retrieve it through the tools (see tools.py).
  - target   = the gold issue-list (comma-separated canonical categories that are
               actually present and should be flagged; "" means no risk).
  - metadata = the contract sections (consumed by the solver to seed the store),
               the title, and the playbook.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from inspect_ai.dataset import MemoryDataset, Sample

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "cuad_subset.json"


def load_fixture(path: Path | str = FIXTURE_PATH) -> dict[str, Any]:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _format_input(playbook: list[str], description: str, title: str) -> str:
    bullets = "\n".join(f"  - {c}" for c in playbook)
    return (
        f"You are reviewing a contract titled \"{title}\".\n\n"
        "You cannot see the contract directly. Use the `search_clauses` and "
        "`get_section` tools to read it.\n\n"
        f"RISK PLAYBOOK — {description}\n{bullets}\n\n"
        "TASK:\n"
        "1. Investigate the contract using the tools.\n"
        "2. Identify which playbook categories are PRESENT in this contract.\n"
        "3. For each flagged clause, propose a short redline (a concrete change "
        "to reduce the risk).\n\n"
        "Respond with ONLY a JSON object in this exact shape (no prose around it):\n"
        '{"flagged": [{"category": "<one of the playbook categories>", '
        '"redline": "<your proposed change>"}]}\n'
        "If no playbook category is present, respond with {\"flagged\": []}."
    )


def contract_review_dataset(path: Path | str = FIXTURE_PATH) -> MemoryDataset:
    """Build the Inspect dataset from the vendored fixture."""
    data = load_fixture(path)
    playbook: list[str] = data["risk_playbook"]
    description: str = data.get("playbook_description", "Flag every category present.")

    samples: list[Sample] = []
    for s in data["samples"]:
        gold = s.get("gold", [])
        samples.append(
            Sample(
                id=s["id"],
                input=_format_input(playbook, description, s["title"]),
                target=", ".join(gold),
                metadata={
                    "title": s["title"],
                    "sections": s["sections"],
                    "playbook": playbook,
                },
            )
        )
    return MemoryDataset(samples=samples, name="legal_contract_review")
