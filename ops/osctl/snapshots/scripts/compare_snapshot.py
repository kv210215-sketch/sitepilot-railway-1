"""Compare snapshot to ledger replay or another snapshot — read-only."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT))

from ops.osctl.core.ledger.store import read_events  # noqa: E402
from ops.osctl.core.projection.fold import fold_events  # noqa: E402
from ops.osctl.core.replay.engine import replay, replay_fingerprint  # noqa: E402
from ops.osctl.core.schema.serialize import content_hash  # noqa: E402
from ops.osctl.snapshots.scripts.snapshot_metadata import load_snapshot, summary  # noqa: E402
from ops.osctl.snapshots.scripts.verify_snapshot import compute_snapshot_hash  # noqa: E402


def compare_to_ledger(snapshot: dict, ledger_path: Path) -> list[str]:
    errors: list[str] = []
    events = read_events(ledger_path)
    meta = snapshot["metadata"]

    if meta["ledger_event_count"] != len(events):
        errors.append(
            f"ledger_event_count mismatch: snapshot={meta['ledger_event_count']} "
            f"ledger={len(events)}"
        )
    if meta["ledger_seq"] != len(events):
        errors.append(
            f"ledger_seq mismatch: snapshot={meta['ledger_seq']} ledger={len(events)}"
        )

    replay_fp = replay_fingerprint(events)
    if meta["projection_fingerprint"] != replay_fp:
        errors.append(
            f"projection_fingerprint mismatch: snapshot={meta['projection_fingerprint']} "
            f"replay={replay_fp}"
        )

    replay_state = fold_events(events)
    snap_state = snapshot["state"]
    for key in ("lifecycle_state", "last_seq", "rollback_active", "active_release_id"):
        if replay_state.get(key) != snap_state.get(key):
            errors.append(
                f"state.{key} mismatch: snapshot={snap_state.get(key)!r} "
                f"replay={replay_state.get(key)!r}"
            )

    projections = snapshot.get("projections")
    if isinstance(projections, dict):
        rendered = replay(events)
        for name, content in projections.items():
            if name not in rendered:
                errors.append(f"projection {name} not in replay output")
            elif content_hash(content) != content_hash(rendered[name]):
                errors.append(f"projection content mismatch: {name}")

    return errors


def compare_snapshots(left: dict, right: dict) -> list[str]:
    errors: list[str] = []
    if left["metadata"]["ledger_seq"] != right["metadata"]["ledger_seq"]:
        errors.append("ledger_seq differs between snapshots")
    if left["snapshot_hash"] == right["snapshot_hash"]:
        if left != right:
            errors.append("identical hash but non-identical payload (collision risk)")
    elif left["metadata"]["projection_fingerprint"] == right["metadata"]["projection_fingerprint"]:
        errors.append("same projection fingerprint but different snapshot_hash")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Compare OSCTL snapshots (read-only)")
    parser.add_argument("snapshot", type=Path, help="Primary snapshot JSON")
    parser.add_argument(
        "--ledger",
        type=Path,
        help="Compare snapshot against ledger replay at this path",
    )
    parser.add_argument(
        "--other",
        type=Path,
        help="Compare against a second snapshot file",
    )
    args = parser.parse_args()

    snapshot = load_snapshot(args.snapshot)
    hash_errors: list[str] = []
    expected = compute_snapshot_hash(snapshot)
    if snapshot.get("snapshot_hash") != expected:
        hash_errors.append("primary snapshot fails hash verification")

    errors = list(hash_errors)
    if args.ledger:
        errors.extend(compare_to_ledger(snapshot, args.ledger))
    if args.other:
        other = load_snapshot(args.other)
        errors.extend(compare_snapshots(snapshot, other))

    if not args.ledger and not args.other:
        print("compare: specify --ledger and/or --other", file=sys.stderr)
        return 2

    if errors:
        for msg in errors:
            print(f"DRIFT: {msg}", file=sys.stderr)
        return 1

    print("compare ok — no drift detected")
    print(json.dumps(summary(snapshot), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
