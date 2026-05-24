# OSCTL Canonical Governance Map

**Date:** 2026-05-24
**Audit cycle:** Round 4 — Canonical Governance Reduction (strict, read-only)
**Authority of this document:** Observation only — non-authoritative. This file does not amend the freeze, define new policy, or grant any capability.
**Supersedes:** Nothing. Builds on Round 3 (`CONSOLIDATION_FINAL_VERDICT.md`, `SOURCE_OF_TRUTH_MAP.md`).

---

## 1. Purpose

Round 3 catalogued duplication. Round 4 names the **minimum canonical set**: the smallest collection of files whose continued existence is required to operate, govern, and reason about OSCTL. Every other file is either supporting, evidence, scoped-supplement, history, or retirement candidate.

This map is the **positive companion** to `GOVERNANCE_REDUCTION_PLAN.md`, `ARCHIVE_RECOMMENDATIONS.md`, and `FREEZE_CANDIDATES.md`.

---

## 2. Canonical Set (15 files, single tier)

These 15 files are the sole authority for OSCTL governance. Every other governance file in the repository must reference, not restate, content covered here.

| # | Concept | Canonical file | Tier |
|---|---------|----------------|------|
| C-1 | Freeze declaration | `ops/osctl/ARCHITECTURE_FREEZE.md` | Spec |
| C-2 | Snapshot of frozen invariants | `ops/osctl/FREEZE_v1.md` | Spec |
| C-3 | Event types (closed enum) | `ops/osctl/EVENT_SCHEMA.md` (+ `core/schema/events.py`) | Spec |
| C-4 | Lifecycle / state machine | `ops/osctl/STATE_MACHINE.md` (+ `core/schema/transitions.py`) | Spec |
| C-5 | Ledger contract + canonical path | `ops/osctl/LEDGER_MODEL.md` (+ `core/ledger/paths.py`) | Spec |
| C-6 | Projection contract + canonical path | `ops/osctl/PROJECTION_RULES.md` (+ `core/ledger/paths.py`) | Spec |
| C-7 | Replay determinism contract | `ops/osctl/REPLAY_GUARANTEES.md` | Spec |
| C-8 | Verification layers | `ops/osctl/VERIFY_MODEL.md` | Spec |
| C-9 | Canonical serialization bytes | `ops/osctl/SERIALIZATION_RULES.md` | Spec |
| C-10 | Rollback semantics | `ops/osctl/ROLLBACK_POLICY.md` | Spec |
| C-11 | Drift taxonomy | `ops/osctl/DRIFT_DETECTION.md` | Spec |
| C-12 | Governance roles + doc hierarchy | `ops/osctl/GOVERNANCE.md` | Governance |
| C-13 | Platform ownership | `ops/osctl/BOUNDARIES.md` | Governance |
| C-14 | Human / automation zones | `ops/osctl/HUMAN_BOUNDARIES.md` | Governance |
| C-15 | Trust guarantees + non-claims | `ops/osctl/TRUST_MODEL.md` | Governance |

**Negative-scope companion:** `ops/osctl/NON_GOALS.md` (referenced by C-12, C-13, C-14; not promoted above to keep the canonical set tight).

**README:** `ops/osctl/README.md` is the **navigation entrypoint** to the canonical set; it asserts no rules and contains no original authority.

---

## 3. Scoped Supplements (Allowed — Not Promoted to Canonical)

Files that are correct, in-scope, and useful, but **must not duplicate** content from the canonical set. Each is scoped to a sub-layer and references the canonical set for any general statement.

| File | Scope | Constraint |
|------|-------|-----------|
| `snapshots/SNAPSHOT_ARCHITECTURE.md` | Snapshot layer design | No general OSCTL claims |
| `snapshots/SNAPSHOT_FORMAT.md` | Snapshot bytes | Format-only |
| `snapshots/SNAPSHOT_TRUST_BOUNDARIES.md` | Snapshot non-authority | Must cite C-15 |
| `snapshots/SNAPSHOT_RETENTION.md` | Retention policy | Scope-only |
| `snapshots/SNAPSHOT_FAILURE_MODES.md` | Failure modes | Scope-only |
| `snapshots/SNAPSHOT_SECURITY.md` | Snapshot security | Scope-only |
| `ARCHITECTURE_DECISIONS.md` | ADR log | Append-only (see `FREEZE_CANDIDATES.md` §3) |

---

## 4. Evidence Files (Proof — Never Authority)

Validation outputs are reproducible proof; they do not declare rules.

| File | Purpose |
|------|---------|
| `validation/VALIDATION_REPORT.md` | Validation run output |
| `validation/VALIDATION_SUMMARY.md` | Summary of evidence |
| `validation/HASH_REGISTRY.md` | Recorded fingerprints |
| `validation/DETERMINISM_REPORT.md` | Determinism evidence |
| `validation/REPLAY_TESTS.md` | Replay test catalogue |
| `validation/FAILURE_CASES.md` | Negative test cases |
| `validation/VALIDATION_MATRIX.md` | Coverage matrix |
| `validation/run_validation.py` | Executable proof |
| `validation/scenarios/*` | Scenario fixtures |

**Rule:** Evidence files may be regenerated; they are never edited to assert new policy.

---

## 5. History (Read-Only, Non-Authoritative)

