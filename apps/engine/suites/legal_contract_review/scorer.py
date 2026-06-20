"""Scorer for the legal contract-review suite.

Primary metric is a programmatic **precision/recall/F1** over the set of clause
categories the agent flagged vs. the gold issue-list (per CUAD). We deliberately
AVOID LLM-as-judge for the primary score to dodge self-preference / position /
verbosity bias when the judge model is also a contestant (research §5).

A secondary, non-scoring metric records *redline presence*: did the agent propose
a concrete change for the clauses it flagged?

The set/F1 math and parsing live in plain functions so they can be unit-tested
without a model or a live Inspect run.
"""

from __future__ import annotations

import json
import re
from typing import Iterable

from inspect_ai.scorer import (
    Score,
    Scorer,
    Target,
    accuracy,
    mean,
    scorer,
    stderr,
)
from inspect_ai.solver import TaskState

# ---------------------------------------------------------------------------
# Category normalization
# ---------------------------------------------------------------------------

# Canonical CUAD-style category labels used by this suite's risk playbook.
CANONICAL_CATEGORIES: list[str] = [
    "Non-Compete",
    "Exclusivity",
    "Most Favored Nation",
    "Anti-Assignment",
    "Termination For Convenience",
    "Uncapped Liability",
    "Liquidated Damages",
    "Minimum Commitment",
    "IP Ownership Assignment",
    "Audit Rights",
    "Source Code Escrow",
    "Change Of Control",
]

# Common surface variants → canonical label. Keys are normalized (see _norm_key).
_ALIASES: dict[str, str] = {
    "noncompete": "Non-Compete",
    "noncompetition": "Non-Compete",
    "nocompete": "Non-Compete",
    "exclusive": "Exclusivity",
    "exclusivedealing": "Exclusivity",
    "mfn": "Most Favored Nation",
    "mostfavorednation": "Most Favored Nation",
    "mostfavoredcustomer": "Most Favored Nation",
    "mostfavourednation": "Most Favored Nation",
    "antiassignment": "Anti-Assignment",
    "noassignment": "Anti-Assignment",
    "assignment": "Anti-Assignment",
    "terminationforconvenience": "Termination For Convenience",
    "terminationconvenience": "Termination For Convenience",
    "uncappedliability": "Uncapped Liability",
    "unlimitedliability": "Uncapped Liability",
    "nocaponliability": "Uncapped Liability",
    "liquidateddamages": "Liquidated Damages",
    "minimumcommitment": "Minimum Commitment",
    "minimumpurchase": "Minimum Commitment",
    "minimumorder": "Minimum Commitment",
    "ipownershipassignment": "IP Ownership Assignment",
    "ipassignment": "IP Ownership Assignment",
    "ipownership": "IP Ownership Assignment",
    "ownershipofdeliverables": "IP Ownership Assignment",
    "workproduct": "IP Ownership Assignment",
    "auditrights": "Audit Rights",
    "audit": "Audit Rights",
    "sourcecodeescrow": "Source Code Escrow",
    "escrow": "Source Code Escrow",
    "changeofcontrol": "Change Of Control",
    "coc": "Change Of Control",
}


def _norm_key(value: str) -> str:
    """Reduce a label to a comparison key: lowercase alphanumerics only."""
    return re.sub(r"[^a-z0-9]", "", value.lower())


def normalize_category(value: str) -> str | None:
    """Map a free-form category label to a canonical label, or None if unknown."""
    key = _norm_key(value)
    if not key:
        return None
    # Direct canonical match.
    for canon in CANONICAL_CATEGORIES:
        if _norm_key(canon) == key:
            return canon
    # Alias match.
    if key in _ALIASES:
        return _ALIASES[key]
    return None


def normalize_set(values: Iterable[str]) -> set[str]:
    """Normalize an iterable of labels into a set of canonical labels."""
    out: set[str] = set()
    for v in values:
        canon = normalize_category(v)
        if canon is not None:
            out.add(canon)
    return out


# ---------------------------------------------------------------------------
# Precision / recall / F1
# ---------------------------------------------------------------------------


def compute_prf1(
    predicted: Iterable[str], gold: Iterable[str]
) -> tuple[float, float, float]:
    """Set-overlap precision, recall, and F1 over canonical categories.

    Convention for the empty-gold case (a contract with no risky clauses):
    - predicted empty  → perfect (1.0/1.0/1.0): correctly flagged nothing.
    - predicted non-empty → 0.0/0.0/0.0: every flag is a false positive.
    """
    pred = normalize_set(predicted)
    gold_set = normalize_set(gold)

    if not gold_set:
        return (1.0, 1.0, 1.0) if not pred else (0.0, 0.0, 0.0)
    if not pred:
        return (0.0, 0.0, 0.0)

    tp = len(pred & gold_set)
    precision = tp / len(pred)
    recall = tp / len(gold_set)
    f1 = 0.0 if (precision + recall) == 0 else 2 * precision * recall / (precision + recall)
    return (precision, recall, f1)


