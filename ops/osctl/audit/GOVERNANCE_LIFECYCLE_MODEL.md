# OSCTL Governance Lifecycle Model

**Date:** 2026-05-24
**Audit cycle:** Round 5 — Governance Operationalization (strict, read-only, explicitly chartered per Round 4 §10 stop-rule exception)
**Authority of this document:** **Observation only — non-authoritative.** This file does not amend the freeze, define new policy, or grant any capability. It operationalizes the lifecycle classifications already documented in `FREEZE_CANDIDATES.md`, `ARCHIVE_RECOMMENDATIONS.md`, and `CANONICAL_GOVERNANCE_MAP.md`.
**Supersedes:** Nothing. **References** Round 4 (`CANONICAL_GOVERNANCE_MAP.md`, `FREEZE_CANDIDATES.md`, `ARCHIVE_RECOMMENDATIONS.md`, `GOVERNANCE_REDUCTION_PLAN.md`, `HUMAN_MAINTAINABILITY_REPORT.md`).
**Companion files (this round):** `FREEZE_POLICY_OPERATIONALIZATION.md`, `SOURCE_OF_TRUTH_OPERATIONAL_GUIDE.md`, `GOVERNANCE_MAINTENANCE_PROTOCOL.md`, `CONTROLLED_EVOLUTION_BOUNDARIES.md`, `OPERATIONAL_STABILITY_REVIEW.md`, `GOVERNANCE_OPERATIONALIZATION_VERDICT.md`.

---

## 1. Purpose

Rounds 1–4 produced the **content** of the governance corpus: which files are canonical, which are observations, which are superseded. Round 5 specifies the **lifecycle** of each class: how a document enters the corpus, what changes are allowed during its life, when it stops evolving, and where it goes after that.

This is **policy operationalization**, not architecture. The trust kernel (`ops/osctl/core/`) is untouched; the freeze (`osctl-freeze/1.5`) is untouched; the canonical set (15 files per `CANONICAL_GOVERNANCE_MAP.md` §2) is untouched. Round 5 names the **states** a governance document occupies and the **transitions** between them — using exactly the categories Round 4 already published.

---

## 2. Lifecycle States (5 — Closed Set)

Every governance file under `ops/osctl/`, `ops/state/`, `ops/rituals/`, `ops/simulations/`, and root-level governance MDs occupies exactly **one** of these states at any time. The states are a partition; there is no sixth.

| State | Definition | Permitted edits | Authority weight |
|-------|-----------|-----------------|------------------|
| **ACTIVE** | Working document. Edits are routine, not gated. | Free editing within scope; no freeze bump required. | Operational only (not invariant authority). |
| **APPEND-ONLY** | Edits allowed strictly as new dated sections appended at the bottom. Prior sections immutable. | Add new dated section; never modify existing sections. | Cumulative record (ADRs, risk register, hashes, ledger events). |
| **EDIT-RESTRICTED** | Canonical spec or governance file. Edits gated by `osctl-freeze/X.Y.Z` bump per `ARCHITECTURE_FREEZE.md` §Amendment Process. | Editorial fixes (typos, cross-link, banner) are free. Invariant text, path declarations, role definitions, and forbidden capabilities require freeze bump. | Highest — these are the rules. |
| **FROZEN** (a.k.a. FULLY FROZEN) | Dated point-in-time artefact. Content is final. | Errata only (typo, broken link), recorded in a single "Corrections" footnote section. | Historical evidence — never overridden by later docs without supersession. |
| **ARCHIVED** | Moved to `ops/osctl/archive/<category>/` (planned per `ARCHIVE_RECOMMENDATIONS.md` §2). Out of active navigation; readable, never edited. | **None.** Restoration requires reverting the `git mv`. | None — superseded record only. |

**Naming consistency:** "FULLY FROZEN" (from `FREEZE_CANDIDATES.md` §1) and "FROZEN" (this file) are the same state. Round 5 prefers the short label for prose; the long label remains canonical in `FREEZE_CANDIDATES.md`.

