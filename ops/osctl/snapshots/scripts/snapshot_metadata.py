"""Snapshot metadata extraction — read-only, stdlib only."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

SPEC_VERSION = "osctl-snapshot/1.0"
REQUIRED_TOP_LEVEL = ("spec_version", "metadata", "state", "snapshot_hash")
REQUIRED_METADATA = (
    "snapshot_id",
    "created_at",
    "ledger_seq",
    "ledger_event_count",
    "ledger_lines_hash",
    "projection_fingerprint",
    "purpose",
    "actor",
)


def load_snapshot(path: Path) -> dict[str, Any]:
    raw = path.read_text(encoding="utf-8")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"{path}: invalid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise ValueError(f"{path}: snapshot root must be an object")
    return data


def extract_metadata(snapshot: dict[str, Any]) -> dict[str, Any]:
    meta = snapshot.get("metadata")
    if not isinstance(meta, dict):
        raise ValueError("metadata must be an object")
    return dict(meta)


def validate_structure(snapshot: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for key in REQUIRED_TOP_LEVEL:
        if key not in snapshot:
            errors.append(f"missing top-level field: {key}")

    if snapshot.get("spec_version") != SPEC_VERSION:
        errors.append(
            f"spec_version must be {SPEC_VERSION!r}, got {snapshot.get('spec_version')!r}"
        )

    meta = snapshot.get("metadata")
    if isinstance(meta, dict):
        for key in REQUIRED_METADATA:
            if key not in meta:
                errors.append(f"missing metadata.{key}")
        created_at = meta.get("created_at")
        if isinstance(created_at, str) and not re.match(
            r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$", created_at
        ):
            errors.append("metadata.created_at must be UTC ISO8601 ending with Z")
        for int_key in ("ledger_seq", "ledger_event_count"):
            if int_key in meta and not isinstance(meta[int_key], int):
                errors.append(f"metadata.{int_key} must be int")
    else:
        errors.append("metadata must be an object")

    if "state" in snapshot and not isinstance(snapshot["state"], dict):
        errors.append("state must be an object")

    projections = snapshot.get("projections")
    if projections is not None and not isinstance(projections, dict):
        errors.append("projections must be an object when present")

    snap_hash = snapshot.get("snapshot_hash")
    if snap_hash is not None and (
        not isinstance(snap_hash, str) or len(snap_hash) != 64
    ):
        errors.append("snapshot_hash must be a 64-char hex SHA-256 string")

    return errors


def summary(snapshot: dict[str, Any]) -> dict[str, Any]:
    meta = extract_metadata(snapshot)
    return {
        "snapshot_id": meta.get("snapshot_id"),
        "created_at": meta.get("created_at"),
        "ledger_seq": meta.get("ledger_seq"),
        "ledger_event_count": meta.get("ledger_event_count"),
        "projection_fingerprint": meta.get("projection_fingerprint"),
        "purpose": meta.get("purpose"),
        "actor": meta.get("actor"),
        "snapshot_hash": snapshot.get("snapshot_hash"),
        "lifecycle_state": (snapshot.get("state") or {}).get("lifecycle_state"),
    }
