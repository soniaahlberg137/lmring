"""Legal contract-review benchmark suite (CUAD-derived).

Public surface used by the runner:
  - `legal_contract_review`  : the Inspect @task
  - `default_solver`         : baseline react() agent
  - `contract_review_scorer` : programmatic P/R/F1 scorer
  - `contract_tools`         : clause-retrieval tools
  - `contract_review_dataset`: dataset builder
"""

from .dataset import contract_review_dataset
from .scorer import contract_review_scorer
from .task import default_solver, legal_contract_review, load_contract
from .tools import contract_tools

__all__ = [
    "legal_contract_review",
    "default_solver",
    "load_contract",
    "contract_review_scorer",
    "contract_tools",
    "contract_review_dataset",
]