---

## 3. Lifecycle State Machine (Transitions)

Each transition is a **human action**. None is automatic. None requires deploy, CI, backend, or kernel change.

```text
                    (created — must declare class)
                            │
                            ▼
   ┌──────────────────────────────────────────────────┐
   │                                                  │
   │   ACTIVE  ─────►  APPEND-ONLY                    │
   │     │                │                           │
   │     │                ▼                           │
   │     └──►  EDIT-RESTRICTED  ───►  FROZEN          │
   │                                    │             │
   │                                    ▼             │
   │                                ARCHIVED          │
   │                                                  │
   └──────────────────────────────────────────────────┘
```

| From → To | Trigger | Authority required | Reversible? |
|-----------|---------|---------------------|-------------|
| (none) → ACTIVE | New working doc authored | Author (human) | Yes (delete or archive) |
| (none) → APPEND-ONLY | New registry / ADR log authored | Author | Yes |
| (none) → EDIT-RESTRICTED | New canonical doc (extremely rare — see §6 below) | Freeze bump + human owner sign-off (`ARCHITECTURE_FREEZE.md` §Amendment Process) | Only by next freeze bump |
| ACTIVE → APPEND-ONLY | Doc becomes a cumulative record | Author note + header change | Yes (header revert) |
| ACTIVE → EDIT-RESTRICTED | Promotion to canonical | Freeze bump | Only by freeze bump |
| ACTIVE → FROZEN | Working doc finalized as observation | Author note + freeze header | Yes |
| APPEND-ONLY → FROZEN | Register closed | Author note + freeze header | Yes |
| EDIT-RESTRICTED → FROZEN | Spec superseded | Freeze bump explicitly retiring it | Only by freeze bump |
| FROZEN → ARCHIVED | Historical artefact moved per `ARCHIVE_RECOMMENDATIONS.md` | `git mv` only | Yes (`git mv` revert) |
| ACTIVE → ARCHIVED | One-shot working doc complete | `git mv` only | Yes |
| ARCHIVED → (any) | **Forbidden** without explicit Round 6 charter | n/a | n/a — would require new audit cycle |

**Invariants of the machine:**

- L-1: There is **no transition from FROZEN to ACTIVE.** A frozen doc is dated; a new doc supersedes it.
- L-2: There is **no transition from ARCHIVED to anything** without a new explicitly chartered audit cycle.
- L-3: **APPEND-ONLY can only feed FROZEN.** It cannot become ACTIVE again; cumulative records do not "open".
- L-4: **EDIT-RESTRICTED enters and exits only via freeze bump.** The canonical set is gated by `osctl-freeze/X.Y` per `ARCHITECTURE_FREEZE.md`.
- L-5: **No state has a self-loop that mutates content semantics.** Editorial edits inside a state never change the state.

---

## 4. State Assignment — Current Corpus

This table is the **operational lifecycle ledger**. Every governance file already has a freeze classification in `FREEZE_CANDIDATES.md`; Round 5 collapses those classifications into the 5 lifecycle states and identifies the next legal transition (if any).

### 4.1 ACTIVE (working documents)

Per `FREEZE_CANDIDATES.md` §6.

