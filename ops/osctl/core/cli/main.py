"""OSCTL core CLI — append, replay, verify (local filesystem only)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from ..ledger.paths import default_ledger_path, default_projection_dir
from ..ledger.store import append_event, read_events
from ..replay.engine import write_projections
from ..verify.engine import projection_fingerprint, verify_all


def cmd_append(args: argparse.Namespace) -> int:
    path = Path(args.ledger) if args.ledger else default_ledger_path()
    raw = Path(args.file).read_text(encoding="utf-8")
    event = json.loads(raw)
    if not isinstance(event, dict):
        print("event file must contain a JSON object", file=sys.stderr)
        return 1
    try:
        saved = append_event(path, event)
    except (ValueError, OSError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    print(f"appended seq {saved['seq']} to {path}")
    return 0


def cmd_replay(args: argparse.Namespace) -> int:
    ledger_path = Path(args.ledger) if args.ledger else default_ledger_path()
    out_dir = Path(args.output) if args.output else default_projection_dir()

    if not ledger_path.exists():
        print(f"ledger not found: {ledger_path}", file=sys.stderr)
        return 1

    try:
        events = read_events(ledger_path)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    _, fingerprint = write_projections(events, out_dir)
    print(f"replayed {len(events)} events to {out_dir}")
    print(f"fingerprint: {fingerprint}")
    return 0


def cmd_verify(args: argparse.Namespace) -> int:
    ledger_path = Path(args.ledger) if args.ledger else default_ledger_path()
    out_dir = Path(args.output) if args.output else default_projection_dir()

    if not ledger_path.exists():
        print(f"ledger not found: {ledger_path}", file=sys.stderr)
        return 1

    try:
        events = read_events(ledger_path)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    errors = verify_all(events, out_dir)
    if errors:
        for err in errors:
            print(f"verify: {err}", file=sys.stderr)
        return 1

    print(f"verify ok — {len(events)} events, fingerprint {projection_fingerprint(events)}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="osctl-core",
        description="SitePilot OSCTL ledger core (local, deterministic)",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    append_p = sub.add_parser("append", help="Append one event to JSONL ledger")
    append_p.add_argument("--file", required=True, help="JSON event file (seq assigned)")
    append_p.add_argument(
        "--ledger",
        help="Ledger path override (default ops/state/ledger/events.jsonl)",
    )
    append_p.set_defaults(func=cmd_append)

    replay_p = sub.add_parser("replay", help="Replay ledger into projections")
    replay_p.add_argument(
        "--ledger",
        help="Ledger path override (default ops/state/ledger/events.jsonl)",
    )
    replay_p.add_argument(
        "--output",
        help="Projection output directory (default ops/state/projections)",
    )
    replay_p.set_defaults(func=cmd_replay)

    project_p = sub.add_parser(
        "project",
        help="Alias for replay (per PROJECTION_RULES.md)",
    )
    project_p.add_argument(
        "--ledger",
        help="Ledger path override (default ops/state/ledger/events.jsonl)",
    )
    project_p.add_argument(
        "--output",
        help="Projection output directory (default ops/state/projections)",
    )
    project_p.set_defaults(func=cmd_replay)

    verify_p = sub.add_parser("verify", help="Verify ledger and projection files")
    verify_p.add_argument(
        "--ledger",
        help="Ledger path override (default ops/state/ledger/events.jsonl)",
    )
    verify_p.add_argument(
        "--output",
        help="Projection directory to compare (default ops/state/projections)",
    )
    verify_p.set_defaults(func=cmd_verify)

    args = parser.parse_args(argv)
    return args.func(args)
