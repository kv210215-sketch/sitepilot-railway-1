# OSCTL Governance Reduction Plan

**Date:** 2026-05-24
**Audit cycle:** Round 4 — Canonical Governance Reduction (strict, read-only)
**Authority of this document:** Observation only — non-authoritative.
**Builds on:** `CANONICAL_GOVERNANCE_MAP.md`, Round 3 `GOVERNANCE_DEDUPLICATION_PLAN.md`.

---

## 1. What This Plan Adds Over Round 3

Round 3 specified **content-level** actions (banners, redirects, body replacements). It kept every file in place. That is the right first move but **does not reduce file count, file fan-out, or audit recursion**.

Round 4 specifies **file-level** dispositions. Each governance file is assigned one of:

| Disposition | Meaning |
|-------------|---------|
| **KEEP** | Remain in active governance set; canonical or scoped supplement |
| **MERGE-INTO-X** | Content folded into file X; original retired |
| **FREEZE** | Content frozen — no further edits except dated correction errata |
| **APPEND-ONLY** | Edits allowed only as new dated sections; prior content immutable |
| **ARCHIVE** | Move to `ops/osctl/archive/` sub-tree; out of active surface, never deleted |
| **REDIRECT** | Body replaced with one-paragraph link to canonical file |
| **BANNER** | Status banner added at top (e.g., SUPERSEDED, PRE-IMPLEMENTATION) — Round 3 action retained |

No file in this plan is **deleted**. All actions are reversible by reverting a single commit.

---

## 2. Disposition Table — `ops/osctl/` (Root Spec)

