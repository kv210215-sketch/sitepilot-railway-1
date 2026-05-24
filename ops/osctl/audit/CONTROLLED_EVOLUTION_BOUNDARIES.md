# OSCTL Controlled Evolution Boundaries

**Date:** 2026-05-24
**Audit cycle:** Round 5 — Governance Operationalization (strict, read-only, explicitly chartered per Round 4 §10 stop-rule exception)
**Authority of this document:** **Observation only — non-authoritative.** This file does not amend the freeze, define new policy, or grant any capability. It operationalizes the evolution boundaries already declared in `NON_GOALS.md`, `HUMAN_BOUNDARIES.md`, `BOUNDARIES.md`, `FREEZE_v1.md`, and the stop-rule in `FREEZE_CANDIDATES.md` §8.
**Builds on:** `GOVERNANCE_LIFECYCLE_MODEL.md`, `FREEZE_POLICY_OPERATIONALIZATION.md`, `GOVERNANCE_MAINTENANCE_PROTOCOL.md` (all this round).

---

## 1. Purpose

After freeze stabilization (Round 2), validation (Round 2), snapshot layer (Phase 1.5-S), audit (Rounds 1–4), and canonical reduction (Round 4), OSCTL exists in a **stable corpus**. The remaining operational question is: **What is allowed to evolve, in which direction, and where are the hard walls?**

This document enumerates the **boundaries of permitted evolution** — what changes are pre-approved within existing authority, what changes require a freeze bump, what changes are forbidden entirely, and what changes are explicitly out of scope for OSCTL.

This is **boundary documentation**, not new authority. Every wall cited here already exists in a canonical doc; Round 5 names them so a future contributor doesn't accidentally walk past one.

---

## 2. The Three Boundary Classes

Every proposed change to anything in `ops/osctl/`, `ops/state/`, `ops/rituals/`, `ops/simulations/`, or root-level governance MDs falls into one of three classes.

| Class | Means | Authority | Examples |
|-------|-------|-----------|----------|
| **B-1. Free Evolution** | Editorial change within existing authority; no gate | Any contributor + reviewer | Typo, link fix, banner, vocab sweep, archive moves per `ARCHIVE_RECOMMENDATIONS.md`, new ADR append, new evidence entry |
| **B-2. Controlled Evolution** | Substantive change inside the freeze; requires explicit gate | Human owner (per `ARCHITECTURE_FREEZE.md` §Sign-Off) | Freeze bump per `FREEZE_POLICY_OPERATIONALIZATION.md` §4; phase transition per `GOVERNANCE_MAINTENANCE_PROTOCOL.md` §4 |
| **B-3. Forbidden** | Change that would breach the freeze's negative scope | **None — not authorized at any level under `osctl-freeze/1.5`** | Adding orchestration; adding autonomous authority; adding "coordination layer"; granting agents production capability; making projections authoritative; making snapshots authoritative; using OSCTL to deploy |

**The classes are a partition.** Any proposed change that does not cleanly belong to B-1 or B-2 is B-3 by default. The reviewer's job is to classify; the human owner's job is to authorize B-2.

---

## 3. B-1 — Free Evolution Boundary

Changes that are pre-approved under the current freeze (`osctl-freeze/1.5`). Each cites the authorizing canonical doc.

