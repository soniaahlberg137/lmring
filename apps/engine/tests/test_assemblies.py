"""Unit tests for the assembly registry and agent.md parsing (no model run)."""

from assemblies import assembly_names, get_assembly
from assemblies.loader import parse_agent_md


def test_registry_has_both_contestants():
    names = assembly_names()
    assert "bare-agent.md" in names
    assert "oh-my-claudecode" in names


def test_bare_agent_is_available_and_builds():
    a = get_assembly("bare-agent.md")
    assert a.available
    agent = a.solver(model=None)  # builds a real Inspect Agent
    assert agent is not None
    assert "contract-review" in a.system_prompt.lower()


def test_omc_is_stubbed_by_default_with_precise_reason():
    a = get_assembly("oh-my-claudecode")
    assert not a.available
    assert a.unavailable_reason and "bridge" in a.unavailable_reason.lower()


def test_omc_solver_raises_not_fabricates():
    a = get_assembly("oh-my-claudecode")
    try:
        a.solver()
        raised = False
    except RuntimeError:
        raised = True
    assert raised, "unavailable assembly must raise, never silently return a fake"


def test_unknown_assembly_raises():
    try:
        get_assembly("does-not-exist")
        raised = False
    except KeyError:
        raised = True
    assert raised


def test_parse_agent_md_frontmatter():
    fm, body = parse_agent_md(get_assembly("bare-agent.md").md_path)
    assert fm.get("harness") == "bare-agent.md"
    assert fm.get("entrypoint") == "react"
    assert body and "search_clauses" in body
