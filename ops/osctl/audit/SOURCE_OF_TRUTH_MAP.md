# OSCTL Source-of-Truth Map

**Date:** 2026-05-24
**Mode:** Read-only consolidation audit (strict)
**Purpose:** Identify the single canonical source for every governance, code, schema, path, and evidence concept in OSCTL. Where multiple files claim authority for the same fact, mark the canonical and redirect the rest.

---

## 1. Canonical-Source Table

For each concept the **Canonical** column is the only file that may declare the rule. Every other listed file must reference, not restate.

| Concept | Canonical | Currently Restated In | Conflict? |
|---------|-----------|----------------------|-----------|
| Freeze ID + spec version | `ARCHITECTURE_FREEZE.md` | `FREEZE_v1.md`, `README.md`, `GOVERNANCE.md`, `ARCHITECTURE_DECISIONS.md` (`1.0` — drift), `CI_INTEGRATION_PLAN.md` (`1.0`) | Yes — version drift 1.0 vs 1.5 |
| Frozen invariants (I-001..I-012) | `FREEZE_v1.md` §6 | `audit/INVARIANT_REGISTRY.md` (full restatement), `ARCHITECTURE_FREEZE.md` §"Frozen Decisions" (subset F-001..F-010) | No (overlapping but consistent) |
| Closed event-type enum | `EVENT_SCHEMA.md` (+ `core/schema/events.py`) | `FREEZE_v1.md` §4, `SPEC_REFERENCE.md` (draft names — divergent), rituals, `CI_INTEGRATION_PLAN.md`, `IMPLEMENTATION_NOTES.md` | Yes — `.observed` vs `.recorded` |
| Ledger path | `LEDGER_MODEL.md` (+ `core/ledger/paths.py`) | `ARCHITECTURE_FREEZE.md` F-001 → `ops/state/ledger/`; `paths.py` → `ops/osctl/ledger/`; `BOUNDARIES.md`, ADR-001, `GOVERNANCE.md` | **Yes — split-brain** |
| Projection path | `PROJECTION_RULES.md` (+ `core/ledger/paths.py`) | `ARCHITECTURE_FREEZE.md` F-002 → `ops/state/projections/`; `paths.py` → `ops/osctl/projections/`; root legacy MDs | **Yes — split-brain** |
| CLI surface | `core/cli/main.py` (`append`, `replay`, `verify`) | `ARCHITECTURE_FREEZE.md`, `README.md`, `HUMAN_BOUNDARIES.md` (all use `project`), `IMPLEMENTATION_NOTES.md` (`ingest`), `SPEC_REFERENCE.md` (`ingest`) | Yes — `project` vs `replay`, `ingest` vs `append` |
| Replay determinism contract | `REPLAY_GUARANTEES.md` | `FREEZE_v1.md` §1, `TRUST_MODEL.md`, `validation/TRUST_MODEL.md`, `validation/DETERMINISM_REPORT.md` (evidence — OK), snapshot docs | Restatement, not conflict |
| Verify layers | `VERIFY_MODEL.md` | `TRUST_MODEL.md`, `validation/TRUST_MODEL.md`, `FREEZE_v1.md`, `audit/INVARIANT_REGISTRY.md` | Restatement |
| Serialization rules | `SERIALIZATION_RULES.md` | `FREEZE_v1.md`, `core/schema/serialize.py` (implementation) | Restatement |
| Lifecycle / state machine | `STATE_MACHINE.md` (+ `core/schema/transitions.py`) | None — single source | **No** |
| Rollback policy | `ROLLBACK_POLICY.md` | `BOUNDARIES.md` §Rollback Authority, `HUMAN_BOUNDARIES.md`, ADR-005, `ops/state/GOVERNANCE.md` | Mostly cross-references — OK |
| Drift detection taxonomy | `DRIFT_DETECTION.md` | `VERIFY_MODEL.md`, `FREEZE_v1.md`, `validation/REPLAY_TESTS.md` | Restatement |
| Non-goals (forbidden capabilities) | `NON_GOALS.md` | `HUMAN_BOUNDARIES.md` §"MUST NEVER", `BOUNDARIES.md` §Forbidden, `FREEZE_v1.md` §3, `snapshots/CAPABILITY_MATRIX.md` | Mostly cross-reference — OK |
| Human authority zones | `HUMAN_BOUNDARIES.md` | `BOUNDARIES.md`, `GOVERNANCE.md`, `FREEZE_v1.md` §2, `snapshots/AGENT_AUTHORITY_MAP.md`, `ops/state/GOVERNANCE.md` | Restatement |
| Trust kernel definition | `TRUST_MODEL.md` (osctl) | `validation/TRUST_MODEL.md` (duplicate), `audit/TRUST_BOUNDARY_AUDIT.md`, `audit/TRUST_LAYER_BOUNDARIES.md`, `snapshots/SNAPSHOT_TRUST_BOUNDARIES.md`, `MASTER_CONTEXT.md` | **Yes — two TRUST_MODEL.md files** |
| Snapshot non-authority | `snapshots/SNAPSHOT_TRUST_BOUNDARIES.md` | `SNAPSHOT_ARCHITECTURE.md`, `AGENT_AUTHORITY_MAP.md`, `CAPABILITY_MATRIX.md`, `MASTER_CONTEXT.md`, audit verdicts | Restatement |
| Phase roadmap | `GOVERNANCE.md` §Phase Alignment | `README.md`, `FREEZE_v1.md` §5, `ARCHITECTURE_FREEZE.md` §Phase Gate, `CI_INTEGRATION_PLAN.md`, `ops/state/GOVERNANCE.md` | Restatement |
| Snapshot layer scope label | (none — should be P1.5-S) | `snapshots/PHASE3_FINAL_REVIEW.md` calls it "Phase 3"; `MASTER_CONTEXT.md` echoes; roadmap reserves "Phase 3" | **Yes — phase collision** |
| Validation evidence | `validation/VALIDATION_REPORT.md` + `validation/VALIDATION_SUMMARY.md` | `FREEZE_v1.md` §7, `ARCHITECTURE_FREEZE.md`, `MASTER_CONTEXT.md` | Restatement |
| Agent read contract | `AGENT_RULES.md` (root) | `BOUNDARIES.md` §"What Cursor Owns", `HUMAN_BOUNDARIES.md`, `ops/state/GOVERNANCE.md`, `snapshots/AGENT_AUTHORITY_MAP.md` | Yes — `AGENT_RULES.md` does **not** require verify-first; other docs assume it does |