| Change | Authority | Constraint |
|--------|-----------|------------|
| Typo / grammar / formatting | `ARCHITECTURE_FREEZE.md` §Amendment Process last paragraph | Editorial only |
| Cross-link fix | Same | Editorial only |
| Banner addition (SUPERSEDED / NON-AUTHORITATIVE / PRE-IMPLEMENTATION) | Round 3 §3, retained by Round 4 disposition tables | Banner text must match Round 3's specified wording |
| Vocabulary sweep (`observed`/`marked` → `recorded`, `project` → `replay`, `Phase 3` → `Snapshot Layer (P1.5-S)`) | `TERMINOLOGY_NORMALIZATION.md` + Round 3 §3 | One-shot, then archive the sweep plan |
| Restatement removal (RESTATE → REFERENCE) per `SOURCE_OF_TRUTH_REDUCTION.md` §2 | Round 4 | Must not change canonical content |
| New ADR append in `ARCHITECTURE_DECISIONS.md` | Doc is APPEND-ONLY per `FREEZE_CANDIDATES.md` §4 | Existing ADRs immutable |
| New risk append in `FUTURE_RISK_REVIEW.md` | APPEND-ONLY | New dated section only |
| New fingerprint append in `HASH_REGISTRY.md` | APPEND-ONLY | Tied to validation runs |
| New validation evidence regeneration | `run_validation.py` output is regenerated | Never policy-bearing |
| Archive moves per `ARCHIVE_RECOMMENDATIONS.md` §3–§5 | Round 4 + `GOVERNANCE_LIFECYCLE_MODEL.md` §3 transition FROZEN → ARCHIVED | `git mv` only; update `archive/README.md` in same commit |
| `README.md` reorganization | Active doc per `FREEZE_CANDIDATES.md` §6 | ≤ 100 lines |
| Editorial trim of `MASTER_CONTEXT.md` OSCTL section to ≤ 8 lines | Round 3 §6.5 | One-shot |
| New ritual playbook / simulation narrative | Operator content, not OSCTL authority | Banner per `ARCHIVE_RECOMMENDATIONS.md` §7 |
| New state template (`*.template.md`) | Templates only, no OSCTL authority | Must not assert canonical rules |
| Banner-mark root MDs (`CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md`) as NON-AUTHORITATIVE | Round 3 §3.2 | Banner text from Round 3 |
| Update `AGENT_RULES.md` to require VERIFY before ACT | Round 3 §3.1 | Editorial — no kernel change |

**Sanity rule for B-1:** if you cannot point at a row in this table, you are not in B-1.

---

## 4. B-2 — Controlled Evolution Boundary

Changes that require explicit gating but are **permitted** under controlled conditions. Each requires either a freeze bump or a phase entry. Both are documented operationally in `FREEZE_POLICY_OPERATIONALIZATION.md` and `GOVERNANCE_MAINTENANCE_PROTOCOL.md`.

### 4.1 Freeze-bump–gated evolution

Per `FREEZE_POLICY_OPERATIONALIZATION.md` §3:

| Change | Gate | Output |
|--------|------|--------|
| Edit to invariant text (`FREEZE_v1.md` §6 / `ARCHITECTURE_FREEZE.md` §Frozen Decisions) | Freeze bump (`1.5` → `1.6`) | New freeze ID + Owner sign-off |
| Edit to canonical path declaration (`LEDGER_MODEL.md`, `PROJECTION_RULES.md`, `core/ledger/paths.py`) | Freeze bump | New freeze ID + ADR entry |
| Edit to role definitions (`GOVERNANCE.md` §Role Model, `HUMAN_BOUNDARIES.md`) | Freeze bump | New freeze ID |
| Edit to forbidden capabilities (`NON_GOALS.md`) | Freeze bump | New freeze ID + Owner sign-off |
| New event type / new state transition | Spec bump + freeze bump | `osctl-core/1.0` → `1.1`; `osctl-freeze/1.5` → `1.6` |
| Edit to canonical bytes (`SERIALIZATION_RULES.md`) | Spec bump + freeze bump | Same |
| New required verify layer (`VERIFY_MODEL.md`) | Freeze bump | New freeze ID |
| Change to replay determinism claim (`REPLAY_GUARANTEES.md`) | Freeze bump | New freeze ID |

### 4.2 Phase-entry–gated evolution

Per `GOVERNANCE_MAINTENANCE_PROTOCOL.md` §4 + `GOVERNANCE.md` §Phase Alignment:

| Change | Gate | Output |
|--------|------|--------|
| Enable CI observe-only ingest | Phase 2 entry: freeze bump `1.5` → `1.6` + sign-off + scenarios | Phase 2 ADR + new freeze ID |
| Enable verify gate on projections | Phase 3 entry: freeze bump `1.6` → `1.7` | Phase 3 ADR |
| Define ledger sync policy | Phase 4 entry: freeze bump `1.7` → `1.8` | Phase 4 ADR; **still no deploy orchestration** |

### 4.3 Charter-gated evolution

