# OSCTL Terminology Registry

**Date:** 2026-05-24  
**Purpose:** Resolve ambiguous terms detected across `ops/osctl/`, `ops/state/`, root governance

---

## Canonical Terms (Frozen — Prefer These)

| Term | Definition | Authority doc |
|------|------------|---------------|
| **Ledger** | Append-only JSONL event store | `LEDGER_MODEL.md` |
| **Event** | Single JSON object line in ledger | `EVENT_SCHEMA.md` |
| **Projection** | MD read model derived from replay | `PROJECTION_RULES.md` |
| **Replay** | fold + render pipeline over ledger | `REPLAY_GUARANTEES.md` |
| **Verify** | Schema + transition + drift checks | `VERIFY_MODEL.md` |
| **Fingerprint** | SHA-256 of canonical projection output | `VERIFY_MODEL.md` |
| **Trust kernel** | `ops/osctl/core/` | `snapshots/SNAPSHOT_ARCHITECTURE.md` |
| **Snapshot** | Sealed export at fixed `ledger_seq` | `SNAPSHOT_FORMAT.md` |
| **Actor** | String ID on events (`human:`, `ci:`, `agent:`) | `EVENT_SCHEMA.md` |
| **Freeze ID** | Governance version tag | `ARCHITECTURE_FREEZE.md` |
| **Spec version** | Event schema tag `osctl-core/1.0` | `EVENT_SCHEMA.md` |

---

## Deprecated / Draft Terms (Do Not Use in New Docs)

| Term | Superseded by | Found in |
|------|---------------|----------|
| `deploy.observed` | `deploy.recorded` | `SPEC_REFERENCE.md`, `CI_INTEGRATION_PLAN.md`, `ops/state/GOVERNANCE.md`, rituals |
| `rollback.marked` | `rollback.recorded` | `SPEC_REFERENCE.md`, `ARCHITECTURE_DECISIONS.md` |
| `health.observed` | Fields on `deploy.recorded` payload | `SPEC_REFERENCE.md`, `IMPLEMENTATION_NOTES.md` |
| `migration.observed` | Not in v1.0 enum | `ARCHITECTURE_DECISIONS.md`, `SPEC_REFERENCE.md` |
| `env.declared` | `env_posture` on deploy events | `SPEC_REFERENCE.md` |
| `note.human` | Not in v1.0 enum | `ARCHITECTURE_DECISIONS.md` ADR-001 |
| `lock.acquired` / `lock.released` | Not in v1.0 | `SPEC_REFERENCE.md`, `IMPLEMENTATION_NOTES.md` |
| `osctl ingest` | `python -m ops.osctl.core append` | `SPEC_REFERENCE.md`, `CI_INTEGRATION_PLAN.md` |
| `osctl project` | `python -m ops.osctl.core replay` | `README.md`, `HUMAN_BOUNDARIES.md`, `ARCHITECTURE_FREEZE.md` |
| `osctl-spec/0.1.0-draft` | `osctl-core/1.0` | `SPEC_REFERENCE.md` header |
| `osctl-freeze/1.0` | `osctl-freeze/1.5` | `ARCHITECTURE_DECISIONS.md`, `CI_INTEGRATION_PLAN.md` |

---

## Ambiguous Terms (Require Disambiguation)

### "Phase 3" — DUAL MEANING (CRITICAL)

| Context | Meaning | Documents |
|---------|---------|-----------|
| **Governance roadmap** | CI verify gate on projections | `GOVERNANCE.md`, `README.md`, `FREEZE_v1.md`, `ARCHITECTURE_FREEZE.md` |
| **Snapshot layer** | Read-only snapshot acceleration | `snapshots/PHASE3_FINAL_REVIEW.md`, `MASTER_CONTEXT.md` OSCTL section |

**Recommendation:** Rename snapshot work to **"Snapshot Layer (SL)"** or **"Phase 1.5-S"** — reserve Phase 2/3/4 for CI integration roadmap only.

---

### "Coordination layer"

