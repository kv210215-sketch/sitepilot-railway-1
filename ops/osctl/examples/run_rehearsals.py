"""Run replay + verify for all example rehearsal scenarios."""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parents[1]))

from ops.osctl.core.ledger.store import read_events  # noqa: E402
from ops.osctl.core.replay.engine import write_projections  # noqa: E402
from ops.osctl.core.verify.engine import (  # noqa: E402
    projection_fingerprint,
    verify_all,
    verify_ledger,
    verify_replay_consistency,
)

EXAMPLES = Path(__file__).parent
SCENARIOS = [
    "staging_deploy_success",
    "staging_deploy_failure",
    "rollback_rehearsal",
    "drift_detection",
    "reconcile_flow",
    "operator_handoff",
]


def run_scenario(name: str) -> dict:
    ledger = EXAMPLES / name / "events.jsonl"
    events = read_events(ledger)
    ledger_errors = verify_ledger(events)
    replay_errors = verify_replay_consistency(events)
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "projections"
        _, fp = write_projections(events, out)
        all_errors = verify_all(events, out)
        status_path = out / "CURRENT_STATUS.generated.md"
        deploy_path = out / "DEPLOYMENT_STATE.generated.md"
        return {
            "name": name,
            "events": len(events),
            "fingerprint": fp,
            "verify_ledger": "PASS" if not ledger_errors else "FAIL",
            "verify_replay": "PASS" if not replay_errors else "FAIL",
            "verify_all": "PASS" if not all_errors else "FAIL",
            "errors": ledger_errors + all_errors,
            "lifecycle_end": _lifecycle_end(events),
            "status_excerpt": _excerpt(status_path),
            "deploy_excerpt": _excerpt(deploy_path),
        }


def _lifecycle_end(events: list) -> str:
    from ops.osctl.core.projection.fold import fold_events

    state = fold_events(events)
    return str(state.get("lifecycle_state"))


def _excerpt(path: Path, lines: int = 12) -> str:
    if not path.exists():
        return "(missing)"
    return "".join(path.read_text(encoding="utf-8").splitlines(True)[:lines])


def main() -> int:
    print("OSCTL rehearsal scenarios")
    print("=" * 60)
    for name in SCENARIOS:
        r = run_scenario(name)
        print(f"\n[{r['verify_all']}] {name}")
        print(f"  events={r['events']} lifecycle_end={r['lifecycle_end']}")
        print(f"  fingerprint={r['fingerprint']}")
        if r["errors"]:
            for e in r["errors"][:3]:
                print(f"  error: {e}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
