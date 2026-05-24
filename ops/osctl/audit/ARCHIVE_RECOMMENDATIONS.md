# OSCTL Archive Recommendations

**Date:** 2026-05-24
**Audit cycle:** Round 4 — Canonical Governance Reduction (strict, read-only)
**Authority of this document:** Observation only — non-authoritative.
**Companion to:** `GOVERNANCE_REDUCTION_PLAN.md`, `FREEZE_CANDIDATES.md`.

---

## 1. What "Archive" Means Here

| Property | Archive |
|----------|---------|
| File **deleted from disk** | **No, never** |
| File **moved to sub-tree** | Yes — `ops/osctl/archive/...` |
| File **edited** after archive | **No** |
| File **referenced** by canonical set | **No** |
| File still **readable** by humans / git history | **Yes** |
| File **discoverable** by `Glob`/`README` | No (excluded from active navigation) |
| File **part of trust chain** | **No** |
| Archive sub-tree itself is a **trust layer** | **No** — pure storage |

Archive removes governance noise without losing audit trail. Every archived file remains under git for traceability and can be restored by a single `git mv` revert.

---

## 2. Recommended Archive Tree Layout

A single sub-tree under `ops/osctl/archive/`. No new authority. Three folders only:

```text
ops/osctl/archive/
├── drafts/                  ← pre-implementation specs (never frozen)
├── hygiene/                 ← Round 1 hygiene workflow (one-shot artefacts)
├── consolidation/           ← Round 3 superseded plans (after application)
└── README.md                ← single ≤30-line index; no rules
```

That is the **entire** sub-tree. No further nesting, no per-file metadata, no manifests.

### 2.1 Naming rule

Archived files retain their original basename. No date suffix added — git history is the dating mechanism.

### 2.2 Single index file

The single `archive/README.md` lists each archived file with one-sentence "what this used to be" + "superseded by [canonical link]". Nothing more.

---

## 3. Archive Candidates — `ops/osctl/` (Drafts)

Move to `ops/osctl/archive/drafts/`. All three already carry pre-implementation status per Round 3 §2.

| File | Why archive | Banner required first? |
|------|--------------|------------------------|
| `SPEC_REFERENCE.md` | Pre-implementation draft spec (`osctl-spec/0.1.0-draft`); superseded by EVENT_SCHEMA + STATE_MACHINE + SERIALIZATION_RULES | **Yes** — SUPERSEDED banner pointing to canonicals |
| `ARCHITECTURE_FREEZE_CHECKLIST.md` | Pre-freeze checklist (`osctl-freeze/0.0`); superseded by `FREEZE_v1.md` §6 | **Yes** — SUPERSEDED banner |
| `IMPLEMENTATION_NOTES.md` | Pre-implementation notes; superseded by `core/` source code | **Yes** — "Pre-implementation — historical only" banner |

**Not archived:** `CI_INTEGRATION_PLAN.md` is also pre-implementation but is **kept active** because it is the working draft for Phase 2; archive it only when Phase 2 begins and a successor plan exists.

---

## 4. Archive Candidates — `ops/osctl/audit/` (Round 1: Hygiene)

Move to `ops/osctl/archive/hygiene/`. These describe a **one-shot workflow** (git anchor / clean state); once executed they are historical record only.

| File | Archive when | Notes |
|------|---------------|-------|
| `REPOSITORY_HYGIENE_PLAN.md` | Hygiene applied | One-shot plan |
| `REPO_CLEANUP_REPORT.md` | Hygiene applied | One-shot report |
| `CLEAN_STATE_REQUIREMENTS.md` | Hygiene applied | Gates list |
| `WORKSPACE_CLEANLINESS_CHECKLIST.md` | Hygiene applied | Checklist |
| `WORKSPACE_ISOLATION_PLAN.md` | Anchoring complete | One-shot |
| `SAFE_COMMIT_STRATEGY.md` | Anchoring complete | Workflow doc |
| `SAFE_STAGE_SEQUENCE.md` | Anchoring complete | Workflow doc |
| `GIT_TRACKING_STATUS.md` | Anchoring complete | Status snapshot |
| `GIT_ANCHORING_PLAN.md` | Anchoring complete | Operational plan |
| `PYCACHE_AND_ARTIFACT_POLICY.md` | `.gitignore` updated + paragraph added to `BOUNDARIES.md` | One-shot policy |