| File | Reason | Next legal transition |
|------|--------|----------------------|
| `ops/osctl/README.md` | Navigation entrypoint; must stay ≤ 100 lines | ACTIVE → ACTIVE (vocab sweep editorial) |
| `ops/osctl/CI_INTEGRATION_PLAN.md` | Pre-implementation draft for Phase 2 | ACTIVE → FROZEN when Phase 2 ships (and superseded by a Phase 2 plan) |
| `ops/osctl/validation/VALIDATION_REPORT.md`, `VALIDATION_SUMMARY.md`, `VALIDATION_MATRIX.md`, `DETERMINISM_REPORT.md`, `REPLAY_TESTS.md`, `FAILURE_CASES.md` | Regenerated by `run_validation.py` | ACTIVE → ACTIVE (regenerated; no state change) |
| `ops/osctl/validation/README.md` | Validation entrypoint | ACTIVE → ACTIVE |
| `ops/state/*.template.md`, `ops/state/README.md`, `STATE_TRANSITIONS.md`, `RELEASE_CHECKLIST.md`, `ROLLBACK_CHECKLIST.md` | Operator templates | ACTIVE → ACTIVE |
| `ops/state/projections/CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` | Derived from replay | ACTIVE → ACTIVE (regenerated) |
| `ops/osctl/projections/*.generated.md` | Same | ACTIVE → ACTIVE |
| `ops/rituals/*.md` | Operator playbooks; revised after post-mortems | ACTIVE → ACTIVE |
| `MASTER_CONTEXT.md` (root) | Backend + OSCTL summary | OSCTL section: ACTIVE → FROZEN-after-trim (per Round 3 §6.5); backend section: ACTIVE |
| `AGENT_RULES.md` (root) | Agent contract | ACTIVE → ACTIVE (must add VERIFY before ACT per Round 3 §3.1) |
| `audit/HUMAN_MAINTAINABILITY_REPORT.md` | Forward maintainability baseline | ACTIVE → FROZEN after Round 4 reductions applied (re-measure permitted) |

### 4.2 APPEND-ONLY (cumulative records)

Per `FREEZE_CANDIDATES.md` §4.