Files retained for traceability of how OSCTL got to its current shape. They contain superseded vocabulary, prior plans, or freeze-zero drafts.

| File | History role |
|------|--------------|
| `SPEC_REFERENCE.md` | Draft spec — superseded by EVENT_SCHEMA + STATE_MACHINE |
| `ARCHITECTURE_FREEZE_CHECKLIST.md` | Pre-freeze checklist — superseded by FREEZE_v1 §6 |
| `IMPLEMENTATION_NOTES.md` | Pre-implementation notes — superseded by core code |
| `CI_INTEGRATION_PLAN.md` | Phase 2+ roadmap — pre-implementation, not binding |
| `snapshots/PHASE3_FINAL_REVIEW.md` | Snapshot-layer review (renamed "P1.5-S" target) |
| `validation/WHAT REMAINS MANUAL.md` | Pre-Phase-2 manual gap list |

See `FREEZE_CANDIDATES.md` for which of these become append-only vs. fully frozen.

---

## 6. Audit (Observations — Never Authority)

All files in `ops/osctl/audit/` are dated observations. They never assert new policy and never override the canonical set. After this round, `audit/` is the largest single contributor to entropy (26 files; entropy ceiling was 20).

See `GOVERNANCE_REDUCTION_PLAN.md` §4 and `ARCHIVE_RECOMMENDATIONS.md` for which audit files should be moved to a quarantined sub-tree to halt visual recursion.

---

## 7. Out of Canonical Set (Adjacent Operations)

| Tree | Role | Authority over OSCTL? |
|------|------|------------------------|
| `ops/state/` | Templates + state projections | No (templates only) |
| `ops/rituals/` | Operational playbooks | No (operator guidance) |
| `ops/simulations/` | Failure-scenario narratives | No (training) |
| Root `MASTER_CONTEXT.md` | Backend + OSCTL summary | No (must be trimmed; see Round 3 §6.5) |
| Root `CURRENT_STATUS.md` | Legacy deploy summary | No (must be banner-marked) |
| Root `DEPLOYMENT_STATE.md` | Legacy deploy summary | No (must be banner-marked) |
| Root `AGENT_RULES.md` | Agent operating rules | Yes (for agents) — must require VERIFY before ACT |

---

## 8. Canonical-Set Invariants

The canonical set itself is governed by these invariants. They are observations of current structure, not new rules.

| ID | Invariant |
|----|-----------|
| K-1 | The canonical set contains exactly **15 files** (Section 2). |
| K-2 | A new canonical file may be added **only by retiring an existing one** (no net growth). |
| K-3 | Scoped supplements (Section 3) must cite the relevant canonical file for any general claim. |
| K-4 | Evidence files (Section 4) are reproducible by `run_validation.py`; they are not edited by hand to change meaning. |
| K-5 | History files (Section 5) are append-only or frozen — never re-promoted to canonical status without freeze bump. |
| K-6 | Audit files (Section 6) are dated, scoped, and never authoritative. |
| K-7 | Any document outside `ops/osctl/` (root MDs, `ops/state/`, `ops/rituals/`, `ops/simulations/`) is **not** in the OSCTL canonical set. |

---

## 9. Reduction Targets (Implied by This Map)

Comparing the current corpus (~60 governance docs across `ops/osctl/` + adjacent) to this canonical set:

| Metric | Current | Canonical target |
|--------|---------|------------------|
| Files in canonical set | ambiguous | **15** |
| Files asserting "trust kernel definition" | 3+ (TRUST_MODEL.md ×2, MASTER_CONTEXT §) | **1** (C-15) |
| Files asserting "ledger authoritative" | 14+ | **1** (C-5) |
| Authority matrices in canonical set | 5 overlapping | **3** (C-13, C-14, C-15) |
| Verdict / "FINAL_*" files | 3 (Round 1/2/3) | **3 (frozen, append-only — see `FREEZE_CANDIDATES.md`)** |
| Future verdict files | unbounded | **0** (see §10 stop-rule) |

---

## 10. Stop-Rule (Audit Termination)

Round 3's stop-rule said: no new `*_FINAL_VERDICT.md` unless explicitly superseding a prior one. This round strengthens it:

1. **No Round 5.** This Round 4 audit is the last cycle authorized without explicit human charter referencing this map.
2. **`audit/` is closed** for new content after the seven Round-4 deliverables. Future observations must (a) replace an existing audit file or (b) be human-authored against the canonical set.
3. **The canonical set is the only place rules live.** Any future change must edit one of the 15 files in Section 2 (with freeze bump where required) — not add an audit doc.
4. **Reduction over expansion.** Net governance file count after applying `ARCHIVE_RECOMMENDATIONS.md` should be **lower** than today, not higher.

---

## 11. Verdict Inputs

This map provides the **canonical target structure**. Three companion docs operationalize the move toward it:

- `GOVERNANCE_REDUCTION_PLAN.md` — file-level disposition (keep / merge / freeze / archive)
- `FREEZE_CANDIDATES.md` — files that should stop evolving
- `ARCHIVE_RECOMMENDATIONS.md` — files that should leave the active governance surface

The Round-4 verdict in `GOVERNANCE_SIMPLIFICATION_VERDICT.md` is computed from those three.
