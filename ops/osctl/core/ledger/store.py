"""Append-only JSONL ledger — local filesystem only."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from ..schema.events import SPEC_VERSION, validate_event
from ..schema.serialize import canonical_dumps, normalize_ts
from .paths import default_ledger_path


def read_events(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []

    events: list[dict[str, Any]] = []
    raw = path.read_text(encoding="utf-8")
    for line_no, line in enumerate(raw.splitlines(), start=1):
        stripped = line.strip()
        if not stripped:
            continue
        try:
            event = json.loads(stripped)
        except json.JSONDecodeError as exc:
            raise ValueError(f"{path}:{line_no}: invalid JSON: {exc}") from exc
        if not isinstance(event, dict):
            raise ValueError(f"{path}:{line_no}: event must be an object")
        events.append(event)

    for index, event in enumerate(events, start=1):
        if event.get("seq") != index:
            raise ValueError(
                f"{path}: expected seq {index}, got {event.get('seq')}"
            )

    return events


def append_event(path: Path, event: dict[str, Any]) -> dict[str, Any]:
    path.parent.mkdir(parents=True, exist_ok=True)

    existing = read_events(path) if path.exists() else []
    next_seq = len(existing) + 1

    prepared = dict(event)
    prepared["seq"] = next_seq
    if prepared.get("spec_version") is None:
        prepared["spec_version"] = SPEC_VERSION
    if "ts" in prepared:
        prepared["ts"] = normalize_ts(prepared["ts"])

    errors = validate_event(prepared, expected_seq=next_seq)
    if errors:
        raise ValueError("invalid event: " + "; ".join(errors))

    line = canonical_dumps(prepared) + "\n"

    flags = os.O_WRONLY | os.O_CREAT | os.O_APPEND
    if hasattr(os, "O_BINARY"):
        flags |= os.O_BINARY
    fd = os.open(str(path), flags, 0o644)
    try:
        os.write(fd, line.encode("utf-8"))
    finally:
        os.close(fd)

    return prepared


__all__ = ["append_event", "default_ledger_path", "read_events"]
