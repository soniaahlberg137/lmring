"""Unit tests for the token->dollar cost layer (no model, no network)."""

import math

import pytest

from cost import ModelPrice, compute_cost, is_local, is_priced


def test_local_models_are_free():
    assert compute_cost("ollama/qwen3:8b", 10_000, 5_000) == 0.0
    assert compute_cost("ollama/qwen3:14b", 999_999, 999_999) == 0.0


def test_is_local_detection():
    assert is_local("ollama/qwen3:8b")
    assert is_local("vllm/whatever")
    assert not is_local("openai/gpt-4o")
    assert not is_local("moonshot/kimi-k2")


def test_priced_api_model_cost():
    # gpt-4o reference: 2.50 in / 10.00 out per MTok.
    cost = compute_cost("openai/gpt-4o", 1_000_000, 1_000_000)
    assert math.isclose(cost, 12.50)


def test_kimi_k2_priced():
    # 0.60 in / 2.50 out per MTok over 500k/200k tokens.
    cost = compute_cost("moonshot/kimi-k2", 500_000, 200_000)
    assert math.isclose(cost, 0.60 * 0.5 + 2.50 * 0.2)


def test_unknown_api_model_returns_zero_not_fabricated():
    assert compute_cost("someprovider/mystery-model", 1000, 1000) == 0.0
    assert not is_priced("someprovider/mystery-model")


def test_local_is_priced():
    assert is_priced("ollama/qwen3:8b")


def test_negative_tokens_raise():
    with pytest.raises(ValueError):
        compute_cost("openai/gpt-4o", -1, 0)


def test_modelprice_cost_math():
    p = ModelPrice(input_per_mtok=3.0, output_per_mtok=15.0)
    assert math.isclose(p.cost(2_000_000, 1_000_000), 6.0 + 15.0)
    assert p.cost(0, 0) == 0.0
