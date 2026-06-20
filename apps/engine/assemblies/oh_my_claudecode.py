"""The `oh-my-claudecode` assembly — Inspect Agent Bridge integration.

STATUS (be precise): **documented stub by default.** The bridge *interface* below
is real and correct; what is missing is an external OMC/Claude-Code harness wired
to issue its model calls through Inspect. This module makes that gap explicit
rather than fabricating scores.

## How the real wiring works (Inspect Agent Bridge — research §3, §6)
`bridge(agent_fn)` wraps an async callable `agent_fn(sample: dict) -> dict` that
behaves like an OpenAI-Agents-style agent: it reads `sample["input"]` (the
OpenAI-format messages), runs its own multi-step loop issuing chat-completion
calls **with `model="inspect"`**, and returns `{"output": "<final text>"}`.
Inspect intercepts every `model="inspect"` call and routes it to whichever
backend is under test — so the *same* OMC scaffold runs unchanged on qwen3:8b,
qwen3:14b, Kimi K2, etc. (the core "swap only the backend" property).

## The exact gap to flip this on (what's NOT done in this lane)
1. **OMC must speak to the bridge.** The OMC/Claude-Code CLI needs to point its
   model client at an OpenAI-compatible endpoint with model id `inspect` (set its
   base URL/model via env to the bridge that Inspect exposes during a run), OR be
   invoked in-process from `_omc_bridge_agent` below. Today OMC has no such
   "use this base_url + model=inspect" switch wired here.
2. **Tool parity.** The bridged OMC must call the SAME `search_clauses` /
   `get_section` retrieval tools (exposed as OpenAI tool-schemas) so the assembly
   is genuinely comparable to the baseline. The bridge passes tools through the
   `model="inspect"` calls; OMC must register them.
3. **Enable flag.** Set `TESSERA_ENABLE_OMC_BRIDGE=1` once 1+2 are in place; until
   then this assembly reports `available=False` and the runner emits a clearly
   marked *skipped* cell (never a fabricated number).
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from inspect_ai.agent import Agent, bridge

from .loader import Assembly, parse_agent_md

MD_PATH = Path(__file__).parent / "oh-my-claudecode.md"

# Flip to "1" only when the OMC harness is wired to the bridge (see module docstring).
ENABLE_ENV = "TESSERA_ENABLE_OMC_BRIDGE"


async def _omc_bridge_agent(sample: dict[str, Any]) -> dict[str, Any]:
    """Bridge entrypoint: drive the OMC harness, routing calls to model="inspect".

    This is the real Agent-Bridge contract. The body is intentionally NOT faked:
    when the OMC harness is actually wired (see gap items 1-2), replace the raise
    below with the OMC invocation loop that issues `model="inspect"` completions
    against `sample["input"]` and returns `{"output": <final answer text>}`.
    """
    raise NotImplementedError(
        "oh-my-claudecode bridge is not wired: no OMC harness is configured to "
        "issue model='inspect' calls. See oh_my_claudecode.py docstring, gap 1-2."
    )


def _build(model: str | None = None) -> Agent:
    # When available, the SAME bridged scaffold runs on whatever backend the eval
    # binds; the bridge ignores `model` here because routing is via model="inspect".
    return bridge(_omc_bridge_agent)


def _detect_availability() -> tuple[bool, str | None]:
    if os.environ.get(ENABLE_ENV) == "1":
        return True, None
    return (
        False,
        (
            "OMC Agent Bridge not enabled. The bridge interface exists "
            "(_omc_bridge_agent) but no external OMC/Claude-Code harness is wired "
            f"to issue model='inspect' calls. Set {ENABLE_ENV}=1 after wiring the "
            "OMC client base_url + tool parity (see module docstring, gaps 1-3)."
        ),
    )


def build() -> Assembly:
    """The oh-my-claudecode assembly. Stubbed (available=False) by default."""
    available, reason = _detect_availability()
    fm, _body = parse_agent_md(MD_PATH)
    return Assembly(
        name="oh-my-claudecode",
        md_path=MD_PATH,
        available=available,
        _builder=_build,
        unavailable_reason=reason,
        frontmatter=fm,
    )


__all__ = ["build", "MD_PATH", "ENABLE_ENV"]
