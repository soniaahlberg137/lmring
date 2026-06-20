"""Fetch the full CUAD corpus (optional; the suite ships a tiny vendored subset).

CUAD (Contract Understanding Atticus Dataset) is released under CC-BY-4.0 by The
Atticus Project. This script is a convenience for anyone wanting to expand the
suite beyond the committed `fixtures/cuad_subset.json`. It is NOT required to run
the suite or its tests.

Usage:
    python -m apps.engine.suites.legal_contract_review.download --out ./cuad_raw

Sources (pick whichever is reachable in your environment):
  - Official:   https://www.atticusprojectai.org/cuad
  - Zenodo:     https://zenodo.org/records/4595826  (CUAD_v1.zip)
  - HuggingFace: dataset `theatticusproject/cuad-qa` or `cuad`

We deliberately do NOT vendor the full corpus (it is large). Keep any downloaded
data out of git.
"""

from __future__ import annotations

import argparse
import sys

ZENODO_URL = "https://zenodo.org/records/4595826/files/CUAD_v1.zip"
HF_DATASET = "theatticusproject/cuad-qa"
CATEGORIES_COUNT = 41


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Download the full CUAD corpus.")
    parser.add_argument("--out", default="./cuad_raw", help="output directory")
    parser.add_argument(
        "--source",
        choices=["zenodo", "hf"],
        default="zenodo",
        help="download source",
    )
    args = parser.parse_args(argv)

    print(
        "CUAD is CC-BY-4.0 (The Atticus Project). This suite ships only a small "
        "curated subset for offline runs.\n"
        f"To expand it, fetch the full corpus ({CATEGORIES_COUNT} clause "
        "categories) yourself and convert it to the fixture schema in "
        "fixtures/cuad_subset.json.\n"
    )

    if args.source == "zenodo":
        print(f"Zenodo archive: {ZENODO_URL}")
        print(f"  curl -L -o CUAD_v1.zip '{ZENODO_URL}' && unzip CUAD_v1.zip -d {args.out}")
    else:
        print(f"HuggingFace dataset: {HF_DATASET}")
        print("  from datasets import load_dataset")
        print(f"  ds = load_dataset('{HF_DATASET}')")

    print(
        "\nThis helper intentionally does not auto-download (keeps the suite "
        "network-free and large data out of git). Run the printed command "
        "manually, then write a converter to the fixture schema."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