---

## 2. Authoritative File Map (Frozen — Canonical Set)

```text
SPEC + INVARIANTS
  ARCHITECTURE_FREEZE.md         ← freeze declaration
  FREEZE_v1.md                   ← snapshot of frozen state (invariants table)
  EVENT_SCHEMA.md                ← event types + fields (closed enum)
  STATE_MACHINE.md               ← lifecycle transitions
  LEDGER_MODEL.md                ← ledger contract + canonical path
  PROJECTION_RULES.md            ← projection contract + canonical path
  REPLAY_GUARANTEES.md           ← determinism contract
  VERIFY_MODEL.md                ← verification layers
  SERIALIZATION_RULES.md         ← canonical bytes
  ROLLBACK_POLICY.md             ← rollback semantics
  DRIFT_DETECTION.md             ← mismatch taxonomy
  NON_GOALS.md                   ← forbidden capabilities

GOVERNANCE / AUTHORITY
  GOVERNANCE.md                  ← role and document hierarchy
  BOUNDARIES.md                  ← platform ownership diagram
  HUMAN_BOUNDARIES.md            ← human-vs-automation zones
  TRUST_MODEL.md                 ← guarantees and non-claims (single canonical)
  ARCHITECTURE_DECISIONS.md      ← ADRs (header bumped to 1.5)

IMPLEMENTATION (read from code, not docs)
  core/cli/main.py               ← CLI surface
  core/ledger/paths.py           ← path defaults
  core/schema/events.py          ← event-type enum
  core/schema/transitions.py     ← state machine
  core/replay/engine.py          ← replay
  core/verify/engine.py          ← verify

EVIDENCE (not authority — proof only)
  validation/run_validation.py
  validation/VALIDATION_REPORT.md
  validation/VALIDATION_SUMMARY.md
  validation/HASH_REGISTRY.md
  validation/DETERMINISM_REPORT.md

SCOPED LAYERS
  snapshots/SNAPSHOT_ARCHITECTURE.md     ← snapshot design
  snapshots/SNAPSHOT_FORMAT.md           ← snapshot bytes
  snapshots/SNAPSHOT_TRUST_BOUNDARIES.md ← snapshot non-authority
  snapshots/SNAPSHOT_RETENTION.md
  snapshots/SNAPSHOT_FAILURE_MODES.md
  snapshots/SNAPSHOT_SECURITY.md

AUDIT (point-in-time, never authority)
  audit/*                        ← all files dated 2026-05-24 audit cycles
```

