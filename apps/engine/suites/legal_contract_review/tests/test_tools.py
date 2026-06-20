"""Unit tests for clause-retrieval logic and dataset construction.

Exercises the pure functions over a fixture contract; no Inspect run needed.
"""

import pytest

from apps.engine.suites.legal_contract_review.dataset import (
    contract_review_dataset,
    load_fixture,
)
from apps.engine.suites.legal_contract_review.tools import (
    get_section_text,
    search_sections,
)

SECTIONS = [
    {"n": 1, "heading": "Appointment", "text": "Supplier appoints Distributor."},
    {
        "n": 2,
        "heading": "Non-Competition",
        "text": "Distributor shall not develop or sell any competing product.",
    },
    {
        "n": 3,
        "heading": "Audit",
        "text": "Customer may audit the books once per calendar year.",
    },
]


# ---------------------------------------------------------------------------
# get_section_text
# ---------------------------------------------------------------------------


def test_get_section_returns_heading_and_text():
    out = get_section_text(SECTIONS, 2)
    assert "Non-Competition" in out
    assert "competing product" in out
    assert out.startswith("§2")


def test_get_section_missing_raises_keyerror():
    with pytest.raises(KeyError):
        get_section_text(SECTIONS, 99)


# ---------------------------------------------------------------------------
# search_sections
# ---------------------------------------------------------------------------


def test_search_finds_relevant_clause():
    results = search_sections(SECTIONS, "non-compete competing")
    assert results, "expected at least one match"
    assert results[0]["n"] == 2


def test_search_finds_audit_clause():
    results = search_sections(SECTIONS, "audit books")
    assert results[0]["n"] == 3


def test_search_no_match_returns_empty():
    assert search_sections(SECTIONS, "indemnification insurance") == []


def test_search_empty_query_returns_empty():
    assert search_sections(SECTIONS, "   ") == []


def test_search_respects_limit():
    results = search_sections(SECTIONS, "the", limit=1)
    assert len(results) <= 1


# ---------------------------------------------------------------------------
# Dataset / fixture integrity
# ---------------------------------------------------------------------------


def test_fixture_loads_and_has_samples():
    data = load_fixture()
    assert len(data["samples"]) >= 10
    assert len(data["risk_playbook"]) == 12


def test_gold_labels_are_within_playbook():
    data = load_fixture()
    playbook = set(data["risk_playbook"])
    for s in data["samples"]:
        for g in s.get("gold", []):
            assert g in playbook, f"{s['id']}: gold label '{g}' not in playbook"


def test_dataset_builds_samples_with_targets():
    ds = contract_review_dataset()
    assert len(ds) >= 10
    sample = ds[0]
    assert sample.id == "cuad-0001"
    assert "Non-Compete" in sample.target
    assert sample.metadata is not None and "sections" in sample.metadata
    # Contract text must NOT be leaked into the prompt.
    assert "Distributor shall not" not in sample.input


def test_negative_sample_has_empty_target():
    ds = contract_review_dataset()
    by_id = {s.id: s for s in ds}
    assert by_id["cuad-0007"].target == ""