**Not archived:** `FINAL_HYGIENE_VERDICT.md` — see `FREEZE_CANDIDATES.md` §2 (verdict is frozen in place, not archived).

---

## 5. Archive Candidates — `ops/osctl/audit/` (Round 3: Consolidation)

Move to `ops/osctl/archive/consolidation/` **only after the corresponding Round 3 actions are applied**. These are plans; once executed, they are historical.

| File | Archive when | Successor |
|------|---------------|-----------|
| `GOVERNANCE_DEDUPLICATION_PLAN.md` | §2 actions 1–10 applied | `CANONICAL_GOVERNANCE_MAP.md` (forward use) |
| `TRUST_SIMPLIFICATION_PLAN.md` | §5 actions 1–10 applied | `BOUNDARIES.md` + `HUMAN_BOUNDARIES.md` (canonical) |
| `TRUST_LAYER_BOUNDARIES.md` | Merged into `BOUNDARIES.md` (Round 3 action #10) | `BOUNDARIES.md` §Forbidden Mixed Commits |

**Not archived (yet):**
- `SOURCE_OF_TRUTH_MAP.md` — frozen in place; remains as analytic snapshot (see `FREEZE_CANDIDATES.md` §3).
- `TERMINOLOGY_REGISTRY.md` — merged into `TERMINOLOGY_NORMALIZATION.md` per Round 4 `GOVERNANCE_REDUCTION_PLAN.md` §4.2; then archive.
- `TERMINOLOGY_NORMALIZATION.md` — frozen in place after vocab sweep.
- `INVARIANT_REGISTRY.md` — frozen in place after restatement strip.
- `PHASE_ALIGNMENT_MATRIX.md` — frozen in place after snapshot rename.
- `ARCHITECTURAL_ENTROPY_REPORT.md`, `HUMAN_OPERABILITY_REVIEW.md`, `TRUST_BOUNDARY_AUDIT.md`, `ARCHITECTURE_CONSISTENCY_AUDIT.md`, `FUTURE_RISK_REVIEW.md` — frozen as observations.

The "frozen in place vs. archived" distinction matters: frozen verdicts and observations stay in `audit/` for visible audit history; expired one-shot plans go to `archive/`.

---

## 6. Archive Candidates — `ops/osctl/snapshots/`

After the Round-4 §3 snapshot merges are applied, **do not archive** the merge-source files. Instead the merge target absorbs unique content and the source becomes a one-line REDIRECT, kept in place for path stability. Reasons:

- Snapshot tree is small (11 files) and already coherent.
- Snapshot file paths are referenced by `core/` scripts (`verify_snapshot.py`, `compare_snapshot.py`) and examples.
- Archive movement here yields little surface reduction.

| File | Final state |
|------|-------------|
| `AGENT_AUTHORITY_MAP.md` | **REDIRECT** to `HUMAN_BOUNDARIES.md` (do not archive) |
| `CAPABILITY_MATRIX.md` | **REDIRECT** to `HUMAN_BOUNDARIES.md` (do not archive) |
| `STATE_MACHINE_BOUNDARIES.md` | **REDIRECT** to `SNAPSHOT_ARCHITECTURE.md` (do not archive) |
| `FUTURE_RISKS.md` | **REDIRECT** to `audit/FUTURE_RISK_REVIEW.md` (do not archive) |
| `PHASE3_FINAL_REVIEW.md` | **RENAME** to "Snapshot Layer (P1.5-S) Review"; freeze; do not archive |

---

## 7. Archive Candidates — Adjacent Trees

| File | Disposition | Why not archived |
|------|-------------|-----------------|
| `ops/state/GOVERNANCE.md` | **REDIRECT** to `ops/osctl/GOVERNANCE.md` | Path may be referenced by older docs; redirect preserves link |
| `ops/state/*.template.md` | **KEEP** | Active templates |
| `ops/rituals/*.md` | **VOCAB SWEEP** then keep | Active operator playbooks |
| `ops/simulations/*.md` | **BANNER** then keep | Training narratives, still useful |
| Root `BUILD_STATUS.md`, `RAILWAY_DEPLOY.md`, `DEPLOY_CHECKLIST.md`, `verify-deployment.sh` (if present) | **BANNER** as historical deploy reports | Out of OSCTL scope; root cleanup is a separate concern |
| Root `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` | **BANNER** as non-authoritative | Active operator references |

**Strict-mode constraint reminder:** This audit must not touch backend, infra, CI, or root-level deploy docs beyond the editorial banners already proposed by Round 3. Root cleanup is outside Round 4 scope.

---

## 8. What MUST NOT Be Archived

These are bright lines for any future agent:

| Category | Files |
|----------|-------|
| The 15 canonical files | All of Section 2 of `CANONICAL_GOVERNANCE_MAP.md` |
| Validation evidence | All of `validation/*` |
| Snapshot scoped supplements | `SNAPSHOT_ARCHITECTURE.md`, `SNAPSHOT_FORMAT.md`, `SNAPSHOT_TRUST_BOUNDARIES.md`, `SNAPSHOT_RETENTION.md`, `SNAPSHOT_FAILURE_MODES.md`, `SNAPSHOT_SECURITY.md` |
| Active operator templates | `ops/state/*.template.md`, `ops/state/STATE_TRANSITIONS.md`, `RELEASE_CHECKLIST.md`, `ROLLBACK_CHECKLIST.md`, `ops/state/README.md` |
| Frozen verdicts | `FINAL_HYGIENE_VERDICT.md`, `FINAL_AUDIT_VERDICT.md`, `CONSOLIDATION_FINAL_VERDICT.md`, `GOVERNANCE_SIMPLIFICATION_VERDICT.md` |
| Core code | `ops/osctl/core/**` |
| Examples / fixtures | `ops/osctl/examples/**` |
| Ledger / projections | `ops/osctl/ledger/**`, `ops/osctl/projections/**`, `ops/state/ledger/**`, `ops/state/projections/**` |

---

## 9. Archive Execution Constraints (Human)

When a human applies these recommendations:

1. **`git mv` only** — preserve full history; no copy-delete pairs.
2. **One-PR-per-section** — Section 3 (drafts), Section 4 (hygiene), Section 5 (consolidation) each in its own commit.
3. **No content edit during move** — banners must be applied **before** archival in a separate commit.
4. **Update `ops/osctl/archive/README.md`** in the same commit as the move.
5. **Re-run** `python ops/osctl/validation/run_validation.py` after each archive PR to confirm no broken reference. Validation reads do not depend on these files; expected outcome is PASS unchanged.
6. **No cross-tree archive** — never archive a `snapshots/` file into `archive/`; per Section 6 they redirect in place.

---

## 10. Archive Impact

| Tree | Files today (governance-class) | Files after archive | Reduction |
|------|-------------------------------|---------------------|-----------|
| `ops/osctl/` root spec | 22 | 19 (3 → drafts/) | -14% |
| `ops/osctl/audit/` | 26 (will be 33 after Round 4 deliverables) | active = ~9 (24 → archive/hygiene/ + archive/consolidation/) | **-73% active surface** |
| `ops/osctl/snapshots/` | 11 | 11 (4 redirects in place) | 0% file count; -36% rule restatement |
| **Total active governance surface** | **~60 files** | **~33 files** | **~45% reduction** |

Archived files remain on disk (33 governance + 24 archived = same physical total). What changes is the **active cognitive surface**.

---

## 11. Archive Verdict

| Dimension | Verdict |
|-----------|---------|
| Archive layout specified | **Yes** (Section 2 — 3 sub-folders only) |
| Every archive candidate listed | **Yes** (Sections 3–5) |
| Every "must-not-archive" listed | **Yes** (Section 8) |
| Archive introduces new authority | **No** |
| Archive introduces new layer | **No** — it is storage, not trust |
| Archive plan reversible | **Yes** — git `mv` revert |
| Net active surface reduction | **~45%** |

**Recommendation:** Apply Section 3 (drafts archive) first as the lowest-risk move. Apply Section 4 (hygiene archive) only after git anchoring + clean-state hygiene actually executed. Apply Section 5 (consolidation archive) only after Round 3 §2 actions executed.
