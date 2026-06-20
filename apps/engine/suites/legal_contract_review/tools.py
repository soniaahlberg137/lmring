"""Inspect tools for clause retrieval over a single contract.

The agent under test cannot see the full contract in its prompt; it must call
these tools to retrieve sections and search for clauses. This mirrors a real
review workflow (retrieve → assess → redline) and keeps the suite offline and
network-free.

The retrieval logic is implemented as plain functions (`search_sections`,
`get_section_text`) so it can be unit-tested without an Inspect run. The `@tool`
wrappers read the per-sample contract from the Inspect store, which the solver
populates via `load_contract()` (see task.py).
"""

from __future__ import annotations

from typing import Any

from inspect_ai.tool import Tool, ToolError, tool
from inspect_ai.util import store

# Store key under which the per-sample contract sections are kept.
STORE_KEY = "contract_sections"


# ---------------------------------------------------------------------------
# Pure retrieval logic (unit-testable)
# ---------------------------------------------------------------------------


def get_section_text(sections: list[dict[str, Any]], n: int) -> str:
    """Return a formatted section by its 1-based number, or raise KeyError."""
    for sec in sections:
        if int(sec["n"]) == int(n):
            heading = sec.get("heading", "")
            return f"§{sec['n']} {heading}\n{sec['text']}".strip()
    raise KeyError(n)


def search_sections(
    sections: list[dict[str, Any]], query: str, limit: int = 5
) -> list[dict[str, Any]]:
    """Rank sections by overlap with the query terms.

    Returns up to `limit` matches as dicts {n, heading, text, score}, sorted by
    descending score then ascending section number. Scoring is a simple
    case-insensitive term-overlap (count of query tokens found in heading+text),
    with a phrase-match bonus. Deterministic and dependency-free.
    """
    q = query.lower().strip()
    if not q:
        return []
    terms = [t for t in _tokenize(q) if t]
    results: list[dict[str, Any]] = []
    for sec in sections:
        hay = f"{sec.get('heading', '')} {sec.get('text', '')}".lower()
        score = sum(1 for t in set(terms) if t in hay)
        if q in hay:  # phrase bonus
            score += 2
        if score > 0:
            results.append(
                {
                    "n": sec["n"],
                    "heading": sec.get("heading", ""),
                    "text": sec.get("text", ""),
                    "score": score,
                }
            )
    results.sort(key=lambda r: (-r["score"], int(r["n"])))
    return results[:limit]


def _tokenize(text: str) -> list[str]:
    out: list[str] = []
    word = []
    for ch in text:
        if ch.isalnum():
            word.append(ch)
        else:
            if word:
                out.append("".join(word))
                word = []
    if word:
        out.append("".join(word))
    return out


def _load_sections() -> list[dict[str, Any]]:
    sections = store().get(STORE_KEY)
    if not sections:
        raise ToolError(
            "No contract loaded. The solver must populate the contract sections "
            "before tools are called."
        )
    return sections


# ---------------------------------------------------------------------------
# Inspect @tool wrappers
# ---------------------------------------------------------------------------


@tool
def get_section() -> Tool:
    async def execute(n: int) -> str:
        """Return the full text of a contract section by its number.

        Args:
            n: The 1-based section number to retrieve.

        Returns:
            The section heading and text.
        """
        try:
            return get_section_text(_load_sections(), n)
        except KeyError:
            raise ToolError(f"No section numbered {n} in this contract.")

    return execute


@tool
def search_clauses() -> Tool:
    async def execute(query: str) -> str:
        """Search the contract for clauses matching a query.

        Use this to find clauses by topic (e.g. "non-compete", "liability cap",
        "audit", "minimum purchase"). Returns the most relevant sections.

        Args:
            query: Keywords describing the clause to find.

        Returns:
            A formatted list of matching sections, or a no-match message.
        """
        matches = search_sections(_load_sections(), query)
        if not matches:
            return f"No sections matched '{query}'."
        return "\n\n".join(
            f"§{m['n']} {m['heading']}\n{m['text']}" for m in matches
        )

    return execute


def contract_tools() -> list[Tool]:
    """The tool set offered to the contract-review agent."""
    return [search_clauses(), get_section()]
