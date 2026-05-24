"""Event schema types and validation."""

from __future__ import annotations

from typing import Any

from .serialize import TS_PATTERN

SPEC_VERSION = "osctl-core/1.0"

EVENT_TYPES = frozenset(
    {
        "deploy.recorded",
        "rollback.recorded",
        "reconcile.recorded",
        "incident.recorded",
    }
)

LIFECYCLE_VALUES = frozenset(
    {
        "planned",
        "staging",
        "validating",
        "promoted",
        "production",
        "failed",
        "rollback",
        "reconciled",
        "archived",
    }
)

VERIFICATION_VALUES = frozenset({"pending", "in_progress", "passed", "failed"})
SEVERITY_VALUES = frozenset({"SEV1", "SEV2", "SEV3", "SEV4"})
INCIDENT_STATUS_VALUES = frozenset({"open", "mitigating", "resolved"})

REQUIRED_TOP = ("spec_version", "seq", "ts", "actor", "type", "env", "payload")
REQUIRED_ENV_KEYS = frozenset({"JWT_SECRET", "JWT_REFRESH_SECRET", "DATABASE_URL"})


def _require_str(payload: dict, key: str, errors: list[str]) -> None:
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip():
        errors.append(f"payload.{key} must be a non-empty string")


def _require_int(payload: dict, key: str, errors: list[str]) -> None:
    value = payload.get(key)
    if not isinstance(value, int) or value < 1:
        errors.append(f"payload.{key} must be a positive integer")


def _validate_env_posture(payload: dict, errors: list[str]) -> None:
    posture = payload.get("env_posture")
    if posture is None:
        return
    if not isinstance(posture, dict):
        errors.append("payload.env_posture must be an object")
        return
    for key in ("keys_present", "keys_missing"):
        items = posture.get(key)
        if items is not None and not isinstance(items, list):
            errors.append(f"payload.env_posture.{key} must be an array")


def _validate_payload(event_type: str, payload: dict, errors: list[str]) -> None:
    if event_type == "deploy.recorded":
        _require_str(payload, "release_id", errors)
        _require_str(payload, "git_sha", errors)
        _require_str(payload, "service", errors)
        _require_str(payload, "status", errors)
        for key in ("lifecycle_state", "verification_state"):
            _require_str(payload, key, errors)
        if payload.get("lifecycle_state") not in LIFECYCLE_VALUES:
            errors.append("payload.lifecycle_state invalid")
        if payload.get("verification_state") not in VERIFICATION_VALUES:
            errors.append("payload.verification_state invalid")
        if payload.get("status") not in {"success", "failed"}:
            errors.append("payload.status must be success or failed")
        _validate_env_posture(payload, errors)
        return

    if event_type == "rollback.recorded":
        _require_str(payload, "release_id", errors)
        _require_int(payload, "target_seq", errors)
        _require_str(payload, "target_release_id", errors)
        _require_str(payload, "target_git_sha", errors)
        _require_str(payload, "reason", errors)
        if payload.get("lifecycle_state") != "rollback":
            errors.append("payload.lifecycle_state must be rollback")
        return

    if event_type == "reconcile.recorded":
        _require_str(payload, "release_id", errors)
        _require_str(payload, "summary", errors)
        _require_str(payload, "verification_state", errors)
        if payload.get("lifecycle_state") != "reconciled":
            errors.append("payload.lifecycle_state must be reconciled")
        if payload.get("verification_state") not in VERIFICATION_VALUES:
            errors.append("payload.verification_state invalid")
        target = payload.get("rollback_target_seq")
        if target is not None and (not isinstance(target, int) or target < 1):
            errors.append("payload.rollback_target_seq must be a positive integer")
        return

    if event_type == "incident.recorded":
        _require_str(payload, "incident_id", errors)
        _require_str(payload, "title", errors)
        _require_str(payload, "affected_layer", errors)
        if payload.get("severity") not in SEVERITY_VALUES:
            errors.append("payload.severity invalid")
        if payload.get("status") not in INCIDENT_STATUS_VALUES:
            errors.append("payload.status invalid")


def validate_event(event: dict, *, expected_seq: int | None = None) -> list[str]:
    """Return validation errors (empty list means valid)."""
    errors: list[str] = []

    if not isinstance(event, dict):
        return ["event must be an object"]

    for key in REQUIRED_TOP:
        if key not in event:
            errors.append(f"missing field: {key}")

    if event.get("spec_version") != SPEC_VERSION:
        errors.append(f"spec_version must be {SPEC_VERSION}")

    seq = event.get("seq")
    if not isinstance(seq, int) or seq < 1:
        errors.append("seq must be a positive integer")
    elif expected_seq is not None and seq != expected_seq:
        errors.append(f"seq must be {expected_seq}, got {seq}")

    ts = event.get("ts")
    if not isinstance(ts, str) or not TS_PATTERN.match(ts):
        errors.append("ts must be UTC ISO8601 ending with Z")

    if not isinstance(event.get("actor"), str) or not event["actor"].strip():
        errors.append("actor must be a non-empty string")

    event_type = event.get("type")
    if event_type not in EVENT_TYPES:
        errors.append(f"type must be one of {sorted(EVENT_TYPES)}")

    if not isinstance(event.get("env"), str) or not event["env"].strip():
        errors.append("env must be a non-empty string")

    payload = event.get("payload")
    if not isinstance(payload, dict):
        errors.append("payload must be an object")
    elif isinstance(event_type, str) and event_type in EVENT_TYPES:
        _validate_payload(event_type, payload, errors)

    refs = event.get("refs")
    if refs is not None and not isinstance(refs, dict):
        errors.append("refs must be an object when present")

    return errors


def production_env_drift(payload: dict) -> list[str]:
    """Detect missing required production env keys (names only)."""
    posture = payload.get("env_posture") or {}
    present = set(posture.get("keys_present") or [])
    missing = []
    for key in REQUIRED_ENV_KEYS:
        if key not in present:
            missing.append(key)
    db_sync = posture.get("db_sync")
    if db_sync is not None and db_sync != "false":
        missing.append("DB_SYNC must be false in production posture")
    return missing
