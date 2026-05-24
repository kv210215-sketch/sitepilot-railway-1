"""Verification engine — schema, replay consistency, drift, hash."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from ..projection.fold import fold_events
from ..replay.engine import replay, replay_fingerprint
from ..schema.events import production_env_drift, validate_event
from ..schema.serialize import content_hash
from ..schema.transitions import validate_lifecycle_transition


def verify_ledger(events: list[dict[str, Any]]) -> list[str]:
    errors: list[str] = []
    lifecycle: str | None = None
    events_by_seq: dict[int, dict[str, Any]] = {}

    for index, event in enumerate(events, start=1):
        seq_errors = validate_event(event, expected_seq=index)
        for msg in seq_errors:
            errors.append(f"seq {index}: {msg}")

        seq = event.get("seq")
        if isinstance(seq, int):
            events_by_seq[seq] = event

        payload = event.get("payload") or {}
        new_lifecycle = payload.get("lifecycle_state")
        if event.get("type") in {
            "deploy.recorded",
            "rollback.recorded",
            "reconcile.recorded",
        } and isinstance(new_lifecycle, str):
            err = validate_lifecycle_transition(lifecycle, new_lifecycle)
            if err:
                errors.append(f"seq {index}: {err}")
            lifecycle = new_lifecycle

        if event.get("type") == "deploy.recorded" and event.get("env") == "production":
            for drift in production_env_drift(payload):
                errors.append(f"seq {index}: env drift: missing or invalid {drift}")

    state = fold_events(events)
    for msg in state.get("transition_errors") or []:
        errors.append(msg)

    if state.get("rollback_active"):
        target = state.get("rollback_target_seq")
        if not target:
            errors.append("rollback active but rollback_target_seq missing")
        elif target not in events_by_seq:
            errors.append(f"rollback target_seq {target} not found in ledger")
        else:
            target_event = events_by_seq[target]
            if target_event.get("type") != "deploy.recorded":
                errors.append(
                    f"rollback target_seq {target} is not deploy.recorded"
                )
            elif (target_event.get("payload") or {}).get("status") != "success":
                errors.append(
                    f"rollback target_seq {target} is not a successful deploy"
                )

    return errors


def verify_replay_consistency(events: list[dict[str, Any]]) -> list[str]:
    rendered_a = replay(events)
    rendered_b = replay(events)
    if rendered_a != rendered_b:
        return ["replay output not stable across consecutive runs"]
    fp_a = replay_fingerprint(events)
    fp_b = replay_fingerprint(events)
    if fp_a != fp_b:
        return ["replay fingerprint not stable across consecutive runs"]
    return []


def verify_projection_match(
    events: list[dict[str, Any]], projection_dir: Path
) -> list[str]:
    errors: list[str] = []
    rendered = replay(events)

    for name, content in rendered.items():
        path = projection_dir / name
        if not path.exists():
            errors.append(f"projection missing on disk: {path}")
            continue
        on_disk = path.read_text(encoding="utf-8")
        if content_hash(on_disk) != content_hash(content):
            errors.append(f"projection mismatch: {path}")

    return errors


def verify_all(events: list[dict[str, Any]], projection_dir: Path) -> list[str]:
    errors: list[str] = []
    errors.extend(verify_replay_consistency(events))
    errors.extend(verify_ledger(events))
    errors.extend(verify_projection_match(events, projection_dir))
    return errors


def projection_fingerprint(events: list[dict[str, Any]]) -> str:
    return replay_fingerprint(events)
