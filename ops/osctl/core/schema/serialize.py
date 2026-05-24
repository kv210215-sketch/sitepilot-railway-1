"""Deterministic JSON serialization — stable keys, UTC timestamps, reproducible hashes."""

from __future__ import annotations

import hashlib
import json
import re
from typing import Any

TS_PATTERN = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$"
)


def _sort_keys(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: _sort_keys(value[k]) for k in sorted(value)}
    if isinstance(value, list):
        return [_sort_keys(item) for item in value]
    return value


def normalize_ts(ts: str) -> str:
    """Normalize UTC timestamp to canonical millisecond form."""
    if not isinstance(ts, str) or not TS_PATTERN.match(ts):
        raise ValueError("ts must be UTC ISO8601 ending with Z")
    if ts.endswith("Z") and "." not in ts[10:]:
        return ts[:-1] + ".000Z"
    return ts


def canonical_dumps(obj: dict) -> str:
    """Serialize dict to canonical JSON (no trailing newline)."""
    normalized = _sort_keys(obj)
    return json.dumps(
        normalized,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    )


def canonical_bytes(obj: dict) -> bytes:
    return canonical_dumps(obj).encode("utf-8")


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def projection_fingerprint_from_parts(parts: dict[str, str]) -> str:
    joined = "\n".join(
        canonical_bytes({"name": name, "content": parts[name]}).decode("utf-8")
        for name in sorted(parts)
    )
    return content_hash(joined)
