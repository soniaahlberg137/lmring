"""Unit tests for the contract-review scorer's F1 math and answer parsing.

No model and no live Inspect run required — these exercise the pure functions.
"""

import math

from apps.engine.suites.legal_contract_review.scorer import (
    compute_prf1,
    normalize_category,
    normalize_set,
    parse_flagged,
    redline_coverage,
)


# ---------------------------------------------------------------------------
# F1 math
# ---------------------------------------------------------------------------


def test_perfect_match_f1_is_one():
    p, r, f1 = compute_prf1(["Non-Compete", "Exclusivity"], ["Non-Compete", "Exclusivity"])
    assert (p, r, f1) == (1.0, 1.0, 1.0)


def test_disjoint_f1_is_zero():
    p, r, f1 = compute_prf1(["Non-Compete"], ["Audit Rights"])
    assert (p, r, f1) == (0.0, 0.0, 0.0)


def test_partial_overlap_known_value():
    # predicted {A, B, C}, gold {A, B, D}: TP=2 → P=2/3, R=2/3, F1=2/3.
    p, r, f1 = compute_prf1(
        ["Non-Compete", "Exclusivity", "Audit Rights"],
        ["Non-Compete", "Exclusivity", "Anti-Assignment"],
    )
    assert math.isclose(p, 2 / 3)
    assert math.isclose(r, 2 / 3)
    assert math.isclose(f1, 2 / 3)


def test_recall_miss_precision_perfect():
    # predicted {A}, gold {A, B}: TP=1 → P=1.0, R=0.5, F1=2/3.
    p, r, f1 = compute_prf1(["Non-Compete"], ["Non-Compete", "Exclusivity"])
    assert math.isclose(p, 1.0)
    assert math.isclose(r, 0.5)
    assert math.isclose(f1, 2 / 3)


def test_over_flagging_lowers_precision():
    # predicted {A, B}, gold {A}: TP=1 → P=0.5, R=1.0, F1=2/3.
    p, r, f1 = compute_prf1(["Non-Compete", "Exclusivity"], ["Non-Compete"])
    assert math.isclose(p, 0.5)
    assert math.isclose(r, 1.0)
    assert math.isclose(f1, 2 / 3)


def test_empty_gold_empty_pred_is_perfect():
    assert compute_prf1([], []) == (1.0, 1.0, 1.0)


def test_empty_gold_with_false_positive_is_zero():
    assert compute_prf1(["Non-Compete"], []) == (0.0, 0.0, 0.0)


def test_empty_pred_with_gold_is_zero():
    assert compute_prf1([], ["Non-Compete"]) == (0.0, 0.0, 0.0)


def test_duplicate_predictions_collapse_to_set():
    p, r, f1 = compute_prf1(
        ["Non-Compete", "Non-Compete", "non compete"], ["Non-Compete"]
    )
    assert (p, r, f1) == (1.0, 1.0, 1.0)


# ---------------------------------------------------------------------------
# Normalization
# ---------------------------------------------------------------------------


def test_normalize_aliases():
    assert normalize_category("noncompete") == "Non-Compete"
    assert normalize_category("MFN") == "Most Favored Nation"
    assert normalize_category("change of control") == "Change Of Control"
    assert normalize_category("source code escrow") == "Source Code Escrow"


def test_normalize_unknown_returns_none():
    assert normalize_category("Force Majeure") is None
    assert normalize_category("") is None


def test_normalize_set_drops_unknown():
    out = normalize_set(["Non-Compete", "Force Majeure", "mfn"])
    assert out == {"Non-Compete", "Most Favored Nation"}


# ---------------------------------------------------------------------------
# Answer parsing
# ---------------------------------------------------------------------------


def test_parse_json_object_form():
    text = (
        'Here is my review:\n'
        '{"flagged": [{"category": "Non-Compete", "redline": "Limit to 6 months"},'
        ' {"category": "Exclusivity", "redline": "Make non-exclusive"}]}'
    )
    flagged = parse_flagged(text)
    cats = {f["category"] for f in flagged}
    assert cats == {"Non-Compete", "Exclusivity"}
    assert all(f["redline"] for f in flagged)


def test_parse_json_array_form():
    text = '[{"category": "Audit Rights", "redline": "Cap at once per year"}]'
    flagged = parse_flagged(text)
    assert flagged == [{"category": "Audit Rights", "redline": "Cap at once per year"}]


def test_parse_empty_flagged():
    assert parse_flagged('{"flagged": []}') == []


def test_parse_loose_lines_fallback():
    text = "- Non-Compete: narrow the scope\n- MFN: delete this clause"
    flagged = parse_flagged(text)
    cats = {f["category"] for f in flagged}
    assert cats == {"Non-Compete", "Most Favored Nation"}


def test_parse_drops_unknown_categories():
    text = '{"flagged": [{"category": "Force Majeure", "redline": "x"}]}'
    assert parse_flagged(text) == []


def test_redline_coverage():
    flagged = [
        {"category": "Non-Compete", "redline": "shorten"},
        {"category": "Exclusivity", "redline": ""},
    ]
    assert math.isclose(redline_coverage(flagged), 0.5)
    assert redline_coverage([]) == 0.0
