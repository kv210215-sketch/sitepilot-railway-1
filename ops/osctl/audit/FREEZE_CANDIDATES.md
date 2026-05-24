# OSCTL Freeze Candidates

**Date:** 2026-05-24
**Audit cycle:** Round 4 — Canonical Governance Reduction (strict, read-only)
**Authority of this document:** Observation only — non-authoritative.
**Companion to:** `GOVERNANCE_REDUCTION_PLAN.md`, `ARCHIVE_RECOMMENDATIONS.md`.

---

## 1. Freeze Modes

Two distinct meanings of "freeze" apply here. Round 4 uses both and distinguishes them strictly.

| Mode | Definition | Allowed changes |
|------|------------|------------------|
| **FULLY FROZEN** | File content is final | **None** — only errata to fix factual errors, dated in a single "Corrections" footnote section |
| **APPEND-ONLY** | File grows by dated additions | New dated sections at the bottom; prior sections immutable |
| **EDIT-RESTRICTED** | File is the canonical spec and may be edited only with explicit freeze-bump | Substantive edit requires bump to `osctl-freeze/1.5.1` (or higher) |

This document is the **register of which file is in which mode**. It does not change the freeze; it documents which files have already taken on freeze-like behavior and which should adopt it.

---

## 2. Frozen Verdicts (FULLY FROZEN)

Round-by-round verdict files. Each is a dated snapshot of audit conclusion. No verdict may be edited after publication; supersession is by creating the next round's verdict (with explicit reference to the prior).

| File | Round | Mode | Reason |
|------|-------|------|--------|
| `audit/FINAL_HYGIENE_VERDICT.md` | Round 1 | **FULLY FROZEN** | Dated verdict; superseded by FINAL_AUDIT_VERDICT only in scope, not in content |
| `audit/FINAL_AUDIT_VERDICT.md` | Round 2 | **FULLY FROZEN** | Dated verdict |
| `audit/CONSOLIDATION_FINAL_VERDICT.md` | Round 3 | **FULLY FROZEN** | Dated verdict |
| `audit/GOVERNANCE_SIMPLIFICATION_VERDICT.md` (this round) | Round 4 | **FULLY FROZEN** | Dated verdict |

**Stop-rule reminder (from Round 3 §8 + this round §8):** No further `*_FINAL_VERDICT.md` files may be created without explicit human charter and explicit supersession statement of one of the four above.

---

## 3. Frozen Audit Observations (FULLY FROZEN)

Audit observations are point-in-time snapshots. After this round they become immutable historical record. Edits to fix typos are allowed; substantive content changes require creating a new dated observation (subject to the stop-rule).

| File | Mode | Rationale |
|------|------|-----------|
| `audit/ARCHITECTURE_CONSISTENCY_AUDIT.md` | **FULLY FROZEN** | Round 2 observation |
| `audit/TRUST_BOUNDARY_AUDIT.md` | **FULLY FROZEN** | Round 2 observation |
| `audit/SOURCE_OF_TRUTH_MAP.md` | **FULLY FROZEN** | Round 3 analytic snapshot; forward use is `CANONICAL_GOVERNANCE_MAP.md` |
| `audit/ARCHITECTURAL_ENTROPY_REPORT.md` | **FULLY FROZEN** | Round 3 entropy observation; stop-rule formalized in this round |
| `audit/HUMAN_OPERABILITY_REVIEW.md` | **FULLY FROZEN** | Round 3 baseline; forward measurement is `HUMAN_MAINTAINABILITY_REPORT.md` |
| `audit/INVARIANT_REGISTRY.md` | **FULLY FROZEN** (after restatement strip per Round 4 §4.2) | Conflict register only; invariant list lives in FREEZE_v1 §6 |
| `audit/TERMINOLOGY_NORMALIZATION.md` | **FULLY FROZEN** (after vocab sweep applied) | Sweep is one-shot |
| `audit/PHASE_ALIGNMENT_MATRIX.md` | **FULLY FROZEN** (after snapshot rename applied) | Rename is one-shot |

**Round-4 self-frozen:** `CANONICAL_GOVERNANCE_MAP.md`, `SOURCE_OF_TRUTH_REDUCTION.md`, `ARCHIVE_RECOMMENDATIONS.md`, `FREEZE_CANDIDATES.md` (this file), `HUMAN_MAINTAINABILITY_REPORT.md`, `GOVERNANCE_SIMPLIFICATION_VERDICT.md` are frozen at publication. `GOVERNANCE_REDUCTION_PLAN.md` remains active until its dispositions are applied, then frozen.

