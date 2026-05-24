# OSCTL Governance Deduplication Plan

**Date:** 2026-05-24
**Mode:** Read-only consolidation audit (strict)
**Scope:** `ops/osctl/`, `ops/osctl/validation/`, `ops/osctl/snapshots/`, `ops/osctl/audit/`, `MASTER_CONTEXT.md`, `CURRENT_STATUS.md`, `AGENT_RULES.md`
**Principle:** SIMPLIFY before EXPAND — no new authority, no new phases, no new layers.

---

## 1. Duplicated Governance Concepts Detected

The same governance concept is asserted in 2–7 files. Each row is a duplication cluster. Authority assignment is the canonical doc; the others must be SUPERSEDED, REFERENCED, or DELETED.

### Cluster A — Trust Model

| File | Status | Action |
|------|--------|--------|
| `ops/osctl/TRUST_MODEL.md` | Frozen header, 1.5 | **CANONICAL** |
| `ops/osctl/validation/TRUST_MODEL.md` | Phase 1 header, uses `project` CLI | **SUPERSEDED** — collapse to validation evidence index, link to canonical |
| `ops/osctl/audit/TRUST_BOUNDARY_AUDIT.md` | Audit (point-in-time) | **KEEP** as time-stamped audit, do not promote to spec |
| `ops/osctl/audit/TRUST_LAYER_BOUNDARIES.md` | Anchoring policy | **MERGE** topic into `BOUNDARIES.md` §Forbidden Mixed Commits |
| `ops/osctl/snapshots/SNAPSHOT_TRUST_BOUNDARIES.md` | Snapshot-scoped | **KEEP** scoped, but cross-link only the canonical `TRUST_MODEL.md` |

### Cluster B — Governance / Role Model

| File | Status | Action |
|------|--------|--------|
| `ops/osctl/GOVERNANCE.md` | Freeze 1.5, full role + hierarchy | **CANONICAL** |
| `ops/state/GOVERNANCE.md` | Pre-freeze, draft event names | **SUPERSEDED** — replace body with one-line redirect |
| `MASTER_CONTEXT.md` §"OSCTL Snapshot Layer Status" | Mixes backend + OSCTL | **TRIM** to ≤8-line summary + link |
| `ops/osctl/audit/INVARIANT_REGISTRY.md` | Re-states invariants from FREEZE_v1 §6 | **CONVERT** to pure conflict register; remove I-001..I-012 restatement |

### Cluster C — Boundaries / Authority

| File | Status | Action |
|------|--------|--------|
| `ops/osctl/BOUNDARIES.md` | Frozen — owners table | **CANONICAL** for platform ownership |
| `ops/osctl/HUMAN_BOUNDARIES.md` | Frozen — three zones | **CANONICAL** for human/automation split |
| `ops/osctl/NON_GOALS.md` | Frozen — forbidden capabilities | **CANONICAL** for non-goals |
| `ops/osctl/snapshots/AGENT_AUTHORITY_MAP.md` | Snapshot-era role diagram | **KEEP** — but mark scope = snapshot read flow |
| `ops/osctl/snapshots/CAPABILITY_MATRIX.md` | Read/write/forbidden lists | **MERGE** unique rows into HUMAN_BOUNDARIES; otherwise duplicates Cluster C |
| `ops/osctl/audit/TRUST_LAYER_BOUNDARIES.md` | Forbidden-mix list | **MERGE** into BOUNDARIES §Cross-Boundary Rules |

### Cluster D — Replay Guarantees / Determinism

| File | Status | Action |
|------|--------|--------|
| `ops/osctl/REPLAY_GUARANTEES.md` | Determinism contract | **CANONICAL** |
| `ops/osctl/FREEZE_v1.md` §1 "Frozen Guarantees" | Restates determinism, append-only, replay, projections, drift | **TRIM** — keep only invariants table; delegate prose to source docs |
| `ops/osctl/SERIALIZATION_RULES.md` | Byte-level rules | **CANONICAL** |
| `ops/osctl/validation/DETERMINISM_REPORT.md` | Evidence | **KEEP** as evidence (do not redefine contract) |
| `MASTER_CONTEXT.md` §"Validated assumptions" | Re-asserts determinism / replay | **TRIM** |

### Cluster E — Ledger Authority Statements

| Statement | Found in (count) |
|-----------|------------------|
| "Ledger is authoritative" / "source of truth" | `LEDGER_MODEL.md`, `TRUST_MODEL.md` (osctl), `validation/TRUST_MODEL.md`, `GOVERNANCE.md` (osctl), `ops/state/GOVERNANCE.md`, `BOUNDARIES.md`, `HUMAN_BOUNDARIES.md`, `FREEZE_v1.md` §1, `snapshots/SNAPSHOT_TRUST_BOUNDARIES.md`, `snapshots/SNAPSHOT_ARCHITECTURE.md`, `snapshots/AGENT_AUTHORITY_MAP.md`, `snapshots/CAPABILITY_MATRIX.md`, `MASTER_CONTEXT.md`, audit files (×7) |
| **Recommendation** | Single sentence in `LEDGER_MODEL.md`; every other doc cites by reference (not restatement). |

### Cluster F — Freeze Declarations

