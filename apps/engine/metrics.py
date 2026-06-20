"""Reliability metrics: pass@1 (optimistic single-attempt) and pass^k (the
pessimistic "all k trials pass" reliability signal).

Research §1 / §5: LLM agent loops are stochastic, so each task is run k times.
- **pass@1** — probability a *single* attempt passes (mean success over all
  attempts). The headline "does it usually work" number.
- **pass^k** — fraction of tasks for which *every one* of the k trials passed.
  Decays exponentially with k; it is the single most honest production-reliability
  signal and the credibility differentiator (research §1).
- **pass@k** (optimistic) — fraction of tasks where *at least one* of k trials
  passed. Provided for completeness; not in the contract but cheap to expose.

A "pass" on a single trial is decided by a threshold on the per-task F1 (the
suite's headline metric). Threshold is explicit and configurable so the binary
success definition is never hidden.

All functions are pure: input is a mapping `task_slug -> [f1 per trial]`. No
model, no Inspect run — directly unit-testable.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence

# Default F1 at/above which a single trial counts as a "pass".
DEFAULT_PASS_THRESHOLD = 0.5

# Type alias for readability: per-task list of per-trial F1 scores.
TrialsByTask = Mapping[str, Sequence[float]]


def trial_passed(f1: float, threshold: float = DEFAULT_PASS_THRESHOLD) -> bool:
    """A single trial passes iff its F1 meets the threshold."""
    return f1 >= threshold


def pass_at_1(
    trials_by_task: TrialsByTask, threshold: float = DEFAULT_PASS_THRESHOLD
) -> float:
    """Mean single-attempt success: P(a randomly chosen trial passed).

    Averaged over every (task, trial) attempt — the empirical pass@1 estimator.
    Returns 0.0 when there are no trials.
    """
    total = 0
    passed = 0
    for scores in trials_by_task.values():
        for f1 in scores:
            total += 1
            if trial_passed(f1, threshold):
                passed += 1
    return passed / total if total else 0.0


def pass_hat_k(
    trials_by_task: TrialsByTask, threshold: float = DEFAULT_PASS_THRESHOLD
) -> float:
    """pass^k: fraction of tasks for which ALL trials passed.

    A task with zero trials is skipped (cannot assess reliability). Returns 0.0
    when no task has any trials.
    """
    eligible = 0
    all_passed = 0
    for scores in trials_by_task.values():
        if not scores:
            continue
        eligible += 1
        if all(trial_passed(f1, threshold) for f1 in scores):
            all_passed += 1
    return all_passed / eligible if eligible else 0.0


def pass_at_k(
    trials_by_task: TrialsByTask, threshold: float = DEFAULT_PASS_THRESHOLD
) -> float:
    """pass@k (optimistic): fraction of tasks where AT LEAST ONE trial passed."""
    eligible = 0
    any_passed = 0
    for scores in trials_by_task.values():
        if not scores:
            continue
        eligible += 1
        if any(trial_passed(f1, threshold) for f1 in scores):
            any_passed += 1
    return any_passed / eligible if eligible else 0.0


def mean_f1(trials_by_task: TrialsByTask) -> float:
    """Mean F1 across every (task, trial) — the suite's headline accuracy axis."""
    total = 0
    acc = 0.0
    for scores in trials_by_task.values():
        for f1 in scores:
            acc += f1
            total += 1
    return acc / total if total else 0.0


__all__ = [
    "DEFAULT_PASS_THRESHOLD",
    "trial_passed",
    "pass_at_1",
    "pass_hat_k",
    "pass_at_k",
    "mean_f1",
]