---

## 4. Append-Only Files (APPEND-ONLY)

Files that legitimately grow over time. The grow rule is **new dated section at the bottom; prior sections untouched**.

| File | Mode | What "append" means here |
|------|------|---------------------------|
| `ops/osctl/ARCHITECTURE_DECISIONS.md` | **APPEND-ONLY** | New ADR entries appended; existing ADRs immutable (standard ADR semantics) |
| `audit/FUTURE_RISK_REVIEW.md` | **APPEND-ONLY** | New dated risk entries; never overwrite prior risks (after absorbing `snapshots/FUTURE_RISKS.md`) |
| `validation/HASH_REGISTRY.md` | **APPEND-ONLY** | New fingerprints appended; prior fingerprints immutable (already a registry) |
| `ops/state/ledger/events.jsonl` (or `ops/osctl/ledger/events.jsonl`, per path decision) | **APPEND-ONLY** | Hard invariant — enforced in code (`O_APPEND`); already binding |

**Validation evidence files** (`VALIDATION_REPORT.md`, `VALIDATION_SUMMARY.md`, etc.) are **regenerated**, not appended; they are not in this list.

---

## 5. Edit-Restricted Spec Files (EDIT-RESTRICTED)

The 15 canonical files plus the snapshot scoped supplements. These may be edited but only via the freeze-bump path documented in `INVARIANT_REGISTRY.md` §Amendment Rules.

| Category | Files | Edit gate |
|----------|-------|-----------|
| Canonical spec (C-1..C-11) | `ARCHITECTURE_FREEZE.md`, `FREEZE_v1.md`, `EVENT_SCHEMA.md`, `STATE_MACHINE.md`, `LEDGER_MODEL.md`, `PROJECTION_RULES.md`, `REPLAY_GUARANTEES.md`, `VERIFY_MODEL.md`, `SERIALIZATION_RULES.md`, `ROLLBACK_POLICY.md`, `DRIFT_DETECTION.md` | Substantive edit → freeze bump (`osctl-freeze/1.5.1+`) + spec bump if invariant text changes |
| Canonical governance (C-12..C-15) | `GOVERNANCE.md`, `BOUNDARIES.md`, `HUMAN_BOUNDARIES.md`, `TRUST_MODEL.md` | Substantive edit → freeze bump |
| Negative scope | `NON_GOALS.md` | Substantive edit → freeze bump |
| Snapshot scoped supplements | `SNAPSHOT_*.md` (6 files in §3 of canonical map) | Snapshot-scope edits allowed; cross-scope edits require freeze bump |

**Editorial edits** (typos, cross-link fixes, banner additions, vocabulary swept per `TERMINOLOGY_NORMALIZATION.md`) **do not** require freeze bump. The bump gate is for **invariant text**, **path declarations**, **role definitions**, and **forbidden capabilities**.

---

## 6. Files NOT Frozen (Active / Working Documents)

Identified explicitly to prevent over-freezing — these files must remain editable.

| File | Why not frozen |
|------|----------------|
| `ops/osctl/README.md` | Navigation entrypoint; needs to evolve with the canonical set; **must stay ≤ 100 lines** |
| `ops/osctl/CI_INTEGRATION_PLAN.md` | Pre-implementation working draft for Phase 2; frozen only when Phase 2 ships |
| `validation/*.md` (except HASH_REGISTRY) | Regenerated on each validation run |
| `ops/state/*.template.md` | Active templates |
| `ops/state/projections/CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` | Derived from replay; regenerated each replay |
| `ops/osctl/projections/*.generated.md` | Same — regenerated |
| `ops/rituals/*.md` | Operator playbooks; revised after each post-mortem |
| Root `MASTER_CONTEXT.md` (trimmed OSCTL section) | Backend section evolves with product; OSCTL section trimmed-and-locked is a separate freeze |
| Root `AGENT_RULES.md` | Agent contract; revised when agent capabilities change |

---

## 7. Freeze State Register (Post-Reduction Snapshot)

Total file count across active OSCTL governance trees, classified.