| File | Status | Action |
|------|--------|--------|
| `ops/osctl/ARCHITECTURE_FREEZE.md` | Declaration | **CANONICAL declaration** |
| `ops/osctl/FREEZE_v1.md` | Snapshot of frozen state | **CANONICAL snapshot** — keep, but stop restating spec/CLI/role content |
| `ops/osctl/ARCHITECTURE_FREEZE_CHECKLIST.md` | Pre-freeze checklist (`osctl-freeze/0.0`) | **SUPERSEDED** — header banner |
| `ops/osctl/SPEC_REFERENCE.md` | Draft spec (`osctl-spec/0.1.0-draft`) | **SUPERSEDED** — header banner, content kept for history only |
| `ops/osctl/IMPLEMENTATION_NOTES.md` | Pre-implementation notes | **SUPERSEDED-PARTIAL** — banner + retain only forward-reference text |
| `ops/osctl/CI_INTEGRATION_PLAN.md` | Phase plan, freeze 1.0 | **AMEND** — bump to 1.5 vocabulary; mark draft hooks "non-binding" |

### Cluster G — Final Verdicts

| File | Audit cycle | Action |
|------|-------------|--------|
| `audit/FINAL_HYGIENE_VERDICT.md` | Round 1 (hygiene) | **KEEP** — scoped to hygiene |
| `audit/FINAL_AUDIT_VERDICT.md` | Round 2 (architecture) | **KEEP** — scoped to architecture consistency |
| `audit/CONSOLIDATION_FINAL_VERDICT.md` | Round 3 (this audit) | **NEW (this run)** — must reference, not duplicate, prior verdicts |
| **Rule** | Future audit cycles must add `_VERDICT.md` only with explicit scope tag; no fourth umbrella verdict. |

### Cluster H — Phase Models

| Source | Phase definition | Status |
|--------|------------------|--------|
| `GOVERNANCE.md`, `README.md`, `FREEZE_v1.md`, `ARCHITECTURE_FREEZE.md`, `CI_INTEGRATION_PLAN.md` | Roadmap 1 / 1.5 / 2 / 3 / 4 | **CANONICAL** |
| `snapshots/PHASE3_FINAL_REVIEW.md`, `MASTER_CONTEXT.md` | Snapshot work labeled "Phase 3" | **CONFLICT** — rename to "Snapshot Layer (SL)" |
| `audit/PHASE_ALIGNMENT_MATRIX.md` | Resolution proposal | **KEEP** as analysis |
| **Action** | Edit only the snapshot-labeled docs; reserve numeric phases for the roadmap. |

---

## 2. Deduplication Action Table (Human-Executed)

Order matters; each step is reversible until commit.

| # | Action | Target | Rationale |
|---|--------|--------|-----------|
| 1 | Add `**SUPERSEDED — see EVENT_SCHEMA.md**` banner | `SPEC_REFERENCE.md` | Cluster F |
| 2 | Add `**SUPERSEDED — see FREEZE_v1.md**` banner | `ARCHITECTURE_FREEZE_CHECKLIST.md` | Cluster F |
| 3 | Add `**Pre-implementation — non-binding**` banner | `IMPLEMENTATION_NOTES.md` | Cluster F |
| 4 | Replace body of `ops/state/GOVERNANCE.md` with redirect to `ops/osctl/GOVERNANCE.md` | Cluster B |
| 5 | Replace `ops/osctl/validation/TRUST_MODEL.md` with index of validation evidence + link | Cluster A |
| 6 | Trim `MASTER_CONTEXT.md` §"OSCTL Snapshot Layer Status" to ≤ 8 lines + link to FREEZE_v1 | Cluster B/D |
| 7 | Convert `audit/INVARIANT_REGISTRY.md` to conflict-only register | Cluster B |
| 8 | Rewrite `snapshots/PHASE3_FINAL_REVIEW.md` heading: "Snapshot Layer Final Review (P1.5-S)" | Cluster H |
| 9 | Single ledger-authority sentence in `LEDGER_MODEL.md`; replace standalone restatements with link | Cluster E |
| 10 | Remove standalone `audit/TRUST_LAYER_BOUNDARIES.md`; merge unique mix-rules into `BOUNDARIES.md` | Cluster A/C |

**No file is deleted by this audit.** All actions are content edits or banners. Removal of files is a separate human commit.

---

## 3. What Is NOT Duplication (Keep As-Is)

- `EVENT_SCHEMA.md`, `STATE_MACHINE.md`, `LEDGER_MODEL.md`, `PROJECTION_RULES.md`, `VERIFY_MODEL.md`, `SERIALIZATION_RULES.md`, `ROLLBACK_POLICY.md`, `DRIFT_DETECTION.md` — single-topic spec docs; no duplication detected.
- `validation/VALIDATION_*` — evidence artifacts; one per concern.
- `snapshots/SNAPSHOT_FORMAT.md`, `SNAPSHOT_RETENTION.md`, `SNAPSHOT_FAILURE_MODES.md`, `SNAPSHOT_SECURITY.md` — distinct snapshot-scoped concerns.

---

## 4. Deduplication Verdict

| Dimension | Verdict |
|-----------|---------|
| Number of duplication clusters | **8 (A–H)** |
| Canonical files identifiable | **Yes** — one per cluster |
| Removal required for safety | **No** — banners + redirects sufficient |
| Risk if untreated | **MEDIUM** — operator confusion, drift on next edit |

**Recommendation:** Apply Action Table §2 in a single human-led "governance dedup" commit on a documentation-only branch. Do **not** combine with code, ledger, or path reconciliation work.
