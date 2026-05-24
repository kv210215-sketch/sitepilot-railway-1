"""OSCTL core validation runner — local, no network, no ledger mutation of production."""

from __future__ import annotations

import hashlib
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from ops.osctl.core.ledger.paths import default_ledger_path, default_projection_dir
from ops.osctl.core.ledger.store import append_event, read_events  # noqa: E402
from ops.osctl.core.projection.fold import fold_events  # noqa: E402
from ops.osctl.core.projection.render import render_projections  # noqa: E402
from ops.osctl.core.schema.events import validate_event  # noqa: E402
from ops.osctl.core.schema.serialize import canonical_dumps  # noqa: E402
from ops.osctl.core.verify.engine import (  # noqa: E402
    projection_fingerprint,
    verify_all,
    verify_ledger,
    verify_projection_match,
)

SCENARIOS = Path(__file__).parent / "scenarios"
RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    RESULTS.append((name, ok, detail))
    status = "PASS" if ok else "FAIL"
    line = f"[{status}] {name}"
    if detail:
        line += f" — {detail}"
    print(line)


def load_events(name: str) -> list[dict]:
    path = SCENARIOS / name / "events.jsonl"
    return read_events(path)


def test_serialization_stable_keys() -> None:
    obj = {"z": 1, "a": {"m": 2, "b": 3}, "list": [{"y": 1, "x": 2}]}
    a = canonical_dumps(obj)
    b = canonical_dumps({"list": [{"x": 2, "y": 1}], "a": {"b": 3, "m": 2}, "z": 1})
    record("serialization.stable_key_order", a == b, a[:80])


def test_serialization_identical_input_output() -> None:
    event = {
        "spec_version": "osctl-core/1.0",
        "seq": 1,
        "ts": "2026-05-23T14:05:00.000Z",
        "actor": "validation:runner",
        "type": "deploy.recorded",
        "env": "production",
        "payload": {
            "release_id": "r-test",
            "git_sha": "abc123",
            "lifecycle_state": "production",
            "verification_state": "passed",
            "service": "sitepilot-railway",
            "status": "success",
        },
    }
    runs = [canonical_dumps(event) for _ in range(5)]
    record(
        "serialization.identical_input_identical_output",
        len(set(runs)) == 1,
        f"hash={hashlib.sha256(runs[0].encode()).hexdigest()[:16]}",
    )


def test_serialization_no_random_values() -> None:
    source = (ROOT / "ops" / "osctl" / "core" / "schema" / "serialize.py").read_text(
        encoding="utf-8"
    )
    forbidden = ["random", "uuid", "time.time", "datetime.now", "secrets."]
    hits = [token for token in forbidden if token in source]
    record("serialization.no_random_sources", not hits, ", ".join(hits) or "none found")


def test_replay_consistency() -> None:
    events = load_events("clean-deploy-chain")
    fp1 = projection_fingerprint(events)
    fp2 = projection_fingerprint(events)
    state1 = fold_events(events)
    state2 = fold_events(events)
    rendered1 = render_projections(state1)
    rendered2 = render_projections(state2)
    ok = fp1 == fp2 and rendered1 == rendered2
    record("replay.consistency", ok, f"fingerprint={fp1[:16]}...")


def test_append_only_no_mutation() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        ledger = Path(tmp) / "events.jsonl"
        event_a = json.loads((SCENARIOS / "clean-deploy-chain" / "event-01.json").read_text())
        event_b = json.loads((SCENARIOS / "clean-deploy-chain" / "event-02.json").read_text())
        saved_a = append_event(ledger, event_a)
        saved_b = append_event(ledger, event_b)
        reread = read_events(ledger)
        ok = (
            len(reread) == 2
            and reread[0] == saved_a
            and reread[1] == saved_b
            and reread[0]["seq"] == 1
            and reread[1]["seq"] == 2
        )
        record("append_only.sequential_seq", ok, f"seqs={[e['seq'] for e in reread]}")


def test_chronological_integrity() -> None:
    events = load_events("clean-deploy-chain")
    seqs = [e["seq"] for e in events]
    ok = seqs == list(range(1, len(events) + 1))
    record("append_only.chronological_seq", ok, str(seqs))


def test_projection_reproducible() -> None:
    for scenario in ("clean-deploy-chain", "rollback-chain", "reconcile-flow"):
        events = load_events(scenario)
        a = render_projections(fold_events(events))
        b = render_projections(fold_events(events))
        ok = a == b and "CURRENT_STATUS.md" in a and "DEPLOYMENT_STATE.md" in a
        record(f"projection.reproducible.{scenario}", ok)