# ---------------------------------------------------------------------------
# Parsing the agent's answer
# ---------------------------------------------------------------------------


def _balanced_block(text: str, open_ch: str, close_ch: str) -> str | None:
    """Return the outermost balanced block from the first opener, or None."""
    start = text.find(open_ch)
    if start == -1:
        return None
    depth = 0
    for i in range(start, len(text)):
        if text[i] == open_ch:
            depth += 1
        elif text[i] == close_ch:
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    return None


def _candidate_lists(text: str) -> "list | None":
    """Pull a list of flagged-entries out of the text via JSON, or None."""
    # Prefer an object containing "flagged"; fall back to a bare array.
    for block in (_balanced_block(text, "{", "}"), _balanced_block(text, "[", "]")):
        if block is None:
            continue
        try:
            parsed = json.loads(block)
        except (json.JSONDecodeError, ValueError):
            continue
        if isinstance(parsed, dict) and isinstance(parsed.get("flagged"), list):
            return parsed["flagged"]
        if isinstance(parsed, list):
            return parsed
    return None


def parse_flagged(text: str) -> list[dict[str, str]]:
    """Parse the agent's final answer into a list of {category, redline} dicts.

    Accepts (in priority order):
      1. A JSON object  {"flagged": [{"category": "...", "redline": "..."}, ...]}
      2. A JSON array   [{"category": "...", "redline": "..."}, ...]
      3. Loose lines    "- Non-Compete: <proposed change>"
    Unknown categories are dropped; categories are canonicalized.
    """
    items: list[dict[str, str]] = []

    raw_list = _candidate_lists(text)
    if raw_list is not None:
        for entry in raw_list:
            if isinstance(entry, str):
                canon = normalize_category(entry)
                if canon:
                    items.append({"category": canon, "redline": ""})
            elif isinstance(entry, dict):
                cat = entry.get("category") or entry.get("clause") or entry.get("issue")
                if not isinstance(cat, str):
                    continue
                canon = normalize_category(cat)
                if not canon:
                    continue
                redline = entry.get("redline") or entry.get("proposal") or entry.get("change") or ""
                items.append({"category": canon, "redline": str(redline).strip()})
        if items:
            return _dedupe(items)

    # 3: Loose line parsing as a fallback. Separator is a colon only, so that an
    # internal hyphen ("Non-Compete") is not mistaken for the category/redline
    # boundary.
    for line in text.splitlines():
        m = re.match(r"\s*[-*\d.)\s]*([A-Za-z][A-Za-z0-9 /&'-]+?)\s*:\s*(.+)$", line)
        if not m:
            continue
        canon = normalize_category(m.group(1))
        if canon:
            items.append({"category": canon, "redline": m.group(2).strip()})

    return _dedupe(items)


def _dedupe(items: list[dict[str, str]]) -> list[dict[str, str]]:
    """Keep the first occurrence (richest redline) per canonical category."""
    seen: dict[str, dict[str, str]] = {}
    for it in items:
        cat = it["category"]
        if cat not in seen or (not seen[cat]["redline"] and it["redline"]):
            seen[cat] = it
    return list(seen.values())


def redline_coverage(flagged: list[dict[str, str]]) -> float:
    """Fraction of flagged clauses that include a non-empty redline proposal."""
    if not flagged:
        return 0.0
    with_redline = sum(1 for it in flagged if it.get("redline", "").strip())
    return with_redline / len(flagged)


# ---------------------------------------------------------------------------
# Inspect scorer
# ---------------------------------------------------------------------------


@scorer(metrics={"f1": [mean(), stderr()], "precision": [mean()], "recall": [mean()], "redline_coverage": [mean()], "exact": [accuracy()]})
def contract_review_scorer() -> Scorer:
    """Score one contract-review sample.

    Score.value is a dict of metrics; Score.value['f1'] is the headline used for
    the per-task F1 array the runner ingests. The gold issue-list comes from the
    sample target (comma-separated canonical categories; empty string = no risk).
    """

    async def score(state: TaskState, target: Target) -> Score:
        gold = [t for t in (s.strip() for s in target.text.split(",")) if t]
        completion = state.output.completion or ""
        flagged = parse_flagged(completion)
        predicted = [it["category"] for it in flagged]

        precision, recall, f1 = compute_prf1(predicted, gold)
        cov = redline_coverage(flagged)
        gold_set = normalize_set(gold)
        pred_set = normalize_set(predicted)
        exact = 1.0 if pred_set == gold_set else 0.0

        return Score(
            value={
                "f1": f1,
                "precision": precision,
                "recall": recall,
                "redline_coverage": cov,
                "exact": exact,
            },
            answer=", ".join(sorted(pred_set)) if pred_set else "(none)",
            explanation=(
                f"gold={sorted(gold_set)} predicted={sorted(pred_set)} "
                f"P={precision:.2f} R={recall:.2f} F1={f1:.2f} redline={cov:.2f}"
            ),
        )

    return score