Per `GOVERNANCE_MAINTENANCE_PROTOCOL.md` §3:

| Change | Gate | Output |
|--------|------|--------|
| Future audit round (Round 6+) | Human-owner charter referencing the cap-exit and superseded artefact | New audit round inside `audit/` with prior verdict archived |

---

## 5. B-3 — Forbidden Evolution Boundary (Hard Walls)

Changes that are **not authorized at any level under `osctl-freeze/1.5`**. These are not "high gate" — they are **structurally forbidden** by the freeze's negative scope.

### 5.1 Forbidden by `ARCHITECTURE_FREEZE.md` §"This freeze does not authorize"

| Change | Source |
|--------|--------|
| CI workflow changes (without phase-entry bump) | `ARCHITECTURE_FREEZE.md` |
| Deploy orchestration of any kind | Same |
| Railway / Cloudflare integration **by OSCTL** | Same |
| Autonomous or AI-operated production actions | Same |

### 5.2 Forbidden by `NON_GOALS.md` + `HUMAN_BOUNDARIES.md` + `TRUST_MODEL.md` (canonical non-claims)

| Change | Why forbidden |
|--------|---------------|
| Make projections (`CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md`) authoritative | Hard kernel invariant — projections are derived only |
| Make snapshots authoritative | Snapshot scoped supplements (`SNAPSHOT_TRUST_BOUNDARIES.md`) declare non-authority |
| Trigger deploys from OSCTL | `NON_GOALS.md` + `GOVERNANCE.md` §Role Model |
| Grant agents production authority | `HUMAN_BOUNDARIES.md` + `AGENT_RULES.md` |
| Add a "coordination layer" under `ops/osctl/` | `TERMINOLOGY_NORMALIZATION.md` T-10 + stop-rule §8.5 |
| Add hidden mutable state to the kernel | `MASTER_CONTEXT.md` forbidden list + `REPLAY_GUARANTEES.md` purity claim |
| Snapshot-triggered deploys | `MASTER_CONTEXT.md` forbidden list |
| Snapshot authority escalation | Same |
| Mutable hidden caches | Same |
| Production orchestration hooks from snapshots | Same |
| Bypass `validateEnv` or pre-start health binding in `backend/` from OSCTL | Outside OSCTL scope; `AGENT_RULES.md` prohibits |
| Enable `DB_SYNC=true` in production from any OSCTL surface | `AGENT_RULES.md` |
| Auto-rollback executed by OSCTL or by any agent | `ROLLBACK_POLICY.md` ("rollback = metadata, not automation") |

### 5.3 Forbidden by Round 4 stop-rule (`FREEZE_CANDIDATES.md` §8)

| Change | Forbidden until |
|--------|-----------------|
| New `*_FINAL_VERDICT.md` without prior verdict archived in same commit | Always (cap = 4 unless supersession) |
| New `*_REGISTRY.md` without replacing one | Always |
| > 2 active `*_PLAN.md` files | Always |
| New sub-folder under `ops/osctl/` other than `archive/` | Without freeze bump |
| New "authority document" outside the 15 canonical files | Without freeze bump |

### 5.4 Forbidden by Round 5 (this protocol's restatement of existing rules)

| Change | Source |
|--------|--------|
| Agent-initiated freeze bump | `HUMAN_BOUNDARIES.md` + `FREEZE_POLICY_OPERATIONALIZATION.md` §2 |
| Uncharter Round-N audit | `GOVERNANCE_MAINTENANCE_PROTOCOL.md` §3 |
| Transition FROZEN → ACTIVE | Lifecycle invariant L-1 (`GOVERNANCE_LIFECYCLE_MODEL.md` §3) |
| Transition ARCHIVED → anything | Lifecycle invariant L-2 |
| Re-edit prior-round audit files | `GOVERNANCE_REDUCTION_PLAN.md` §8 |
| Mix archive move with content edit | `ARCHIVE_RECOMMENDATIONS.md` §9 step 3 |
| Use `git copy + delete` instead of `git mv` for archive | `ARCHIVE_RECOMMENDATIONS.md` §9 step 1 |
| Skip `run_validation.py` after any freeze-bump step | `FREEZE_POLICY_OPERATIONALIZATION.md` §4.3 |