| State | Count | Files |
|-------|-------|-------|
| EDIT-RESTRICTED (canonical spec + governance) | 16 | 15 canonical + NON_GOALS |
| EDIT-RESTRICTED (snapshot scoped supplements) | 6 | SNAPSHOT_* |
| APPEND-ONLY | 4 | ARCHITECTURE_DECISIONS, FUTURE_RISK_REVIEW, HASH_REGISTRY, events.jsonl |
| FULLY FROZEN (verdicts) | 4 | Round 1, 2, 3, 4 verdicts |
| FULLY FROZEN (observations) | ~8 | Round 2 + Round 3 + Round 4 observation files |
| ACTIVE (working) | ~14 | README, CI_INTEGRATION_PLAN, validation/*, templates, rituals, projections, root context (trimmed) |
| ARCHIVED (storage; not active) | ~13 | per `ARCHIVE_RECOMMENDATIONS.md` Sections 3–5 |

**Sum:** ~65 governance files (active + archived). Active surface: ~52. Of active, **~22 are EDIT-RESTRICTED** (the substantive spec + governance), **~14 are working documents** that legitimately change, and the remainder are frozen audit artifacts kept for traceability.

---

## 8. Stop-Rule Formalization

Round 3 §8 introduced an audit stop-rule. Round 4 formalizes the file-creation stop-rule using freeze categories.

### 8.1 New `*_FINAL_VERDICT.md` files

- **Allowed only when** the new file explicitly supersedes a named prior verdict by ID.
- The superseded verdict is moved to `archive/consolidation/` in the same commit.
- The total count of `*_FINAL_VERDICT.md` files in `audit/` never exceeds **4** (Round 1, 2, 3, 4).

### 8.2 New `*_REGISTRY.md` files

- **Allowed only when** the new file replaces an existing registry (same concept).
- The replaced registry is moved to `archive/consolidation/` in the same commit.

### 8.3 New `*_PLAN.md` files in `audit/`

- **Allowed only when** the new plan replaces an existing plan in scope.
- Maximum two active plans at any time (one operational + one consolidation).

### 8.4 New audit folders

- **Forbidden** without freeze bump.
- Single permitted sub-folder: `archive/` (already specified — not a trust layer).

### 8.5 New layers in `ops/osctl/`

- **Forbidden** without freeze bump.
- "Coordination layer" stays unbuilt (per `TERMINOLOGY_NORMALIZATION.md` T-10).

### 8.6 Freezing this stop-rule

This Section 8 is itself **FULLY FROZEN** at the time of `GOVERNANCE_SIMPLIFICATION_VERDICT.md` publication. Amendment requires Round 5 charter that explicitly supersedes Round 4.

---

## 9. Freeze Application Sequence (Human)

Apply in this order; each is reversible by reverting one commit.

| # | Action | Commit type | Reversible? |
|---|--------|-------------|-------------|
| 1 | Add "FULLY FROZEN" header to Section 2 verdict files | Doc-only | Yes |
| 2 | Add "FULLY FROZEN" header to Section 3 observation files after their cleanup actions | Doc-only | Yes |
| 3 | Add "APPEND-ONLY" header to Section 4 files | Doc-only | Yes |
| 4 | Confirm "Amendment Rules" section in `INVARIANT_REGISTRY.md` covers Section 5 files | Doc-only | Yes |
| 5 | Confirm Section 6 files remain header-free (still active) | Verification only | N/A |
| 6 | Re-run `python ops/osctl/validation/run_validation.py` after each step | None | N/A |

**No code change. No freeze bump. No new authority.** Headers are purely informational and document existing behavior; they do not amend the freeze itself.

---

## 10. Freeze Verdict

| Dimension | Verdict |
|-----------|---------|
| Every governance file has a freeze classification | **Yes** (Sections 2–6) |
| Stop-rule formalized | **Yes** (Section 8) |
| Stop-rule introduces new authority | **No** — it documents existing constraints from Round 3 |
| Stop-rule enforceable by humans only | **Yes** — no automation introduced |
| Active editable surface known and bounded | **Yes** (~14 working files) |
| Frozen surface known and bounded | **Yes** (~12 verdict + observation files) |

**Net:** Freeze classifications are complete, documented, and reversible. Applying the freeze headers is purely editorial and does not alter trust kernel behavior.
