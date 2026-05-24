"""Fold ledger events into operational state."""

from __future__ import annotations

from typing import Any

from ..schema.transitions import validate_lifecycle_transition


def empty_state() -> dict[str, Any]:
    return {
        "lifecycle_state": None,
        "active_release_id": None,
        "active_git_sha": None,
        "active_seq": None,
        "active_env": None,
        "active_url": None,
        "active_health": None,
        "active_service": "sitepilot-railway",
        "verification_state": None,
        "rollback_active": False,
        "rollback_target_seq": None,
        "rollback_target_release_id": None,
        "rollback_target_git_sha": None,
        "last_deploy_env_posture": None,
        "open_incidents": [],
        "resolved_incidents": [],
        "journal_entries": [],
        "last_seq": 0,
        "transition_errors": [],
        "env_drift_warnings": [],
    }


def _lifecycle_from_event(event: dict[str, Any]) -> str | None:
    payload = event.get("payload") or {}
    value = payload.get("lifecycle_state")
    return value if isinstance(value, str) else None


def fold_events(events: list[dict[str, Any]]) -> dict[str, Any]:
    state = empty_state()

    for event in events:
        seq = event.get("seq", 0)
        state["last_seq"] = seq
        event_type = event.get("type")
        payload = event.get("payload") or {}

        if event_type in {
            "deploy.recorded",
            "rollback.recorded",
            "reconcile.recorded",
        }:
            new_lifecycle = _lifecycle_from_event(event)
            if new_lifecycle:
                err = validate_lifecycle_transition(
                    state["lifecycle_state"], new_lifecycle
                )
                if err:
                    state["transition_errors"].append(f"seq {seq}: {err}")
                else:
                    state["lifecycle_state"] = new_lifecycle

        if event_type == "deploy.recorded":
            state["active_release_id"] = payload.get("release_id")
            state["active_git_sha"] = payload.get("git_sha")
            state["active_seq"] = seq
            state["active_env"] = event.get("env")
            state["active_url"] = payload.get("url")
            state["active_health"] = payload.get("health_status")
            state["active_service"] = payload.get("service") or state["active_service"]
            state["verification_state"] = payload.get("verification_state")
            posture = payload.get("env_posture")
            if posture:
                state["last_deploy_env_posture"] = posture
            state["journal_entries"].append(
                {
                    "seq": seq,
                    "ts": event.get("ts"),
                    "type": event_type,
                    "release_id": payload.get("release_id"),
                    "git_sha": payload.get("git_sha"),
                    "lifecycle_state": payload.get("lifecycle_state"),
                    "verification_state": payload.get("verification_state"),
                    "actor": event.get("actor"),
                    "env": event.get("env"),
                    "refs": event.get("refs") or {},
                }
            )
            continue

        if event_type == "rollback.recorded":
            state["rollback_active"] = True
            state["rollback_target_seq"] = payload.get("target_seq")
            state["rollback_target_release_id"] = payload.get("target_release_id")
            state["rollback_target_git_sha"] = payload.get("target_git_sha")
            state["journal_entries"].append(
                {
                    "seq": seq,
                    "ts": event.get("ts"),
                    "type": event_type,
                    "release_id": payload.get("release_id"),
                    "lifecycle_state": "rollback",
                    "rollback_target_seq": payload.get("target_seq"),
                    "actor": event.get("actor"),
                    "reason": payload.get("reason"),
                }
            )
            continue

        if event_type == "reconcile.recorded":
            state["rollback_active"] = False
            state["verification_state"] = payload.get("verification_state")
            state["journal_entries"].append(
                {
                    "seq": seq,
                    "ts": event.get("ts"),
                    "type": event_type,
                    "release_id": payload.get("release_id"),
                    "lifecycle_state": "reconciled",
                    "summary": payload.get("summary"),
                    "actor": event.get("actor"),
                }
            )
            continue

        if event_type == "incident.recorded":
            record = {
                "seq": seq,
                "incident_id": payload.get("incident_id"),
                "severity": payload.get("severity"),
                "title": payload.get("title"),
                "status": payload.get("status"),
                "affected_layer": payload.get("affected_layer"),
            }
            if payload.get("status") in {"open", "mitigating"}:
                state["open_incidents"].append(record)
            else:
                state["resolved_incidents"].append(record)

    return state
