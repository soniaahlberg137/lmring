"""Token-usage → dollar-cost layer for the Tessera engine.

Inspect/LiteLLM log token *usage* and latency turnkey, but NOT normalized
dollars (research §6: "the thin glue you build" item 1). This module supplies
the price table and the tokens×price pivot that fills the `cost_usd` column of
the contract ingestion JSON (contract §3).

Local models (Ollama) are free → `cost_usd = 0.0`. API models use a per-model
price table (USD per 1M tokens). Everything here is pure and unit-tested; no
network, no model.
"""

from __future__ import annotations

from dataclasses import dataclass

# 1 million tokens — prices are quoted per-MTok by every major provider.
_MTOK = 1_000_000.0


@dataclass(frozen=True)
class ModelPrice:
    """USD price per 1,000,000 tokens, split by input/output."""

    input_per_mtok: float
    output_per_mtok: float

    def cost(self, input_tokens: int, output_tokens: int) -> float:
        return (
            input_tokens / _MTOK * self.input_per_mtok
            + output_tokens / _MTOK * self.output_per_mtok
        )


# ---------------------------------------------------------------------------
# Price table
# ---------------------------------------------------------------------------
# Local models are free. API prices are REFERENCE values (USD / 1M tokens) and
# should be re-verified against the provider's live pricing before billing —
# they exist so the matrix has a real $ axis the moment an API cell is wired.
PRICE_TABLE: dict[str, ModelPrice] = {
    # --- Local (Ollama) — always free. -----------------------------------
    "ollama/qwen3:8b": ModelPrice(0.0, 0.0),
    "ollama/qwen3:14b": ModelPrice(0.0, 0.0),
    # --- API models (reference prices; verify before billing). -----------
    # Moonshot Kimi K2 (the M4 API target). ~$0.60 in / $2.50 out per MTok.
    "moonshot/kimi-k2": ModelPrice(0.60, 2.50),
    "openai/kimi-k2": ModelPrice(0.60, 2.50),
    # A couple of common references for sanity-checking the pivot.
    "openai/gpt-4o": ModelPrice(2.50, 10.00),
    "anthropic/claude-sonnet-4": ModelPrice(3.00, 15.00),
}


def is_local(model_id: str) -> bool:
    """Local backends (Ollama / vLLM / lm-studio) are billed at $0."""
    prefix = model_id.split("/", 1)[0].lower()
    return prefix in {"ollama", "vllm", "lmstudio", "local"}


def compute_cost(
    model_id: str, input_tokens: int, output_tokens: int
) -> float:
    """Return the USD cost for a token usage on `model_id`.

    - Local models → 0.0 (free), regardless of token counts.
    - Known API models → priced from PRICE_TABLE.
    - Unknown API models → 0.0 (cannot price honestly; the runner records the
      token counts so the cell can be re-priced later rather than fabricated).
    """
    if input_tokens < 0 or output_tokens < 0:
        raise ValueError("token counts must be non-negative")
    if is_local(model_id):
        return 0.0
    price = PRICE_TABLE.get(model_id)
    if price is None:
        return 0.0
    return price.cost(input_tokens, output_tokens)


def is_priced(model_id: str) -> bool:
    """True if we can attach a meaningful $ figure (local=free counts as priced)."""
    return is_local(model_id) or model_id in PRICE_TABLE


__all__ = [
    "ModelPrice",
    "PRICE_TABLE",
    "is_local",
    "is_priced",
    "compute_cost",
]
