"""The `bare-agent.md` assembly — a REAL minimal Inspect react() agent.

This is the v0 baseline contestant: just a system prompt (from bare-agent.md) +
the suite's clause-retrieval tools + a model binding, run as an Inspect react()
loop. No skills, no memory, no MCP — deliberately the floor that the
oh-my-claudecode assembly is measured against.
"""

from __future__ import annotations

from pathlib import Path

from inspect_ai.agent import Agent, react

from suites.legal_contract_review import contract_tools

from .loader import Assembly, parse_agent_md

MD_PATH = Path(__file__).parent / "bare-agent.md"


def _build(model: str | None = None) -> Agent:
    """A react() agent: bare-agent.md system prompt + contract tools + model.

    `model=None` lets the agent inherit the model under test from the eval call,
    which is exactly the "swap only the backend" property we want.
    """
    _fm, prompt = parse_agent_md(MD_PATH)
    return react(
        name="bare_agent",
        description="Minimal contract-review react() agent (bare-agent.md baseline).",
        prompt=prompt,
        tools=contract_tools(),
        model=model,
    )


def build() -> Assembly:
    """The bare-agent.md assembly. Always available (pure-local react loop)."""
    fm, _body = parse_agent_md(MD_PATH)
    return Assembly(
        name="bare-agent.md",
        md_path=MD_PATH,
        available=True,
        _builder=_build,
        frontmatter=fm,
    )


__all__ = ["build", "MD_PATH"]