| File | Disposition | Target / Rationale |
|------|-------------|--------------------|
| `README.md` | **KEEP** | Single quickref / navigation entrypoint (≤ 100 lines) |
| `ARCHITECTURE_FREEZE.md` | **KEEP** | C-1 canonical (Section 2 of map) |
| `FREEZE_v1.md` | **FREEZE** | C-2; invariants snapshot — should not be edited further |
| `GOVERNANCE.md` | **KEEP** | C-12 canonical |
| `BOUNDARIES.md` | **KEEP** | C-13 canonical; absorbs forbidden-mix rules from `audit/TRUST_LAYER_BOUNDARIES.md` (Round 3 §2 action #10) |
| `HUMAN_BOUNDARIES.md` | **KEEP** | C-14 canonical |
| `TRUST_MODEL.md` | **KEEP** | C-15 canonical |
| `NON_GOALS.md` | **KEEP** | Negative-scope companion |
| `LEDGER_MODEL.md` | **KEEP** | C-5 canonical; sole carrier of "ledger authoritative" axiom |
| `EVENT_SCHEMA.md` | **KEEP** | C-3 canonical |
| `STATE_MACHINE.md` | **KEEP** | C-4 canonical |
| `SERIALIZATION_RULES.md` | **KEEP** | C-9 canonical |
| `PROJECTION_RULES.md` | **KEEP** | C-6 canonical |
| `REPLAY_GUARANTEES.md` | **KEEP** | C-7 canonical |
| `VERIFY_MODEL.md` | **KEEP** | C-8 canonical |
| `DRIFT_DETECTION.md` | **KEEP** | C-11 canonical |
| `ROLLBACK_POLICY.md` | **KEEP** | C-10 canonical |
| `ARCHITECTURE_DECISIONS.md` | **APPEND-ONLY** | Standard ADR semantics; bump header freeze ID 1.0 → 1.5 once, then frozen sections going forward |
| `SPEC_REFERENCE.md` | **BANNER + ARCHIVE** | Pre-implementation draft; SUPERSEDED banner → move to `archive/drafts/` |
| `ARCHITECTURE_FREEZE_CHECKLIST.md` | **BANNER + ARCHIVE** | Pre-freeze checklist (`freeze/0.0`); SUPERSEDED → `archive/drafts/` |
| `IMPLEMENTATION_NOTES.md` | **BANNER + ARCHIVE** | Pre-implementation; "Status: Pre-implementation" → `archive/drafts/` |
| `CI_INTEGRATION_PLAN.md` | **BANNER** | Pre-implementation; remain in place until P2 work begins; do not archive yet (still referenced by roadmap) |

**Net effect:** Active root spec surface drops from 22 files → **18 KEEP + 1 APPEND-ONLY + 1 BANNER (CI plan)**; 3 files leave the active surface via archive.

---

## 3. Disposition Table — `ops/osctl/snapshots/`

| File | Disposition | Target / Rationale |
|------|-------------|--------------------|
| `SNAPSHOT_ARCHITECTURE.md` | **KEEP** | Scoped supplement; lifecycle section must be banner-labeled "design — not in core v1.0" |
| `SNAPSHOT_FORMAT.md` | **KEEP** | Scoped (bytes) |
| `SNAPSHOT_TRUST_BOUNDARIES.md` | **KEEP** | Scoped (non-authority); must cite C-15 |
| `SNAPSHOT_RETENTION.md` | **KEEP** | Scoped |
| `SNAPSHOT_FAILURE_MODES.md` | **KEEP** | Scoped |
| `SNAPSHOT_SECURITY.md` | **KEEP** | Scoped |
| `STATE_MACHINE_BOUNDARIES.md` | **MERGE-INTO** `SNAPSHOT_ARCHITECTURE.md` | Snapshot-scoped lifecycle; not a parallel state machine |
| `AGENT_AUTHORITY_MAP.md` | **MERGE-INTO** `HUMAN_BOUNDARIES.md` | Trim to snapshot-scope rows; merge unique rows into C-14 (Round 3 cluster C action) |
| `CAPABILITY_MATRIX.md` | **MERGE-INTO** `HUMAN_BOUNDARIES.md` | Same — fold snapshot-scoped capabilities into C-14, retire general restatements |
| `FUTURE_RISKS.md` | **MERGE-INTO** `audit/FUTURE_RISK_REVIEW.md` | Two future-risk registries (Round 3 entropy §E-4) — keep one |
| `PHASE3_FINAL_REVIEW.md` | **RENAME + FREEZE** | Rename header to "Snapshot Layer (P1.5-S) Final Review"; freeze content (no further edits) |

**Net effect:** Snapshots tree drops from 11 files → **6 KEEP scoped + 1 renamed/frozen**; 4 retire via merge.

---

## 4. Disposition Table — `ops/osctl/audit/` (THE PRIORITY)

`audit/` is the single largest contributor to entropy. It now holds 26 files across 3 prior cycles plus the 7 Round-4 deliverables. Round 4 explicitly retires the per-round scaffolding once Round 3 actions are applied by a human.

### 4.1 Round 1 (Hygiene) — 13 files

| File | Disposition |
|------|-------------|
| `FINAL_HYGIENE_VERDICT.md` | **FREEZE** — historical verdict; never edit |
| `REPOSITORY_HYGIENE_PLAN.md` | **ARCHIVE** (→ `audit/archive/round1/`) once hygiene applied |
| `REPO_CLEANUP_REPORT.md` | **ARCHIVE** (→ `audit/archive/round1/`) |
| `CLEAN_STATE_REQUIREMENTS.md` | **ARCHIVE** (→ `audit/archive/round1/`) |
| `WORKSPACE_CLEANLINESS_CHECKLIST.md` | **ARCHIVE** (→ `audit/archive/round1/`) |
| `WORKSPACE_ISOLATION_PLAN.md` | **ARCHIVE** (→ `audit/archive/round1/`) |
| `SAFE_COMMIT_STRATEGY.md` | **ARCHIVE** (→ `audit/archive/round1/`) |
| `SAFE_STAGE_SEQUENCE.md` | **ARCHIVE** (→ `audit/archive/round1/`) |
| `GIT_TRACKING_STATUS.md` | **ARCHIVE** (→ `audit/archive/round1/`) |
| `GIT_ANCHORING_PLAN.md` | **KEEP** until anchoring complete; then **ARCHIVE** |
| `PYCACHE_AND_ARTIFACT_POLICY.md` | **MERGE-INTO** `.gitignore` enforcement + one paragraph in `BOUNDARIES.md`; then **ARCHIVE** |

### 4.2 Round 2 (Architecture) — 7 files

| File | Disposition |
|------|-------------|
| `FINAL_AUDIT_VERDICT.md` | **FREEZE** — historical verdict |
| `ARCHITECTURE_CONSISTENCY_AUDIT.md` | **FREEZE** — observation snapshot |
| `INVARIANT_REGISTRY.md` | **MERGE-INTO** `FREEZE_v1.md` §6 (Round 3 cluster B action) — convert remainder to conflict-only register, then **FREEZE** |
| `TERMINOLOGY_REGISTRY.md` | **MERGE-INTO** `TERMINOLOGY_NORMALIZATION.md` (Round 3); keep only `TERMINOLOGY_NORMALIZATION.md`, then **FREEZE** that one |
| `PHASE_ALIGNMENT_MATRIX.md` | **FREEZE** after `MASTER_CONTEXT.md` and `PHASE3_FINAL_REVIEW.md` are renamed (Round 3 action #8) |
| `TRUST_BOUNDARY_AUDIT.md` | **FREEZE** — observation snapshot |
| `FUTURE_RISK_REVIEW.md` | **KEEP-APPEND-ONLY** — single forward-risk register; absorbs `snapshots/FUTURE_RISKS.md` |

### 4.3 Round 3 (Consolidation) — 7 files

| File | Disposition |
|------|-------------|
| `CONSOLIDATION_FINAL_VERDICT.md` | **FREEZE** — historical verdict |
| `GOVERNANCE_DEDUPLICATION_PLAN.md` | **KEEP** until §2 actions applied; then **ARCHIVE** |
| `SOURCE_OF_TRUTH_MAP.md` | **FREEZE** — superseded by Section 2 of `CANONICAL_GOVERNANCE_MAP.md`, but retained as the analytic snapshot |
| `TERMINOLOGY_NORMALIZATION.md` | **FREEZE** after vocabulary sweep applied |
| `ARCHITECTURAL_ENTROPY_REPORT.md` | **FREEZE** — historical observation; the stop-rule it proposes is now formalized in this round |
| `TRUST_SIMPLIFICATION_PLAN.md` | **KEEP** until §5 actions applied; then **ARCHIVE** |
| `HUMAN_OPERABILITY_REVIEW.md` | **FREEZE** — superseded by `HUMAN_MAINTAINABILITY_REPORT.md` (this round) for forward use; retained as baseline |
| `TRUST_LAYER_BOUNDARIES.md` | **MERGE-INTO** `BOUNDARIES.md` (Round 3 §2 action #10); then **ARCHIVE** |

### 4.4 Round 4 (This Round) — 7 files

| File | Disposition |
|------|-------------|
| `CANONICAL_GOVERNANCE_MAP.md` | **KEEP** as the active map (replaces `SOURCE_OF_TRUTH_MAP.md` for forward use) |
| `GOVERNANCE_REDUCTION_PLAN.md` | **KEEP** until §2–§5 dispositions applied; then **ARCHIVE** |
| `SOURCE_OF_TRUTH_REDUCTION.md` | **KEEP** as the canonical-restatement-removal log; **FREEZE** after sweep |
| `ARCHIVE_RECOMMENDATIONS.md` | **KEEP** as the archive layout spec; **FREEZE** after archive layout established |
| `FREEZE_CANDIDATES.md` | **KEEP** as the freeze status register; **APPEND-ONLY** going forward |
| `HUMAN_MAINTAINABILITY_REPORT.md` | **KEEP** as the operability baseline; re-measure post-reduction |
| `GOVERNANCE_SIMPLIFICATION_VERDICT.md` | **FREEZE** — final verdict for this round |

### 4.5 Audit Tree — Quantitative Effect

| State | File count in `audit/` |
|-------|------------------------|
| Today (before Round 4) | 26 |
| After Round 4 deliverables added | 33 |
| After §4.1–§4.3 archive moves applied (to `audit/archive/round{1,2,3}/`) | **active = 9 (3 frozen verdicts + 3 frozen Round-3 superseded + 3 Round-4 active)** |
| After §4.4 dispositions applied | **active = ~6** (3 frozen verdicts + Round-4 freezes) |

The net active audit surface drops from 26 → ~6. Archived content remains on disk for traceability.

---

## 5. Disposition Table — `ops/osctl/validation/`

| File | Disposition | Target / Rationale |
|------|-------------|--------------------|
| `README.md` | **KEEP** | Validation entrypoint |
| `VALIDATION_REPORT.md` | **KEEP** | Evidence |
| `VALIDATION_SUMMARY.md` | **KEEP** | Evidence |
| `VALIDATION_MATRIX.md` | **KEEP** | Evidence |
| `HASH_REGISTRY.md` | **KEEP** | Evidence |
| `DETERMINISM_REPORT.md` | **KEEP** | Evidence |
| `REPLAY_TESTS.md` | **KEEP** | Evidence |
| `FAILURE_CASES.md` | **KEEP** | Evidence |
| `TRUST_MODEL.md` | **REDIRECT** | Replace body with link to `ops/osctl/TRUST_MODEL.md` (Round 3 action #5) |
| `WHAT REMAINS MANUAL.md` | **BANNER + KEEP** | Pre-Phase-2 gap list; banner as "Manual interim — to be retired by Phase 2 ingest" |

---

## 6. Disposition Table — Adjacent Trees (`ops/state/`, `ops/rituals/`, `ops/simulations/`, root)

| File | Disposition |
|------|-------------|
| `ops/state/GOVERNANCE.md` | **REDIRECT** to `ops/osctl/GOVERNANCE.md` (Round 3 action #4) |
| `ops/state/README.md`, `STATE_TRANSITIONS.md`, `RELEASE_CHECKLIST.md`, `ROLLBACK_CHECKLIST.md` | **KEEP** — operational templates, no OSCTL authority |
| `ops/state/*.template.md` | **KEEP** — templates only |
| `ops/state/ledger/events.jsonl`, `projections/*` | **PATH-DECISION** (Round 3 Option L / O); not a doc disposition |
| `ops/rituals/*.md` | **VOCAB SWEEP** (Round 3 §3) — `.observed`/`.marked` → `.recorded`; otherwise KEEP |
| `ops/simulations/*.md` | **VOCAB SWEEP** + BANNER as training narratives |
| Root `MASTER_CONTEXT.md` | **TRIM** OSCTL section to ≤ 8 lines + link to `ops/osctl/README.md` (Round 3 action #6) |
| Root `CURRENT_STATUS.md` | **BANNER** as NON-AUTHORITATIVE (Round 3 §3.2) |
| Root `DEPLOYMENT_STATE.md` | **BANNER** as NON-AUTHORITATIVE |
| Root `BUILD_STATUS.md`, `RAILWAY_DEPLOY.md`, `DEPLOY_CHECKLIST.md` | **BANNER** as historical deploy reports (if present) |
| Root `AGENT_RULES.md` | **EDIT** — require VERIFY before ACT; demote root MDs (Round 3 §3.1) |

---

## 7. Reduction Order (Human-Executed Sequence)

The dispositions in Sections 2–6 require coordinated execution. Recommended order, three small commits:

| # | Step | Commits touched | Reversible? |
|---|------|------------------|--------------|
| 1 | Apply Round 3 §2 actions 1–9 (banners, redirects, AGENT_RULES, MASTER_CONTEXT trim) | Docs only | Yes |
| 2 | Apply Round 3 §10 path reconciliation (Option L — single change to `core/ledger/paths.py`) | 1 Python file | Yes |
| 3 | Apply Round 4 §4 archive moves: create `ops/osctl/audit/archive/round{1,2,3}/`, move dispositioned files | File moves only | Yes |
| 4 | Apply Round 4 §3 snapshot merges (`AGENT_AUTHORITY_MAP`, `CAPABILITY_MATRIX`, `STATE_MACHINE_BOUNDARIES`, `FUTURE_RISKS`) | Docs only | Yes |
| 5 | Apply Round 4 §2 drafts archive (`SPEC_REFERENCE`, `ARCHITECTURE_FREEZE_CHECKLIST`, `IMPLEMENTATION_NOTES`) → `ops/osctl/archive/drafts/` | File moves only | Yes |
| 6 | Re-run `python ops/osctl/validation/run_validation.py` after each step | None | N/A |

**Each step is independent.** Stop after any step if validation regresses.

---

## 8. What This Plan Does Not Do

| Action | Done here? |
|--------|------------|
| Delete any file | **No** — archive only |
| Edit prior-round audit files | **No** — Round 4 only authors Round-4 files |
| Modify the canonical 15 files in this round | **No** — only their banners/redirects, per Round 3 |
| Bump freeze ID | **No** — no invariant text changes |
| Introduce a new layer | **No** — archive sub-tree is storage, not a trust layer |
| Introduce new authority | **No** — every disposition cites a prior round's recommendation |
| Implement removals | **No** — recommends only; humans execute |

---

## 9. Plan Verdict

| Dimension | Verdict |
|-----------|---------|
| All governance files have a disposition | **Yes** (Sections 2–6) |
| Plan introduces new authority | **No** |
| Plan introduces new layer | **No** (archive is storage) |
| Plan deletes anything | **No** |
| Plan reduces active surface | **Yes** — root spec 22 → 18/19; snapshots 11 → 6; audit 26 → ~6 active |
| Plan reversible | **Yes** — each step is a doc move or file move |
| Plan execution requires deploy/CI/backend/package.json change | **No** |

**Net:** Reduction plan is complete, ordered, reversible, and strictly within read-only audit authority. Execution is **human-owned**.
