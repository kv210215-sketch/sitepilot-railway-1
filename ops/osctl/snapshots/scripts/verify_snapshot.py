"""Verify snapshot structure and hash — read-only, stdlib only."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT))

from ops.osctl.core.schema.serialize import canonical_dumps, content_hash  # noqa: E402
from ops.osctl.snapshots.scripts.snapshot_metadata import (  # noqa: E402
    load_snapshot,
    summary,
    validate_structure,
)


def payload_for_hash(snapshot: dict) -> dict:
    payload = {
        "spec_version": snapshot["spec_version"],
        "metadata": snapshot["metadata"],
        "state": snapshot["state"],
    }
    if "projections" in snapshot:
        payload["projections"] = snapshot["projections"]
    return payload


def compute_snapshot_hash(snapshot: dict) -> str:
    return content_hash(canonical_dumps(payload_for_hash(snapshot)))


def verify_snapshot(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        snapshot = load_snapshot(path)
    except ValueError as exc:
        return [str(exc)]

    errors.extend(validate_structure(snapshot))
    if errors:
        return errors

    expected = compute_snapshot_hash(snapshot)
    actual = snapshot.get("snapshot_hash")
    if actual != expected:
        errors.append(
            f"snapshot_hash mismatch: recorded={actual} computed={expected}"
        )
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify OSCTL snapshot (read-only)")
    parser.add_argument("snapshot", type=Path, help="Path to snapshot JSON file")
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print summary JSON on success",
    )
    args = parser.parse_args()

    errors = verify_snapshot(args.snapshot)
    if errors:
        for msg in errors:
            print(f"FAIL: {msg}", file=sys.stderr)
        return 1

    snap = load_snapshot(args.snapshot)
    print(f"verify ok — {args.snapshot.name}")
    if args.json:
        print(json.dumps(summary(snap), indent=2, sort_keys=True))
    else:
        meta = summary(snap)
        print(
            f"  id={meta['snapshot_id']} seq={meta['ledger_seq']} "
            f"hash={meta['snapshot_hash'][:16]}..."
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