**Rule:** Authority flows down only — code conforms to spec; spec docs are the single source. Audit files are observations, never new contracts.

---

## 3. Hidden Source-of-Truth Surfaces (Risk)

| Surface | Claimed authority | Actual authority | Risk |
|---------|-------------------|------------------|------|
| Root `CURRENT_STATUS.md` (2026-05-02) | Agent read-first per `AGENT_RULES.md` L8 | Manual legacy summary — not derived | **HIGH** |
| Root `DEPLOYMENT_STATE.md` | Agent read-first | Manual legacy summary | **HIGH** |
| `ops/state/projections/CURRENT_STATUS.md` | OSCTL projection (declared canonical by freeze) | Generated, but not the CLI default output | MEDIUM |
| `ops/osctl/projections/CURRENT_STATUS.generated.md` | CLI default output | Treated as fixture by some docs | MEDIUM |
| `ops/osctl/ledger/events.jsonl` | CLI default | Declared canonical by `paths.py` | MEDIUM |
| `ops/state/ledger/events.jsonl` | Declared canonical by `ARCHITECTURE_FREEZE.md` F-001 | Identical bytes today; will diverge | **HIGH** |
| `MASTER_CONTEXT.md` | "Master" naming implies authority | Mixed backend + OSCTL summary; not in document hierarchy of `GOVERNANCE.md` | MEDIUM |
| `BUILD_STATUS.md`, `RAILWAY_DEPLOY.md`, `DEPLOY_CHECKLIST.md` (root) | Cited by `CURRENT_STATUS.md` | Pre-OSCTL deploy reports | LOW |

**Action:** Pick **one** ledger path and **one** projection path. Demote the other to fixture-only under `examples/`. This is the single highest-leverage consolidation move.

---

## 4. Canonical Path Decision (Required, Human)

Two valid resolutions. Either is acceptable; mixing is not.

### Option L — Lock to `ops/state/`

| Step | Effect |
|------|--------|
| Update `core/ledger/paths.py` defaults to `ops/state/ledger/` and `ops/state/projections/` | Code matches freeze declaration |
| Move existing fixture under `ops/osctl/examples/freeze_v1_fixture/` | Preserves history |
| Re-run `validation/run_validation.py` | Confirms fingerprint unchanged |
| No freeze bump required (path is implementation default, not invariant text) | Speed |

### Option O — Lock to `ops/osctl/`

| Step | Effect |
|------|--------|
| Amend `ARCHITECTURE_FREEZE.md` F-001/F-002, `LEDGER_MODEL.md`, `GOVERNANCE.md`, `README.md` | Docs match code |
| Delete or archive `ops/state/ledger/`, `ops/state/projections/` | Single physical surface |
| Bump freeze ID to `osctl-freeze/1.5.1` (path declaration changed) | Governance integrity |

**Recommendation:** **Option L** (smaller diff, no freeze bump, preserves freeze text as binding). Do not execute in this audit.

---

## 5. Source-of-Truth Verdict

| Dimension | Verdict |
|-----------|---------|
| Spec docs have unique canonical files | **Yes** (after banners on superseded drafts) |
| Code matches spec defaults | **No** — `paths.py` mismatches freeze |
| One ledger / one projection path | **No** — split-brain |
| One CLI vocabulary (`replay`, `append`, `verify`) | **No** — docs say `project`, drafts say `ingest` |
| Agent read path declared in canonical doc | **Partial** — `AGENT_RULES.md` lacks verify-first contract |
| Snapshot label distinct from numeric phase | **No** — collision on "Phase 3" |

**Net source-of-truth status:** **FRAGMENTED — five canonical-vs-actual conflicts, all repairable without code change except path defaults.**
