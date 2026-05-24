# OSCTL Architecture Consistency Audit

**Date:** 2026-05-24  
**Mode:** Read-only local audit  
**Scope:** `ops/osctl/`, `ops/state/`, root governance, `MASTER_CONTEXT.md`  
**Auditor:** Architecture Consistency Agent (strict mode)

---

## Executive Summary

The OSCTL **trust kernel** (`ops/osctl/core/`) is internally coherent and validation evidence reports 19/19 PASS. However, **governance documents disagree with implementation defaults** on canonical artifact paths, and **multiple parallel authority surfaces** exist for operational truth. Architecture consistency is **PARTIAL** — core behavior is frozen; document topology is not unified.

**Consistency verdict:** **CONDITIONAL FAIL** — safe for local validation; not safe for git anchoring without path reconciliation.

---

## Layer Model (Observed)

| Layer | Path | Role | Consistency |
|-------|------|------|-------------|
| L0 — Ledger truth | `ops/osctl/ledger/` (runtime default) | Append-only events | **Conflicts with freeze docs** |
| L0 — Ledger truth (declared) | `ops/state/ledger/` | Declared canonical in freeze | **Duplicate bytes; same 5 events** |
| L1 — Core | `ops/osctl/core/` | append / replay / verify | **Consistent** |
| L2 — Validation | `ops/osctl/validation/` | Evidence package | **Consistent; untracked** |
| L3 — Snapshots | `ops/osctl/snapshots/` | Read-only acceleration | **Consistent internally; phase label conflicts** |
| L4 — Examples | `ops/osctl/examples/` | Rehearsals | **Consistent** |
| L5 — Audit | `ops/osctl/audit/` | Hygiene + this audit | **Present; untracked** |
| Adjacent ops | `ops/state/`, `ops/rituals/`, `ops/simulations/` | Templates, rituals | **Separate; governance overlap** |
| Root authority | `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` | Legacy agent context | **Conflicts with ledger projections** |
| Coordination | *(missing)* | Referenced in hygiene docs | **Gap — no `coordination/` directory** |

---

## Critical Path Conflicts

### C-1: Ledger canonical path (HIGH)

| Source | Declared ledger path |
|--------|---------------------|
| `ARCHITECTURE_FREEZE.md` F-001 | `ops/state/ledger/events.jsonl` |
| `LEDGER_MODEL.md` | `ops/state/ledger/events.jsonl` |
| `GOVERNANCE.md` | `ops/state/ledger/events.jsonl` |
| `ops/osctl/README.md` | `ops/state/ledger/events.jsonl` |
| `ARCHITECTURE_DECISIONS.md` ADR-001 | `ops/osctl/ledger/` |
| `BOUNDARIES.md` | `ops/osctl/ledger/*.jsonl` |
| `core/ledger/paths.py` | `ops/osctl/ledger/events.jsonl` |
| `validation/run_validation.py` | Uses `default_ledger_path()` → osctl ledger |
| Snapshot examples | `ops/osctl/ledger/events.jsonl` |

**Observation:** Both paths exist with **identical content** (5 events, byte-for-byte same narrative). Runtime CLI defaults to `ops/osctl/ledger/`; freeze declaration points to `ops/state/ledger/`.

**Risk:** Operators run verify against one ledger while governance declares the other canonical. Drift can emerge silently after first divergent append.

---

### C-2: Projection canonical path (HIGH)

| Source | Declared projection path |
|--------|-------------------------|
| `ARCHITECTURE_FREEZE.md` F-002 | `ops/state/projections/` |
| `GOVERNANCE.md` | `ops/state/projections/` |
| `core/ledger/paths.py` | `ops/osctl/projections/` |
| `core/cli/main.py` help text | Default `ops/osctl/projections` |
| `ops/osctl/examples/*/projections/` | Fixture copies per scenario |

**Observation:** `ops/state/projections/` contains OSCTL-derived projections (seq 5). `ops/osctl/projections/` contains generated fixtures. Root `CURRENT_STATUS.md` / `DEPLOYMENT_STATE.md` are **third copies** — legacy manual docs (last verified 2026-05-02), not ledger-derived.

---

### C-3: CLI surface vs freeze declaration (MEDIUM)

| Source | Commands |
|--------|----------|
| `ARCHITECTURE_FREEZE.md` | `{append, project, verify}` |
| `core/cli/main.py` (implemented) | `{append, replay, verify}` |
| `ops/osctl/README.md` Quick Start | `project` |
| `HUMAN_BOUNDARIES.md` | `python -m ops.osctl.core project` |
| Examples / validation | Predominantly `replay` |

**Risk:** Copy-paste failures; automation scripts referencing non-existent `project` subcommand.

---

### C-4: Superseded spec still present (MEDIUM)

| Document | Status per freeze | Content hazard |
|----------|-------------------|----------------|
| `SPEC_REFERENCE.md` | Superseded by `EVENT_SCHEMA.md` | Draft `deploy.observed`, `rollback.marked`, lock events, CI ingest YAML |
| `IMPLEMENTATION_NOTES.md` | Planning-only header | Describes `osctl deploy` absence, locks, TTL — draft architecture |
| `ARCHITECTURE_DECISIONS.md` | Frozen ADRs | References draft event names (`deploy.*`, `note.human`) |
| `CI_INTEGRATION_PLAN.md` | Phase 1.5 frozen | Phase 2 ledger at `production.jsonl`, `deploy.observed` append |

