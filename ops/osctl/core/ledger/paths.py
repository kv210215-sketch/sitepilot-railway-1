"""Filesystem paths for OSCTL ledger and projections."""

from __future__ import annotations

from pathlib import Path


def osctl_root() -> Path:
    return Path(__file__).resolve().parents[2]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[4]


def default_ledger_path() -> Path:
    return repo_root() / "ops" / "state" / "ledger" / "events.jsonl"


def default_projection_dir() -> Path:
    return repo_root() / "ops" / "state" / "projections"
