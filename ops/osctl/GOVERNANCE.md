# OSCTL Governance

**Freeze ID:** `osctl-freeze/1.5`  
**Core spec:** `osctl-core/1.0`  
**Status:** Frozen — Phase 1.5  
**Scope:** Deterministic operational state governance only

---

## Purpose

OSCTL is the **governance layer for recorded operational truth** in SitePilot. It defines how deployment history is stored, replayed, verified, and projected — under **human authority**.

OSCTL is **not** a deploy system, infra controller, or autonomous operator.

---

## Governance Principles

| Principle | Rule |
|-----------|------|
| Append-only truth | Ledger events are immutable; corrections via new events only |
| Derived projections | `CURRENT_STATUS.md` and `DEPLOYMENT_STATE.md` are replay output — never authoritative writes |
| Deterministic replay | Fixed ledger bytes → identical fold → identical projections |
| Human production authority | Go/no-go, rollback, reconcile, secrets, migrations remain human-owned |
| Verify before trust | Non-zero `verify` blocks reliance on projections |
| Execution ≠ truth | CI/Railway outcomes require explicit ledger ingest to become record |

---

## Document Hierarchy

| Priority | Document | Role |
|----------|----------|------|
| 1 | `ARCHITECTURE_FREEZE.md` | Binding freeze declaration |
| 2 | `ARCHITECTURE_DECISIONS.md` | ADRs |
| 3 | `NON_GOALS.md` | Explicit exclusions |
| 4 | `GOVERNANCE.md` | This file — role and authority model |
| 5 | `HUMAN_BOUNDARIES.md` | Human vs automatable vs forbidden |
| 6 | `LEDGER_MODEL.md` | Canonical store contract |
| 7 | `EVENT_SCHEMA.md` | Event types and fields |
| 8 | `STATE_MACHINE.md` | Lifecycle transitions |
| 9 | `SERIALIZATION_RULES.md` | Canonical bytes |
| 10 | `PROJECTION_RULES.md` | Ledger → MD mapping |
| 11 | `REPLAY_GUARANTEES.md` | Determinism contract |
| 12 | `VERIFY_MODEL.md` | Verification layers |
| 13 | `DRIFT_DETECTION.md` | Mismatch classes and response |
| 14 | `ROLLBACK_POLICY.md` | Rollback semantics |
| 15 | `TRUST_MODEL.md` | Guarantees and non-claims |

Conflicts: freeze docs win over ad-hoc markdown edits.

---

## Role Model

| Role | Responsibility | Authority |
|------|----------------|-----------|
| **Human owner** | Production gate, rollback, reconcile, secrets, migrations | Highest |
| **CI (GHA)** | Build, deploy execute, future observe-only ingest | Execute + observe |
| **OSCTL core** | Append, fold, render, verify | Truth of **record** |
| **Agents (Cursor/Claude)** | Draft events, read projections | Advisory; no prod authority |

---

## Operational Workflow (Phase 1.5)

```text
External action (deploy/rollback/smoke)
  → Human or CI drafts event JSON
  → Human approves prod assertions
  → osctl append --file event.json
  → osctl project
  → osctl verify
  → Projections trusted if verify exit 0
```

No step is autonomous. No step calls Railway or triggers deploy.

---

## Artifact Locations

| Artifact | Path |
|----------|------|
| Ledger | `ops/state/ledger/events.jsonl` |
| Projections | `ops/state/projections/` |
| Core implementation | `ops/osctl/core/` |
| Validation evidence | `ops/osctl/validation/` |
| Rituals | `ops/rituals/` |

---

## Phase Alignment

| Phase | Mode |
|-------|------|
| 1 | Manual templates |
| **1.5** | **Frozen governance + deterministic core (now)** |
| 2 | CI observe-only ingest (human-approved policy) |
| 3 | CI verify gate on projections |
| 4 | Ledger sync policy (still not deploy orchestration) |

---

## Sign-Off

Architecture freeze is declared in `ARCHITECTURE_FREEZE.md`. Implementation changes to core semantics require freeze version bump and human owner approval.