**Risk:** Agents or operators follow superseded docs and plan orchestration hooks not in `osctl-core/1.0`.

---

### C-5: Freeze ID version drift (LOW)

| Document | Freeze ID |
|----------|-----------|
| Majority of frozen docs | `osctl-freeze/1.5` |
| `ARCHITECTURE_DECISIONS.md` | `osctl-freeze/1.0` |
| `ARCHITECTURE_FREEZE_CHECKLIST.md` | `osctl-freeze/0.0` → `1.0` target |
| `CI_INTEGRATION_PLAN.md` exit criteria | `osctl-freeze/1.0` sign-off |

---

## Governance Overlap

| Topic | `ops/osctl/GOVERNANCE.md` | `ops/state/GOVERNANCE.md` | `MASTER_CONTEXT.md` |
|-------|---------------------------|---------------------------|---------------------|
| Role model | Human / CI / OSCTL / agents | Same roles, ritual framing | Backend-focused; OSCTL snapshot section |
| Ledger path | `ops/state/ledger/` | Append-only (path implicit) | Points to validation summary |
| Phase model | 1.5 → 2 → 3 → 4 (CI gates) | Phase 2+ recording | Phase 3 = snapshot layer |
| Authority | VERIFY before ACT | Humans approve production | Snapshots non-authoritative |

**Verdict:** Three governance entry points without explicit precedence matrix beyond `GOVERNANCE.md` document hierarchy (which does not list `ops/state/GOVERNANCE.md` or `MASTER_CONTEXT.md`).

---

## Orchestration Creep Indicators

Planning artifacts describe future automation **without implementation** — acceptable if labeled draft. Concern is **terminology bleed**:

| Location | Creep signal | Implemented? |
|----------|--------------|--------------|
| `CI_INTEGRATION_PLAN.md` Phase 2 | Post-deploy `deploy.observed` append | No |
| `SPEC_REFERENCE.md` | `osctl ingest`, lock events | No |
| `IMPLEMENTATION_NOTES.md` | Lock TTL, rollback banner | No |
| `ops/state/GOVERNANCE.md` | Future `deploy.observed` CI append | No |
| `ops/rituals/WEEKLY_RECONCILIATION.md` | Compare Railway to `deploy.observed` | No |
| Core CLI | Local filesystem only | Yes — clean |

**Net:** No runtime orchestration detected in `core/`. Creep is **document-level** only.

---

## Git / Workspace State

| Check | Result |
|-------|--------|
| `git ls-files -- ops/` | Empty — entire ops tree untracked |
| Tracked modifications outside OSCTL | `backend/src/app.module.ts`, `docker-compose.yml` |
| Untracked root governance | `MASTER_CONTEXT.md`, `AGENT_RULES.md`, `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` |
| Branch | `main...origin/main [ahead 1]` |

**Mixed workspace risk:** HIGH — OSCTL anchoring would collide with backend/docker changes if staged together.

---

## Artifact Hygiene

| Artifact | Location | Verdict |
|----------|----------|---------|
| `__pycache__/` | `ops/__pycache__/` (2 `.pyc` files) | Present — not under `ops/osctl/` |
| Generated projections | `ops/osctl/projections/*.generated.md`, examples | Expected fixtures |
| Duplicate ledgers | `ops/osctl/ledger/` + `ops/state/ledger/` | **Must reconcile before anchor** |
| `.generated.md` in examples | Multiple rehearsal dirs | Acceptable as fixtures |

---

## Coordination Layer Gap

Hygiene docs (`GIT_TRACKING_STATUS.md`, `SAFE_STAGE_SEQUENCE.md`, `REPO_CLEANUP_REPORT.md`) reference a **coordination layer** for anchoring. No `ops/osctl/coordination/` or `ops/coordination/` directory exists.

**Likely intent:** `ops/rituals/`, `ops/simulations/`, or `ops/state/` templates — **not classified**.

---

## Recommendations (Human — Not Executed)

1. **Resolve ledger/projection canonical path** — amend freeze to match `paths.py` OR change `paths.py` to match freeze; delete duplicate or mark one as fixture-only.
2. **Alias or rename CLI** — add `project` as alias for `replay` OR update all docs to `replay`.
3. **Quarantine superseded docs** — move `SPEC_REFERENCE.md`, draft sections of `IMPLEMENTATION_NOTES.md` to `archive/` or add prominent SUPERSEDED banner.
4. **Unify phase vocabulary** — see `PHASE_ALIGNMENT_MATRIX.md`.
5. **Retire root legacy MDs** — redirect `AGENT_RULES.md` to ledger-verify-first read path.
6. **Define coordination layer** — document whether `ops/state/` + `ops/rituals/` satisfy the reference or create explicit `coordination/` README.

---

## Consistency Scorecard

| Area | Score | Notes |
|------|-------|-------|
| Core determinism | PASS | Validation evidence |
| Path topology | FAIL | Dual ledger + triple projections |
| CLI/doc alignment | FAIL | project vs replay |
| Event schema docs | PARTIAL | Frozen vs draft coexist |
| Phase vocabulary | FAIL | Phase 3 dual meaning |
| Git anchoring readiness | FAIL | Untracked + mixed workspace |
| Orchestration isolation | PASS | No infra calls in core |
| Snapshot layer isolation | PASS | Read-only scripts only |

**Overall architecture consistency:** **NO-GO for anchoring** until C-1, C-2, C-3 resolved.