| Context | Meaning |
|---------|---------|
| Hygiene/audit docs | Unspecified layer for git anchoring alongside audit |
| Observed filesystem | **Does not exist** as directory |

**Likely substitutes:** `ops/state/` (templates), `ops/rituals/`, `ops/simulations/`

---

### "Source of truth"

| Object | Truth type |
|--------|------------|
| Ledger (`events.jsonl`) | **Canonical machine truth** |
| Projections | **Derived truth** — authoritative only after verify |
| Snapshots | **Non-authoritative acceleration** |
| Root `CURRENT_STATUS.md` | **Legacy manual summary** — not OSCTL truth |
| `BUILD_STATUS.md` | **Historical deploy report** — not ledger |

---

### "Production"

| Context | Meaning |
|---------|---------|
| Event `env` field | String value e.g. `"production"` |
| Railway environment | External runtime |
| Production gate | Human go/no-go — not health 200 |

---

### "Record" vs "Observe"

| Term | OSCTL v1.0 usage |
|------|------------------|
| `.recorded` suffix | Implemented event types |
| "observe" | CI/human **external** action before append — not an event type name |
| "ingest" | Draft synonym for append — avoid |

---

### "Project" vs "Replay"

| Term | Correct usage |
|------|---------------|
| **Replay** (CLI) | Implemented command regenerating projections |
| **Project** (noun) | Projection artifact or process concept |
| **Project** (CLI verb) | **Incorrect** in current core — docs should say `replay` |

---

### "Journal"

| Term | Meaning |
|------|---------|
| `DEPLOYMENT_STATE` journal | Human-readable deploy narrative **derived** from ledger |
| "Source journal" (ADR-004) | Narrative source for humans — **not** canonical store |

---

### "Fixture" vs "Production ledger"

| Path | Intended role (observed) |
|------|------------------------|
| `ops/osctl/ledger/events.jsonl` | Bundled demo/fixture used by CLI default |
| `ops/state/ledger/events.jsonl` | Declared production-class path in freeze |
| `validation/scenarios/*/events.jsonl` | Test fixtures |

**Problem:** Both osctl and state ledgers contain prod-like Railway refs — treated as demo narrative, not live anchor.

---

## Document Prefix Conventions

| Prefix | Meaning |
|--------|---------|
| `*.generated.md` | Replay output — do not hand-edit |
| `SUPERSEDED` (missing) | Should mark `SPEC_REFERENCE.md`, checklist drafts |
| `Freeze ID:` header | Governance binding level |

---

## Actor Prefix Registry

| Pattern | Meaning | Append authority |
|---------|---------|------------------|
| `human:*` | Human operator | Yes (with prod gate) |
| `ci:*` | CI job identity | Phase 2+ observe-only (planned) |
| `agent:*` | AI agent | No direct append |

Example bundled: `ci:deploy-railway:deploy-backend` on seq 1 deploy event.

---

## File Naming Registry

| File | Role |
|------|------|
| `CURRENT_STATUS.md` | Projection name — may exist at root (legacy), `ops/state/projections/`, or `ops/osctl/projections/` |
| `DEPLOYMENT_STATE.md` | Same multiplicity |
| `events.jsonl` | Ledger file standard name |
| `*.generated.md` | Deterministic replay output in examples |

---

## Terminology Hygiene Actions (Human)

1. Global replace `project` → `replay` in CLI examples OR add alias in core  
2. Add `SUPERSEDED — see EVENT_SCHEMA.md` banner to `SPEC_REFERENCE.md`  
3. Disambiguate "Phase 3" in all snapshot docs → "Snapshot Layer"  
4. Define "coordination layer" in `ops/README.md` or remove from anchoring plans  
5. Update rituals/simulations to use `.recorded` event names  

---

## Registry Verdict

**Frozen terminology (core):** Coherent.  
**Cross-repo terminology:** **FRAGMENTED** — draft spec vocabulary persists in ADRs, rituals, agent rules, and CI plans.  
**Priority fix:** Phase numbering and project/replay CLI naming.
