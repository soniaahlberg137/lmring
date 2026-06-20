"""Model registry for the Tessera engine.

The whole point of the cross-model matrix (research §3): the dataset and scorer
are model-agnostic; only the model identifier changes. Inspect ships a provider
layer (built on LiteLLM conventions) so a swap is a config string.

v0 ships two **local** Ollama models, pointed at the user's Ollama on
**127.0.0.1:11435** (NOT the default 11434 — that port is the user's Apple
FoundationModels server). API models (incl. Kimi K2, the M4 target) are listed
but commented out until keys/budget are wired.
"""

from __future__ import annotations

import os

from inspect_ai.model import Model, get_model

# Ollama's OpenAI-compatible endpoint. Override with TESSERA_OLLAMA_BASE_URL.
OLLAMA_BASE_URL = os.environ.get(
    "TESSERA_OLLAMA_BASE_URL", "http://127.0.0.1:11435/v1"
)

# Local models available out of the box (model ids match the contract §3
# `model_id` field, e.g. "ollama/qwen3:8b").
LOCAL_MODEL_IDS: list[str] = [
    "ollama/qwen3:8b",
    "ollama/qwen3:14b",
]

# ---------------------------------------------------------------------------
# API models (commented until keys + budget are wired in M4).
# ---------------------------------------------------------------------------
# Kimi K2 (Moonshot) is the M4 API target. To enable, set the relevant key
# (e.g. MOONSHOT_API_KEY / OPENAI_API_KEY for an OpenAI-compatible gateway) and
# add the id here; cost.PRICE_TABLE already carries a reference price.
API_MODEL_IDS: list[str] = [
    # "moonshot/kimi-k2",
    # "openai/gpt-4o",
    # "anthropic/claude-sonnet-4",
]

# The default matrix axis for this lane: local only.
DEFAULT_MODEL_IDS: list[str] = list(LOCAL_MODEL_IDS)


def is_local_model(model_id: str) -> bool:
    prefix = model_id.split("/", 1)[0].lower()
    return prefix in {"ollama", "vllm", "lmstudio", "local"}


def resolve_model(model_id: str) -> Model:
    """Return an Inspect `Model` for `model_id`.

    Local (Ollama) models are bound to the 11435 base URL with a dummy api key
    (Ollama ignores it but Inspect's OpenAI-compatible provider requires one).
    API models are resolved via Inspect's default provider lookup (keys from env).
    """
    if is_local_model(model_id):
        return get_model(
            model_id,
            base_url=OLLAMA_BASE_URL,
            api_key=os.environ.get("OLLAMA_API_KEY", "ollama"),
        )
    return get_model(model_id)


__all__ = [
    "OLLAMA_BASE_URL",
    "LOCAL_MODEL_IDS",
    "API_MODEL_IDS",
    "DEFAULT_MODEL_IDS",
    "is_local_model",
    "resolve_model",
]
