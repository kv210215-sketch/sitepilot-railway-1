# OSCTL Invariant Registry

**Date:** 2026-05-24  
**Spec:** `osctl-core/1.0` · **Freeze:** `osctl-freeze/1.5` (majority)  
**Purpose:** Canonical list of invariants, enforcement status, and detected conflicts

---

## Registry Legend

| Status | Meaning |
|--------|---------|
| ENFORCED | Core code or verify rejects violation |
| DOCUMENTED | Spec-only; not code-enforced |
| CONFLICT | Sources disagree |
| DEFERRED | Explicitly postponed |
| VIOLATED (process) | Workspace state breaks invariant |

---

## Core Invariants (from FREEZE_v1 / ARCHITECTURE_FREEZE)

| ID | Invariant | Status | Enforcement |
|----|-----------|--------|-------------|
| I-001 | Ledger is append-only — no in-place event mutation | ENFORCED | `store.py` O_APPEND; no update API |
| I-002 | Seq is monotonic contiguous `1..N` on read | ENFORCED | `read_events()` gap rejection |
| I-003 | Projections derive solely from ledger replay | ENFORCED | Pure fold/render |
| I-004 | Fold and render are pure — no external I/O | ENFORCED | Validation isolation tests |
| I-005 | Identical ledger → identical projection fingerprint | ENFORCED | `projection_fingerprint()` |
| I-006 | Closed event type enum (4 types) | ENFORCED | `events.py` schema validation |
| I-007 | Spec version must be `osctl-core/1.0` | ENFORCED | Schema validator |
| I-008 | UTC timestamp format with `Z` suffix | ENFORCED | Regex validation |
| I-009 | Production env_posture — key names only, never values | ENFORCED | Schema + policy |
| I-010 | Rollback targets must reference valid deploy seq | ENFORCED | `verify` rollback checks |
| I-011 | On-disk projections must match replay hash | ENFORCED | Drift detection in verify |
| I-012 | OSCTL does not deploy or call infra APIs | ENFORCED | No such code in core |
| I-013 | Snapshots never override ledger authority | DOCUMENTED | Phase 3 policy only |
| I-014 | Human owns production go/no-go permanently | DOCUMENTED | `HUMAN_BOUNDARIES.md` |
| I-015 | Hash chain (`prev_hash` / `hash`) | DEFERRED | `LEDGER_MODEL.md` |
| I-016 | Actor identity authorization | DEFERRED | `NON_GOALS.md` |
| I-017 | Concurrent append safety (file locking) | DEFERRED | `DETERMINISM_REPORT.md` |

---

## Path Invariants (CONFLICT DETECTED)

| ID | Invariant (declared) | Declared by | Actual default | Status |
|----|-------------------|-------------|----------------|--------|
| P-001 | Canonical ledger at `ops/state/ledger/events.jsonl` | `ARCHITECTURE_FREEZE` F-001, `LEDGER_MODEL`, `GOVERNANCE` | `ops/osctl/ledger/events.jsonl` | **CONFLICT** |
| P-002 | Canonical projections at `ops/state/projections/` | `ARCHITECTURE_FREEZE` F-002, `GOVERNANCE` | `ops/osctl/projections/` | **CONFLICT** |
| P-003 | Single machine-readable source of truth (one ledger) | ADR-001 | Two identical ledger files exist | **VIOLATED (process)** |
| P-004 | Root MD never ingest target | ADR-003 | Root MDs exist as agent read targets | **CONFLICT** |

**Resolution required:** Amend freeze paths OR change `paths.py` — one source must win.

---

## Schema Invariants (CONFLICT DETECTED)

| ID | Invariant | Frozen (`EVENT_SCHEMA.md`) | Draft (superseded docs) | Status |
|----|-----------|------------------------------|-------------------------|--------|
| S-001 | Deploy event type | `deploy.recorded` | `deploy.observed` (`SPEC_REFERENCE`) | **CONFLICT** |
| S-002 | Rollback event type | `rollback.recorded` | `rollback.marked` | **CONFLICT** |
| S-003 | Reconcile event type | `reconcile.recorded` | *(various draft names)* | PARTIAL |
| S-004 | Lock events | Not in v1.0 | `lock.acquired` / `lock.released` in SPEC_REFERENCE | DOCUMENTED draft only |
| S-005 | Human note events | Not in v1.0 | `note.human` in ADR-001 | DOCUMENTED draft only |

**Enforcement:** Core accepts **only** `.recorded` types. Draft names in ADRs are **stale relative to implementation**.

---

## CLI Invariants (CONFLICT DETECTED)

| ID | Invariant | Declared | Implemented | Status |
|----|-----------|----------|-------------|--------|
| CLI-001 | Projection regeneration command | `project` (README, FREEZE, HUMAN_BOUNDARIES) | `replay` (`main.py`) | **CONFLICT** |
| CLI-002 | No `deploy` subcommand | NON_GOALS | Absent | ENFORCED |
| CLI-003 | No `ingest` subcommand | SPEC_REFERENCE (draft) | Absent | ENFORCED |
| CLI-004 | Local filesystem only | All commands | Yes | ENFORCED |

---

## Phase Invariants

| ID | Invariant | Status | Notes |
|----|-----------|--------|-------|
| PH-001 | Phase 1.5 = frozen core, no CI mutation | ENFORCED (process) | No workflow edits |
| PH-002 | Phase 2 = observe-only external append | DOCUMENTED | Not implemented |
| PH-003 | Phase numbering globally unique | **CONFLICT** | "Phase 3" = CI gate AND snapshot layer |
| PH-004 | Snapshot layer requires validated core | DOCUMENTED | Validation PASS reported |

---

## Git / Process Invariants

| ID | Invariant | Status |
|----|-----------|--------|
| G-001 | Trust kernel reproducible from git clone | **VIOLATED (process)** — ops untracked |
| G-002 | Validation evidence matches anchored core | **VIOLATED (process)** |
| G-003 | No mixed authority commits | **VIOLATED (process)** — backend + ops dirty |
| G-004 | No bytecode in tracked ops tree | PARTIAL — `ops/__pycache__/` present |
| G-005 | VERIFY before ACT for agents | **VIOLATED (process)** — AGENT_RULES bypass |

---

## Invariant Conflict Summary

| Priority | IDs | Impact |
|----------|-----|--------|
| P0 | P-001, P-002, P-003 | Split-brain ledger/projection truth |
| P0 | G-001, G-002, G-003 | Trust chain not reproducible |
| P1 | S-001, S-002, CLI-001 | Operator/agent confusion |
| P1 | P-004, G-005 | Hidden authority via legacy MDs |
| P2 | PH-003 | Phase planning ambiguity |
| P2 | Freeze ID 1.0 vs 1.5 | Version label noise |

---

## Amendment Rules (from freeze)

Changes to I-001 through I-012 require:

1. Human owner proposal  
2. Updated validation scenarios  
3. Spec version bump (`osctl-core/1.1+`)  
4. New freeze ID  
5. Sign-off  

Path invariants P-001/P-002 may be resolved as **documentation + paths.py alignment** without spec bump if event semantics unchanged.

---

## Registry Verdict

**Code invariants:** 12/12 core invariants **ENFORCED** in `ops/osctl/core/`.  
**System invariants:** 5 **CONFLICT**, 4 **VIOLATED (process)**.  
**Registry status:** **INCOMPLETE** until path and schema documentation reconciled.
