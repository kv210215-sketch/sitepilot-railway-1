# OSCTL Architecture Freeze

**Freeze ID:** `osctl-freeze/1.5`  
**Core spec:** `osctl-core/1.0`  
**Date:** 2026-05-23  
**Status:** **FROZEN**

---

## Declaration

The OSCTL governance architecture for Phase 1.5 is **frozen**. The minimal deterministic core (`ops/osctl/core/`) and governing documents in `ops/osctl/` define the operational state foundation.

**This freeze covers:**

- Ledger model and append semantics
- Event schema (`osctl-core/1.0`)
- Lifecycle state machine
- Serialization and replay guarantees
- Projection rules (`CURRENT_STATUS`, `DEPLOYMENT_STATE`)
- Verification and drift detection model
- Human authority boundaries
- Explicit non-goals

**This freeze does not authorize:**

- CI workflow changes
- Deploy orchestration
- Railway / Cloudflare integration
- Autonomous or AI-operated production actions

---

## Frozen Decisions

| ID | Decision | Document |
|----|----------|----------|
| F-001 | Append-only ledger at `ops/state/ledger/events.jsonl` | `LEDGER_MODEL.md` |
| F-002 | Projections at `ops/state/projections/` — derived only | `PROJECTION_RULES.md` |
| F-003 | Event types: `deploy.recorded`, `rollback.recorded`, `reconcile.recorded`, `incident.recorded` | `EVENT_SCHEMA.md` |
| F-004 | Spec version pinned: `osctl-core/1.0` | `EVENT_SCHEMA.md` |
| F-005 | Pure fold/render — no external I/O | `REPLAY_GUARANTEES.md` |
| F-006 | Canonical JSON serialization | `SERIALIZATION_RULES.md` |
| F-007 | Verify: schema + transitions + rollback + env + drift | `VERIFY_MODEL.md` |
| F-008 | Rollback = metadata, not automation | `ROLLBACK_POLICY.md` |
| F-009 | Production authority = human permanent | `HUMAN_BOUNDARIES.md` |
| F-010 | Hash chain deferred | `LEDGER_MODEL.md` |

---

## Validation Evidence

| Check | Result |
|-------|--------|
| `python ops/osctl/validation/run_validation.py` | 19/19 PASS |
| `python -m ops.osctl.core verify` | PASS (production ledger) |
| Replay fingerprint stability | PASS |
| Negative case detection | PASS |

Evidence: `ops/osctl/validation/`

---

## Frozen Paths

| Artifact | Path |
|----------|------|
| Ledger | `ops/state/ledger/events.jsonl` |
| Projections | `ops/state/projections/CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` |
| Core | `ops/osctl/core/` |
| CLI | `python -m ops.osctl.core {append,replay,verify}` (`project` aliases `replay`) |

---

## Amendment Process

Changes to frozen semantics require:

1. Human owner proposal with rationale
2. Updated validation scenarios (`ops/osctl/validation/`)
3. Spec version bump (e.g. `osctl-core/1.1`)
4. New freeze ID (e.g. `osctl-freeze/1.6`)
5. Explicit sign-off below

**Allowed without bump:** Documentation clarifications that do not change behavior. Core bug fixes that restore documented behavior.

---

## Superseded Planning Artifacts

| Document | Status |
|----------|--------|
| `ARCHITECTURE_FREEZE_CHECKLIST.md` | Superseded by this freeze — retained for history |
| `SPEC_REFERENCE.md` (draft `osctl-spec/0.1.0-draft`) | Superseded by `EVENT_SCHEMA.md` (`osctl-core/1.0`) |

Draft event names (`deploy.observed`, `rollback.marked`) are **not** implemented in core. Implemented names use `.recorded` suffix.

---

## Sign-Off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Owner | _pending_ | | |
| Reviewer | _pending_ | | |

---

## Phase Gate

| Phase | Entry condition |
|-------|-----------------|
| **1.5 (now)** | Freeze declared; core validated |
| 2 | Human approves CI observe-only integration plan |
| 3 | Projections stable; verify gate policy defined |
| 4 | Ledger sync policy — still not deploy orchestration |
