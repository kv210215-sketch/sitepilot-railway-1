"""Lifecycle transition rules."""

from __future__ import annotations

LIFECYCLE_STATES = frozenset(
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

# (from_state, to_state) — None from_state means initial assignment.
ALLOWED: frozenset[tuple[str | None, str]] = frozenset(
    {
        (None, "planned"),
        (None, "staging"),
        (None, "validating"),
        (None, "production"),
        ("planned", "staging"),
        ("planned", "validating"),
        ("planned", "failed"),
        ("staging", "validating"),
        ("staging", "failed"),
        ("validating", "promoted"),
        ("validating", "failed"),
        ("promoted", "production"),
        ("promoted", "failed"),
        ("production", "rollback"),
        ("production", "archived"),
        ("production", "failed"),
        ("failed", "planned"),
        ("failed", "reconciled"),
        ("failed", "rollback"),
        ("rollback", "reconciled"),
        ("reconciled", "production"),
        ("reconciled", "archived"),
        ("archived", "planned"),
    }
)

FORBIDDEN_HIGHLIGHTS = (
    ("failed", "production"),
    ("validating", "production"),
    ("planned", "production"),
    ("rollback", "production"),
    ("archived", "production"),
)


def validate_lifecycle_transition(
    from_state: str | None, to_state: str
) -> str | None:
    if to_state not in LIFECYCLE_STATES:
        return f"unknown lifecycle state: {to_state}"
    if (from_state, to_state) in FORBIDDEN_HIGHLIGHTS:
        return f"forbidden transition: {from_state} -> {to_state}"
    if (from_state, to_state) not in ALLOWED:
        return f"invalid transition: {from_state} -> {to_state}"
    return None
