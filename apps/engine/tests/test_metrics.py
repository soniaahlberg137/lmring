"""Unit tests for pass@1 / pass^k / pass@k reliability math."""

import math

from metrics import mean_f1, pass_at_1, pass_at_k, pass_hat_k, trial_passed


def test_trial_passed_threshold():
    assert trial_passed(0.5)  # default threshold 0.5, inclusive
    assert trial_passed(0.9)
    assert not trial_passed(0.49)


def test_pass_hat_k_requires_all_trials():
    # task A: both trials pass; task B: one fails -> 1 of 2 tasks fully pass.
    trials = {"a": [0.8, 0.7], "b": [0.9, 0.2]}
    assert math.isclose(pass_hat_k(trials), 0.5)


def test_pass_at_1_is_mean_over_attempts():
    # 4 attempts, 3 pass (0.8, 0.7, 0.9) one fails (0.2) -> 3/4.
    trials = {"a": [0.8, 0.7], "b": [0.9, 0.2]}
    assert math.isclose(pass_at_1(trials), 0.75)


def test_pass_at_k_optimistic():
    # task b has at least one passing trial -> both tasks count.
    trials = {"a": [0.8, 0.7], "b": [0.9, 0.2]}
    assert math.isclose(pass_at_k(trials), 1.0)


def test_pass_hat_k_decays_below_pass_at_1():
    # An agent that passes 50% of attempts independently across k=2 should have
    # pass^k <= pass@1 (the honesty gap from research §1).
    trials = {f"t{i}": [1.0, 0.0] for i in range(10)}
    assert pass_hat_k(trials) <= pass_at_1(trials)
    assert pass_hat_k(trials) == 0.0
    assert math.isclose(pass_at_1(trials), 0.5)


def test_all_pass_gives_one():
    trials = {"a": [1.0, 1.0], "b": [0.6, 0.55]}
    assert pass_hat_k(trials) == 1.0
    assert pass_at_1(trials) == 1.0


def test_empty_inputs_are_zero():
    assert pass_at_1({}) == 0.0
    assert pass_hat_k({}) == 0.0
    assert pass_at_k({}) == 0.0
    assert mean_f1({}) == 0.0


def test_task_with_no_trials_skipped_in_pass_hat_k():
    trials = {"a": [1.0, 1.0], "empty": []}
    # only task 'a' is eligible -> 1.0
    assert pass_hat_k(trials) == 1.0


def test_mean_f1():
    trials = {"a": [0.6, 0.4], "b": [1.0]}
    assert math.isclose(mean_f1(trials), (0.6 + 0.4 + 1.0) / 3)


def test_custom_threshold():
    trials = {"a": [0.6, 0.6]}
    assert pass_hat_k(trials, threshold=0.7) == 0.0
    assert pass_hat_k(trials, threshold=0.5) == 1.0
