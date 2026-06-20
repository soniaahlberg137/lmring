"""Inspect task assembly for the legal contract-review suite.

`Dataset → (setup) Solver → Agent/Solver → Scorer`.

The runner (Lane A) injects the assembly/model under test by passing its own
`solver=`. When run standalone (e.g. for the baseline) the task falls back to a
default `react()` agent equipped with the contract-retrieval tools, so the loop
is runnable out of the box.
"""

from __future__ import annotations

from inspect_ai import Task, task
from inspect_ai.agent import react
from inspect_ai.solver import Solver, TaskState, generate, solver
from inspect_ai.util import store

from .dataset import contract_review_dataset
from .scorer import contract_review_scorer
from .tools import STORE_KEY, contract_tools

DEFAULT_PROMPT = (
    "You are a meticulous contract-review assistant. Investigate the contract "
    "using the available tools before answering. Only flag clause categories you "
    "have confirmed are present by reading the relevant section. When you are "
    "done, submit ONLY the JSON object requested — no extra commentary."
)


@solver
def load_contract() -> Solver:
    """Seed the per-sample contract sections into the Inspect store.

    Tools read the contract from the store, keeping per-sample state isolated and
    out of the prompt.
    """

    async def solve(state: TaskState, generate) -> TaskState:  # noqa: ANN001
        sections = state.metadata.get("sections", [])
        store().set(STORE_KEY, sections)
        return state

    return solve


def default_solver() -> Solver:
    """Default baseline agent: a react() loop with the contract tools."""
    return react(prompt=DEFAULT_PROMPT, tools=contract_tools())


@task
def legal_contract_review(solver: Solver | None = None) -> Task:
    """Contract-review benchmark task.

    Args:
        solver: The assembly under test. When None, a default react() baseline
            agent is used so the suite is runnable standalone.
    """
    agent = solver if solver is not None else default_solver()
    return Task(
        dataset=contract_review_dataset(),
        # load_contract must run first to seed the store, then the agent.
        solver=[load_contract(), agent],
        scorer=contract_review_scorer(),
        name="legal_contract_review",
    )


__all__ = [
    "legal_contract_review",
    "default_solver",
    "load_contract",
]
