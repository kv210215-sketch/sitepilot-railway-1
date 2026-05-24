"""Deterministic ledger replay → projections."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from ..projection.fold import fold_events
from ..projection.render import render_projections
from ..schema.serialize import projection_fingerprint_from_parts


def replay(events: list[dict[str, Any]]) -> dict[str, str]:
    """Pure replay: ledger events → projection content map."""
    state = fold_events(events)
    return render_projections(state)


def replay_fingerprint(events: list[dict[str, Any]]) -> str:
    return projection_fingerprint_from_parts(replay(events))


def write_projections(
    events: list[dict[str, Any]], output_dir: Path
) -> tuple[dict[str, str], str]:
    """Replay and write projection files. Returns (rendered, fingerprint)."""
    rendered = replay(events)
    output_dir.mkdir(parents=True, exist_ok=True)
    for name, content in rendered.items():
        (output_dir / name).write_text(content, encoding="utf-8", newline="\n")
    fingerprint = projection_fingerprint_from_parts(rendered)
    return rendered, fingerprint
