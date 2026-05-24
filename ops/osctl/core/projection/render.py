"""Render projections from folded state — ledger events only."""

from __future__ import annotations

from typing import Any

from ..schema.events import SPEC_VERSION

CURRENT_STATUS_FILE = "CURRENT_STATUS.md"
DEPLOYMENT_STATE_FILE = "DEPLOYMENT_STATE.md"


def _val(value: Any, fallback: str = "unknown") -> str:
    if value is None or value == "":
        return fallback
    return str(value)


def render_current_status(state: dict[str, Any]) -> str:
    blockers = state.get("open_incidents") or []
    blocker_rows = ""
    if blockers:
        for index, item in enumerate(blockers, start=1):
            blocker_rows += (
                f"| B{index} | {item.get('title', 'incident')} | "
                f"{item.get('severity', 'SEV3')} | operator | "
                f"seq {item.get('seq')} |\n"
            )
    else:
        blocker_rows = "| — | none | none | — | — |\n"

    rollback_active = "yes" if state.get("rollback_active") else "no"
    lines = [
        "# CURRENT STATUS — OSCTL Projection",
        "",
        f"> **Source:** ledger only · **Spec:** `{SPEC_VERSION}` · "
        f"**As of seq:** `{state.get('last_seq', 0)}`",
        "",
        "---",
        "",
        "## Active Release",
        "",
        "| Field | Value |",
        "|-------|-------|",
        f"| Release ID | `{_val(state.get('active_release_id'), 'none')}` |",
        f"| Git SHA | `{_val(state.get('active_git_sha'), 'none')}` |",
        f"| Service | `{_val(state.get('active_service'))}` |",
        f"| Lifecycle state | `{_val(state.get('lifecycle_state'), 'none')}` |",
        "| Deploy channel | `github-actions → railway up` |",
        "",
        "---",
        "",
        "## Environment",
        "",
        "| Env | Target | URL | Health |",
        "|-----|--------|-----|--------|",
        f"| production | Railway `triumphant-purpose` | "
        f"`{_val(state.get('active_url'), 'n/a')}` | "
        f"`{_val(state.get('active_health'), 'unknown')}` |",
        "",
        "---",
        "",
        "## Known Blockers",
        "",
        "| ID | Blocker | Severity | Owner | Since |",
        "|----|---------|----------|-------|-------|",
        blocker_rows.rstrip(),
        "",
        "---",
        "",
        "## Deployment Baton",
        "",
        "| Role | Holder | Action pending |",
        "|------|--------|----------------|",
        f"| Record state | `osctl replay` | "
        f"`{'rollback' if state.get('rollback_active') else 'none'}` |",
        "",
        "---",
        "",
        "## Rollback Target",
        "",
        "| Field | Value |",
        "|-------|-------|",
        f"| Rollback active | `{rollback_active}` |",
        f"| Target ledger seq | `{_val(state.get('rollback_target_seq'), 'n/a')}` |",
        f"| Target release ID | `{_val(state.get('rollback_target_release_id'), 'n/a')}` |",
        f"| Target git SHA | `{_val(state.get('rollback_target_git_sha'), 'n/a')}` |",
        "",
        "---",
        "",
        "## Verification Status",
        "",
        "| Check | Status |",
        "|-------|--------|",
        f"| Ledger verification state | `{_val(state.get('verification_state'), 'unknown')}` |",
        f"| Active release seq | `{_val(state.get('active_seq'), 'n/a')}` |",
        "",
        "---",
        "",
        "## Metadata",
        "",
        "| Field | Value |",
        "|-------|-------|",
        f"| generated_from_seq | `{state.get('last_seq', 0)}` |",
        f"| spec | `{SPEC_VERSION}` |",
        "",
    ]
    return "\n".join(lines) + "\n"


def render_deployment_state(state: dict[str, Any]) -> str:
    entries = state.get("journal_entries") or []
    lines = [
        "# DEPLOYMENT STATE — OSCTL Journal Projection",
        "",
        f"> **Source:** ledger only · **Spec:** `{SPEC_VERSION}` · "
        f"**Entries:** `{len(entries)}`",
        "",
        "---",
        "",
    ]

    if not entries:
        lines.append("_No deployment journal entries in ledger._")
        lines.append("")
        return "\n".join(lines)

    for entry in entries:
        lines.extend(
            [
                f"## Entry seq `{entry.get('seq')}` · `{entry.get('type')}`",
                "",
                "| Field | Value |",
                "|-------|-------|",
                f"| Release ID | `{_val(entry.get('release_id'), 'n/a')}` |",
                f"| Git SHA | `{_val(entry.get('git_sha'), 'n/a')}` |",
                f"| Actor | `{_val(entry.get('actor'), 'n/a')}` |",
                f"| Environment | `{_val(entry.get('env'), 'n/a')}` |",
                f"| Lifecycle state | `{_val(entry.get('lifecycle_state'), 'n/a')}` |",
                f"| Verification state | `{_val(entry.get('verification_state'), 'n/a')}` |",
                f"| Recorded at (UTC) | `{_val(entry.get('ts'), 'n/a')}` |",
            ]
        )
        if entry.get("type") == "rollback.recorded":
            lines.append(
                f"| Rollback reference | `seq:{entry.get('rollback_target_seq')}` |"
            )
            lines.append(f"| Reason | `{_val(entry.get('reason'), 'n/a')}` |")
        if entry.get("type") == "reconcile.recorded":
            lines.append(f"| Summary | `{_val(entry.get('summary'), 'n/a')}` |")
        refs = entry.get("refs") or {}
        if refs:
            ref_parts = ", ".join(f"{k}={v}" for k, v in sorted(refs.items()))
            lines.append(f"| Refs | `{ref_parts}` |")
        lines.extend(["", "---", ""])

    lines.extend(
        [
            "## Rollback Pointers",
            "",
            "| Field | Value |",
            "|-------|-------|",
            f"| Rollback active | `{'yes' if state.get('rollback_active') else 'no'}` |",
            f"| Target seq | `{_val(state.get('rollback_target_seq'), 'n/a')}` |",
            f"| Target release | `{_val(state.get('rollback_target_release_id'), 'n/a')}` |",
            "",
            f"_generated_from_seq: {state.get('last_seq', 0)}_",
            "",
        ]
    )
    return "\n".join(lines)


def render_projections(state: dict[str, Any]) -> dict[str, str]:
    return {
        CURRENT_STATUS_FILE: render_current_status(state),
        DEPLOYMENT_STATE_FILE: render_deployment_state(state),
    }