---

## 6. Boundary Decision Tree (Reviewer Quickref)

A reviewer evaluating a PR applies this 4-question tree.

```text
            ┌─────────────────────────────────────────────┐
            │ Q1. Does the PR change any line in          │
            │     §5 (B-3 Forbidden)?                     │
            └──────────────────┬──────────────────────────┘
                               │
                       yes ────┼──── no
                       ▼               ▼
              ┌─────────────┐   ┌──────────────────────────────┐
              │  REJECT     │   │ Q2. Does the PR change any   │
              │  (B-3 wall) │   │     line in §4 (B-2 gated)?  │
              └─────────────┘   └──────────────┬───────────────┘
                                               │
                                       yes ────┼──── no
                                       ▼              ▼
                              ┌──────────────┐  ┌──────────────────────┐
                              │ Q3. Is there │  │ Q4. Does PR change   │
                              │ a valid gate │  │     match a row in   │
                              │ (sign-off /  │  │     §3 (B-1 free)?   │
                              │ phase entry/ │  └─────────┬────────────┘
                              │ charter)?    │            │
                              └─────┬────────┘   yes ─────┼──── no
                                    │                     ▼          ▼
                            yes ────┼──── no       ┌─────────┐  ┌──────────┐
                            ▼              ▼       │ ACCEPT  │  │  REJECT  │
                      ┌─────────┐  ┌────────────┐  │ (B-1)   │  │ (no class│
                      │ ACCEPT  │  │   REJECT   │  └─────────┘  │  matches)│
                      │ (B-2 ok)│  │ (gate miss)│               └──────────┘
                      └─────────┘  └────────────┘
```

| Outcome | Next action |
|---------|-------------|
| ACCEPT (B-1) | Merge after lint + `run_validation.py` PASS |
| ACCEPT (B-2 ok) | Merge after full freeze-bump protocol completes (`FREEZE_POLICY_OPERATIONALIZATION.md` §4) |
| REJECT (no class) | Close PR; provide pointer to this doc §3–§5 |
| REJECT (B-3 wall) | Close PR; provide pointer to §5; do not advise workarounds |
| REJECT (gate miss) | Close PR; provide pointer to §4 gating; offer human-owner-charter path |

---

## 7. Examples (Operational Calibration)

Concrete worked examples that exercise the decision tree. Each cites the relevant section.

| Example | Class | Reasoning |
|---------|-------|-----------|
| Replace "Phase 3 artifacts" with "Snapshot Layer (P1.5-S) artifacts" in `MASTER_CONTEXT.md` | **B-1** | Vocab sweep §3; one-shot per Round 3 §6.7 |
| Add "Status: SUPERSEDED — see EVENT_SCHEMA.md" banner to `SPEC_REFERENCE.md` | **B-1** | Banner addition §3; Round 3 §2 action #1 |
| Move `SPEC_REFERENCE.md` to `archive/drafts/` | **B-1** | Archive move §3; requires banner applied first per `ARCHIVE_RECOMMENDATIONS.md` §9 |
| Change `core/ledger/paths.py` to point ledger at `ops/osctl/ledger/` only | **B-2** | Canonical path change §4.1; freeze-bump gated |
| Add a new event type `deploy.queued` to `EVENT_SCHEMA.md` | **B-2** | Spec bump + freeze bump §4.1 |
| Add a "coordination layer" under `ops/osctl/coord/` | **B-3** | Forbidden §5.2 — "coordination layer" |
| Have CI auto-append events to `events.jsonl` on deploy success | **B-3** | Forbidden §5.1 + `NON_GOALS.md` (autonomous production) |
| Author a new `audit/PHASE_5_PLAN.md` because Phase 2 ingest is being designed | **B-3** until charter, then **B-2** if chartered and one active plan retires | Stop-rule §5.3 + maintenance §4 phase entry — but plan files cap at 2 |
| Add a freeze-bump entry without owner sign-off | **B-3** (gate miss → invalid bump) | §5.4 |
| Edit `audit/FINAL_HYGIENE_VERDICT.md` to "correct" its conclusions | **B-3** | Lifecycle L-1 + §5.4 (re-edit prior-round audit) |
| Regenerate `validation/VALIDATION_REPORT.md` by running `run_validation.py` | **B-1** | Validation evidence regeneration §3 |

