"""The **assembly object** — Tessera's first-class, swappable unit-under-test.

Research §6, item 3 ("The 'assembly object'") names this as *the differentiator*:
make `agent.md (system prompt) + tools + model binding + entrypoint` a declared,
swappable config that Inspect's `@agent` / Agent Bridge consumes — the customer
brings their assembly, we vary only the backend.

An `Assembly` is built from an `agent.md` file (lightweight `---` frontmatter +
markdown body = system prompt) plus a builder that turns it into an Inspect
`Agent` (a Solver the suite's `legal_contract_review(solver=...)` accepts).
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path

from inspect_ai.agent import Agent


def parse_agent_md(path: Path | str) -> tuple[dict[str, str], str]:
    """Parse a tiny `---`-delimited frontmatter agent.md into (frontmatter, body).

    Frontmatter is simple `key: value` lines (no nested YAML); body is the rest,
    used verbatim as the system prompt. Files without frontmatter return ({}, full).
    """
    text = Path(path).read_text(encoding="utf-8")
    if not text.startswith("---"):
        return {}, text.strip()
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text.strip()
    _, fm_block, body = parts
    fm: dict[str, str] = {}
    for line in fm_block.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        key, _, value = line.partition(":")
        fm[key.strip()] = value.strip()
    return fm, body.strip()


@dataclass
class Assembly:
    """A declared agent assembly: system prompt + tools + entrypoint + model binding.

    Attributes:
        name: contract `harness` value, e.g. 'bare-agent.md' | 'oh-my-claudecode'.
        md_path: path to the backing agent.md.
        available: whether this assembly can actually run in this environment.
        unavailable_reason: precise human-readable gap when `available` is False.
        _builder: model_id -> Inspect Agent. Only called when `available`.
    """

    name: str
    md_path: Path
    available: bool
    _builder: Callable[[str | None], Agent]
    unavailable_reason: str | None = None
    frontmatter: dict[str, str] = field(default_factory=dict)

    @property
    def system_prompt(self) -> str:
        _fm, body = parse_agent_md(self.md_path)
        return body

    def solver(self, model: str | None = None) -> Agent:
        """Build the Inspect Agent for this assembly bound to `model`.

        Raises RuntimeError with the precise gap if the assembly is unavailable —
        callers (the runner) catch this to emit a clearly-marked *skipped* cell
        rather than a fabricated score.
        """
        if not self.available:
            raise RuntimeError(
                f"assembly '{self.name}' unavailable: {self.unavailable_reason}"
            )
        return self._builder(model)


__all__ = ["Assembly", "parse_agent_md"]