def test_projection_from_ledger_only() -> None:
    render_src = (
        ROOT / "ops" / "osctl" / "core" / "projection" / "render.py"
    ).read_text(encoding="utf-8")
    import_lines = [
        line.strip()
        for line in render_src.splitlines()
        if line.startswith("import ") or line.startswith("from ")
    ]
    allowed = {"from __future__ import annotations", "from typing import Any", "from ..schema.events import SPEC_VERSION"}
    external = [line for line in import_lines if line not in allowed]
    record("projection.ledger_only_render", not external, ", ".join(external) or "stdlib-only imports")


def test_verify_clean_chain() -> None:
    events = load_events("clean-deploy-chain")
    errors = verify_ledger(events)
    record("verify.clean_deploy_chain", not errors, "; ".join(errors[:3]) or "0 errors")


def test_verify_rollback_chain() -> None:
    events = load_events("rollback-chain")
    errors = verify_ledger(events)
    record("verify.rollback_chain", not errors, "; ".join(errors[:3]) or "0 errors")


def test_verify_reconcile_flow() -> None:
    events = load_events("reconcile-flow")
    errors = verify_ledger(events)
    record("verify.reconcile_flow", not errors, "; ".join(errors[:3]) or "0 errors")


def test_verify_invalid_transition() -> None:
    events = load_events("invalid-transition")
    errors = verify_ledger(events)
    ok = any("invalid transition" in e or "forbidden transition" in e for e in errors)
    record("verify.detects_invalid_transition", ok, "; ".join(errors[:2]))


def test_verify_rollback_target_missing() -> None:
    events = load_events("rollback-target-missing")
    errors = verify_ledger(events)
    ok = any("rollback target_seq" in e for e in errors)
    record("verify.detects_rollback_target_missing", ok, "; ".join(errors[:2]))


def test_verify_environment_mismatch() -> None:
    events = load_events("environment-mismatch")
    errors = verify_ledger(events)
    ok = any("env drift" in e for e in errors)
    record("verify.detects_environment_mismatch", ok, "; ".join(errors[:2]))


def test_verify_malformed_event() -> None:
    bad = {
        "spec_version": "osctl-core/1.0",
        "seq": 1,
        "ts": "not-a-timestamp",
        "actor": "",
        "type": "deploy.recorded",
        "env": "production",
        "payload": {},
    }
    errors = validate_event(bad, expected_seq=1)
    ok = len(errors) >= 3
    record("verify.detects_malformed_event", ok, f"{len(errors)} validation errors")


def test_verify_projection_drift() -> None:
    events = load_events("clean-deploy-chain")
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp)
        state = fold_events(events)
        rendered = render_projections(state)
        for name, content in rendered.items():
            (out / name).write_text(content, encoding="utf-8", newline="\n")
        drift_path = out / "CURRENT_STATUS.md"
        drift_path.write_text(drift_path.read_text() + "\n<!-- drift -->\n", encoding="utf-8")
        errors = verify_projection_match(events, out)
        ok = any("projection mismatch" in e for e in errors)
        record("verify.detects_projection_drift", ok, "; ".join(errors[:2]))


def test_production_ledger_verify() -> None:
    ledger = default_ledger_path()
    proj = default_projection_dir()
    if ledger.exists() and proj.exists():
        events = read_events(ledger)
        errors = verify_all(events, proj)
        record("verify.production_ledger", not errors, "; ".join(errors[:3]) or "0 errors")
    else:
        record("verify.production_ledger", True, "skipped — no production ledger")


def main() -> int:
    print("OSCTL core validation")
    print("=" * 40)
    test_serialization_stable_keys()
    test_serialization_identical_input_output()
    test_serialization_no_random_values()
    test_replay_consistency()
    test_append_only_no_mutation()
    test_chronological_integrity()
    test_projection_reproducible()
    test_projection_from_ledger_only()
    test_verify_clean_chain()
    test_verify_rollback_chain()
    test_verify_reconcile_flow()
    test_verify_invalid_transition()
    test_verify_rollback_target_missing()
    test_verify_environment_mismatch()
    test_verify_malformed_event()
    test_verify_projection_drift()
    test_production_ledger_verify()

    passed = sum(1 for _, ok, _ in RESULTS if ok)
    failed = sum(1 for _, ok, _ in RESULTS if not ok)
    print("=" * 40)
    print(f"Total: {passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