---

## 8. Boundary-Specific Read List

Where to look when evaluating a specific class of change.

| Looking at | Read these (in order) |
|------------|------------------------|
| B-1 question | This doc §3 → `ARCHITECTURE_FREEZE.md` §Amendment Process |
| B-2 freeze-bump question | This doc §4.1 → `FREEZE_POLICY_OPERATIONALIZATION.md` §3 → §4 |
| B-2 phase-entry question | This doc §4.2 → `GOVERNANCE.md` §Phase Alignment → `GOVERNANCE_MAINTENANCE_PROTOCOL.md` §4 |
| B-2 charter question | This doc §4.3 → `GOVERNANCE_MAINTENANCE_PROTOCOL.md` §3 |
| B-3 wall question | This doc §5 → `NON_GOALS.md` + `HUMAN_BOUNDARIES.md` + `ARCHITECTURE_FREEZE.md` "does not authorize" |
| Stop-rule question | This doc §5.3 → `FREEZE_CANDIDATES.md` §8 → `GOVERNANCE_MAINTENANCE_PROTOCOL.md` §5 |
| Lifecycle question | `GOVERNANCE_LIFECYCLE_MODEL.md` §2–§4 |

---

## 9. Forward Evolution — What's *Expected* to Change

Honest expectation-setting: which boundaries are likely to be exercised in the next phases, by whom, with what gate.

| Future change | Expected timing | Class | Gate |
|---------------|-----------------|-------|------|
| Round 3 §6 actions 1–8 (banners, redirects, AGENT_RULES, MASTER_CONTEXT trim) | Soon | B-1 | None — editorial |
| Round 3 §10 path decision (Option L on `core/ledger/paths.py`) | Soon | **B-2** | Freeze bump (path declaration change) — single line of code |
| Round 4 archive moves (drafts, hygiene, consolidation) | After above | B-1 | None — `git mv` |
| Phase 2 entry (CI observe-only ingest) | Mid-term | **B-2** | Phase-2 freeze bump + sign-off + scenarios |
| Phase 3 entry (verify gate) | Later | **B-2** | Phase-3 freeze bump |
| Phase 4 entry (sync policy — still not deploy) | Later | **B-2** | Phase-4 freeze bump |
| Hash-chain or external head-hash anchoring | Open (deferred per `FREEZE_v1.md`) | **B-2** | Spec bump + freeze bump |
| Future audit (Round 6) | Conditional | **B-2 charter-gated** | Human-owner charter referencing this doc |

**What's NOT expected to change:** the canonical 15 files' invariant text; the freeze-declaration semantics; the role model; the forbidden-capability list; the closed event-type enum without a spec bump; OSCTL's non-authority over deploy/infra.

---

## 10. Boundary Verdict

| Dimension | Verdict |
|-----------|---------|
| Three boundary classes are a partition | **Yes** (Section 2) |
| Every B-1 row cites a canonical authority | **Yes** (Section 3) |
| Every B-2 row cites a canonical gate | **Yes** (Section 4) |
| Every B-3 row cites a canonical forbidden statement | **Yes** (Section 5) |
| Decision tree is operational (single-pass per PR) | **Yes** (Section 6) |
| Worked examples calibrate the tree | **Yes** (Section 7) |
| Read list resolves any reviewer ambiguity | **Yes** (Section 8) |
| Round-5 adds new B-3 wall | **No** — only restates existing ones |
| Round-5 adds new B-1 permission | **No** — only restates existing ones |
| Round-5 adds new B-2 gate | **No** — only operationalizes existing gates |
| Round-5 changes the freeze | **No** |

**Net:** Evolution boundaries are **enumerated, classified, and reviewable in single-pass**. Every wall and every gate cites an existing canonical authority. The walls are walls because the canonical docs make them walls — Round 5 only puts them on a map.

This document is itself **FROZEN at publication**.
