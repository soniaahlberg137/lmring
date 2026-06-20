"""Assembly registry — the first-class, swappable units-under-test.

v0 ships two contestants:
  - `bare-agent.md`     : minimal react() baseline (always available)
  - `oh-my-claudecode`  : Inspect Agent Bridge integration (stubbed by default)

The runner asks this registry for an assembly by its contract `harness` name and
calls `.solver(model)` to get an Inspect Agent. Unavailable assemblies raise on
`.solver()` so the runner emits a clearly-marked skipped cell.
"""

from __future__ import annotations

from . import bare_agent, oh_my_claudecode
from .loader import Assembly, parse_agent_md


def _registry() -> dict[str, Assembly]:
    return {a.name: a for a in (bare_agent.build(), oh_my_claudecode.build())}


def all_assemblies() -> list[Assembly]:
    """Every declared assembly (available or not)."""
    return list(_registry().values())


def assembly_names() -> list[str]:
    return list(_registry().keys())


def get_assembly(name: str) -> Assembly:
    reg = _registry()
    if name not in reg:
        raise KeyError(
            f"unknown assembly '{name}'. known: {sorted(reg)}"
        )
    return reg[name]


__all__ = [
    "Assembly",
    "parse_agent_md",
    "all_assemblies",
    "assembly_names",
    "get_assembly",
]