| File | What "append" means here | Next legal transition |
|------|--------------------------|----------------------|
| `ops/osctl/ARCHITECTURE_DECISIONS.md` | New ADRs appended; existing ADRs immutable | APPEND-ONLY → FROZEN only when superseded by a new canonical ADR log (freeze bump) |
| `audit/FUTURE_RISK_REVIEW.md` | New dated risk entries | APPEND-ONLY → FROZEN when register retired |
| `ops/osctl/validation/HASH_REGISTRY.md` | New fingerprints | APPEND-ONLY → FROZEN only at freeze bump |
| `ops/state/ledger/events.jsonl` (or `ops/osctl/ledger/events.jsonl` per path decision) | Hard kernel invariant (`O_APPEND`) | APPEND-ONLY indefinitely; this is a code-enforced state, not a doc state |
| `audit/FREEZE_CANDIDATES.md` (this round's freeze register) | Stop-rule + freeze classifications grow over time | APPEND-ONLY → FROZEN at end of Round 5 publication |

### 4.3 EDIT-RESTRICTED (the 15 canonical files + scoped supplements)

Per `CANONICAL_GOVERNANCE_MAP.md` §2 and `FREEZE_CANDIDATES.md` §5.

| Category | Files | Edit gate |
|----------|-------|-----------|
| Canonical spec (C-1..C-11) | `ARCHITECTURE_FREEZE.md`, `FREEZE_v1.md`, `EVENT_SCHEMA.md`, `STATE_MACHINE.md`, `LEDGER_MODEL.md`, `PROJECTION_RULES.md`, `REPLAY_GUARANTEES.md`, `VERIFY_MODEL.md`, `SERIALIZATION_RULES.md`, `ROLLBACK_POLICY.md`, `DRIFT_DETECTION.md` | Freeze bump (`osctl-freeze/1.5.X` editorial; `osctl-freeze/1.6+` for invariant changes) |
| Canonical governance (C-12..C-15) | `GOVERNANCE.md`, `BOUNDARIES.md`, `HUMAN_BOUNDARIES.md`, `TRUST_MODEL.md` | Same |
| Negative scope | `NON_GOALS.md` | Same |
| Snapshot scoped supplements | `SNAPSHOT_ARCHITECTURE.md`, `SNAPSHOT_FORMAT.md`, `SNAPSHOT_TRUST_BOUNDARIES.md`, `SNAPSHOT_RETENTION.md`, `SNAPSHOT_FAILURE_MODES.md`, `SNAPSHOT_SECURITY.md` | Snapshot-scope edits free; cross-scope edits require freeze bump |

**Editorial edits** (per `FREEZE_CANDIDATES.md` §5 last paragraph): typos, banner additions, cross-link fixes, vocabulary swept per `TERMINOLOGY_NORMALIZATION.md` — **no freeze bump required.**

### 4.4 FROZEN (dated artefacts)

Per `FREEZE_CANDIDATES.md` §2–§3.

| File | Why FROZEN | Next legal transition |
|------|-----------|-----------------------|
| `audit/FINAL_HYGIENE_VERDICT.md` (Round 1) | Verdict | FROZEN → ARCHIVED only via Round 6 charter |
| `audit/FINAL_AUDIT_VERDICT.md` (Round 2) | Verdict | Same |
| `audit/CONSOLIDATION_FINAL_VERDICT.md` (Round 3) | Verdict | Same |
| `audit/GOVERNANCE_SIMPLIFICATION_VERDICT.md` (Round 4) | Verdict | Same |
| `audit/GOVERNANCE_OPERATIONALIZATION_VERDICT.md` (this round) | Verdict | FROZEN at publication |
| `audit/ARCHITECTURE_CONSISTENCY_AUDIT.md`, `TRUST_BOUNDARY_AUDIT.md`, `SOURCE_OF_TRUTH_MAP.md`, `ARCHITECTURAL_ENTROPY_REPORT.md`, `HUMAN_OPERABILITY_REVIEW.md` | Round 2/3 observation snapshots | FROZEN → ARCHIVED only via Round 6 charter |
| `audit/INVARIANT_REGISTRY.md` | After restatement strip per `GOVERNANCE_REDUCTION_PLAN.md` §4.2 | FROZEN; conflict register only |
| `audit/TERMINOLOGY_NORMALIZATION.md` | After vocab sweep | FROZEN |
| `audit/PHASE_ALIGNMENT_MATRIX.md` | After snapshot rename | FROZEN |
| `audit/CANONICAL_GOVERNANCE_MAP.md`, `SOURCE_OF_TRUTH_REDUCTION.md`, `ARCHIVE_RECOMMENDATIONS.md`, `FREEZE_CANDIDATES.md` (Round 4) | Round 4 self-frozen at publication | FROZEN |
| `audit/GOVERNANCE_LIFECYCLE_MODEL.md`, `FREEZE_POLICY_OPERATIONALIZATION.md`, `SOURCE_OF_TRUTH_OPERATIONAL_GUIDE.md`, `GOVERNANCE_MAINTENANCE_PROTOCOL.md`, `CONTROLLED_EVOLUTION_BOUNDARIES.md`, `OPERATIONAL_STABILITY_REVIEW.md` (this round) | Round 5 deliverables — FROZEN at publication | FROZEN |

### 4.5 ARCHIVED (planned, not yet executed)

Per `ARCHIVE_RECOMMENDATIONS.md` §3–§5. **None of these moves have been executed.** The lifecycle state of every file below is currently **its prior state**, with ARCHIVED as the **next legal transition** subject to the conditions named.

| File | Currently in state | Next legal transition | Gate (per `ARCHIVE_RECOMMENDATIONS.md`) |
|------|--------------------|------------------------|------------------------------------------|
| `ops/osctl/SPEC_REFERENCE.md` | ACTIVE (draft) | ARCHIVED (`archive/drafts/`) | After SUPERSEDED banner applied |
| `ops/osctl/ARCHITECTURE_FREEZE_CHECKLIST.md` | ACTIVE (draft) | ARCHIVED (`archive/drafts/`) | After banner applied |
| `ops/osctl/IMPLEMENTATION_NOTES.md` | ACTIVE (draft) | ARCHIVED (`archive/drafts/`) | After banner applied |
| Round 1 hygiene plans (10 files per `ARCHIVE_RECOMMENDATIONS.md` §4) | FROZEN (observations) | ARCHIVED (`archive/hygiene/`) | After hygiene applied + git anchoring complete |
| `audit/GOVERNANCE_DEDUPLICATION_PLAN.md`, `TRUST_SIMPLIFICATION_PLAN.md`, `TRUST_LAYER_BOUNDARIES.md`, `GOVERNANCE_REDUCTION_PLAN.md` | ACTIVE | ARCHIVED (`archive/consolidation/`) | After respective dispositions applied |

---

## 5. Lifecycle Authority Map

Who can transition what. The authority chain is fully human; no automation, no CI, no agent.

| Transition class | Authority | Evidence required |
|------------------|-----------|-------------------|
| Editorial edit within ACTIVE | Any contributor | None beyond commit message |
| ACTIVE → APPEND-ONLY (header change) | Doc author | Note in `ARCHITECTURE_DECISIONS.md` if cross-cutting |
| ACTIVE → FROZEN | Doc author | Date stamp + "Status: FROZEN" header per `FREEZE_CANDIDATES.md` §9 |
| APPEND-ONLY → FROZEN | Doc author | Date stamp + closing note |
| ANY → EDIT-RESTRICTED | **Human owner** (per `ARCHITECTURE_FREEZE.md` §Sign-Off) | Freeze bump entry in `ARCHITECTURE_DECISIONS.md` + signed sign-off |
| EDIT-RESTRICTED edit (invariant) | **Human owner** | Freeze bump (`osctl-freeze/X.Y+1`), spec bump if invariant text changes, validation re-run |
| FROZEN → ARCHIVED | Human (no new authority needed) | `git mv` + index entry in `ops/osctl/archive/README.md` per `ARCHIVE_RECOMMENDATIONS.md` §2.2 |
| ARCHIVED → anything | **Forbidden without explicit Round 6 charter** | Same gate as new audit cycle |

**No agent — Cursor, Claude, CI, or otherwise — has authority over any transition.** This matches `HUMAN_BOUNDARIES.md` and `AGENT_RULES.md`.

---

## 6. Lifecycle Rules for New Documents

This section operationalizes the question "what happens when a new governance file is created?" — without creating any new authority.

### 6.1 Default class for new docs

| Where created | Default class | Allowed? |
|---------------|---------------|----------|
| `ops/osctl/audit/` | FROZEN at publication (observation only) | Only with explicit Round-N charter; see `FREEZE_CANDIDATES.md` §8 stop-rule |
| `ops/osctl/` root | EDIT-RESTRICTED | **Forbidden** without freeze bump (`FREEZE_CANDIDATES.md` §8.5) |
| `ops/osctl/snapshots/` | EDIT-RESTRICTED scoped supplement | Forbidden without freeze bump |
| `ops/osctl/validation/` | ACTIVE (evidence) | Allowed; never authority |
| `ops/state/`, `ops/rituals/`, `ops/simulations/` | ACTIVE (templates, playbooks) | Allowed; never OSCTL authority |
| Root governance MDs | ACTIVE | Allowed; banners may demote them |
| `ops/osctl/archive/` | ARCHIVED | Only by `git mv` from another state |

### 6.2 Forbidden new-file patterns

Per `FREEZE_CANDIDATES.md` §8 (formalized in Round 4):

- No new `*_FINAL_VERDICT.md` unless an existing one is moved to `archive/consolidation/` in the same commit.
- No new `*_REGISTRY.md` unless replacing one in scope.
- No new `*_PLAN.md` if two active plans already exist.
- No new sub-folders under `ops/osctl/` other than `archive/` (already specified).
- No new authority documents — only edits to the 15 canonical files (via freeze bump).

Round 5 does **not** loosen any of these. It documents that they are part of the lifecycle.

---

## 7. Lifecycle Anti-Patterns (Detected and Bounded)

Patterns that have appeared in prior rounds and which the lifecycle model now bounds.

| Anti-pattern | Where it appeared | Round-5 lifecycle bound |
|--------------|-------------------|--------------------------|
| New round adds a `_VERDICT.md` without retiring a prior verdict | Rounds 1→2→3→4 (4 verdicts; cap 4) | Stop-rule §8.1; no new transition into FROZEN-VERDICT unless prior verdict moves FROZEN → ARCHIVED |
| Per-round `_REGISTRY.md` accumulation | `INVARIANT_REGISTRY`, `TERMINOLOGY_REGISTRY` | Stop-rule §8.2 + Round 4 merges |
| Plan files accumulate | `GOVERNANCE_DEDUPLICATION_PLAN`, `TRUST_SIMPLIFICATION_PLAN`, `GOVERNANCE_REDUCTION_PLAN` | Max 2 active plans (§8.3); each plan auto-archives once applied |
| Audit doc starts asserting policy | Several Round 2/3 docs had imperative tone | Lifecycle invariant: only EDIT-RESTRICTED state grants policy authority (§2) |
| Frozen verdict gets "updated" with corrections that change conclusion | Not observed, but possible | L-1: FROZEN → ACTIVE forbidden; only errata footnote per `FREEZE_CANDIDATES.md` §1 |
| New layer added under `ops/osctl/` (e.g., "coordination layer") | Discussed in prior rounds; never built | Stop-rule §8.5 |
| Archived doc gets re-edited | Not observed | L-2: ARCHIVED → anything forbidden without Round 6 charter |

---

## 8. Lifecycle Visibility (How a Human Reads It)

A human opening any governance file should be able to identify its lifecycle state in ≤ 5 seconds. The operational signal is the **header band**.

| State | Header band convention (from `FREEZE_CANDIDATES.md` §9 + this round) |
|-------|----------------------------------------------------------------------|
| ACTIVE | No band required; default state |
| APPEND-ONLY | `**Mode:** APPEND-ONLY` line in first 5 lines |
| EDIT-RESTRICTED | `**Freeze ID:** osctl-freeze/X.Y` line in first 5 lines |
| FROZEN | `**Authority of this document:** Observation only — non-authoritative.` + date stamp (current pattern in all Round 1–5 audit files) |
| ARCHIVED | `archive/<category>/` path is the signal; index line in `archive/README.md` |

The convention is already de facto present in 100% of Round 1–4 audit files and all 15 canonical files. Round 5 names it. No file format change is required.

---

## 9. Lifecycle Verdict

| Dimension | Verdict |
|-----------|---------|
| Every governance class has a lifecycle state | **Yes** (5 states; partition) |
| Every state has defined permitted edits | **Yes** (Section 2) |
| Every transition has an authority owner | **Yes** (Section 5) |
| No transition requires new authority | **Yes** (all existing per `ARCHITECTURE_FREEZE.md`, `GOVERNANCE.md`, `HUMAN_BOUNDARIES.md`) |
| No transition requires automation | **Yes** |
| No transition requires kernel change | **Yes** |
| Anti-patterns bounded by lifecycle invariants | **Yes** (Section 7) |
| Lifecycle visible to human readers | **Yes** (Section 8, already de facto) |

**Net:** The governance lifecycle model is **operationally complete, fully human-owned, and adds zero new authority.** It documents the lifecycle the corpus already exhibits and names the transitions Rounds 1–4 implicitly used.

---

## 10. Closing Statement

The lifecycle is **the corpus the corpus already has** — Round 5 names it. ACTIVE files breathe, APPEND-ONLY files grow, EDIT-RESTRICTED files are gated by `osctl-freeze/X.Y`, FROZEN files date themselves, and ARCHIVED files step out of the active surface without losing their git history.

No layer is added. No authority shifts. The trust kernel is unchanged. **What changes is the operability of the corpus over time:** a human picking up this repository in 2027 can answer "what is this file allowed to do, and how does it end?" by reading exactly two paragraphs.

This document is itself **FROZEN at publication**, per its own §4.4.
