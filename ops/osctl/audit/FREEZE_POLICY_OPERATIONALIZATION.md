# OSCTL Freeze Policy Operationalization

**Date:** 2026-05-24
**Audit cycle:** Round 5 — Governance Operationalization (strict, read-only, explicitly chartered per Round 4 §10 stop-rule exception)
**Authority of this document:** **Observation only — non-authoritative.** This file does not amend the freeze, define new policy, or grant any capability. It operationalizes the freeze procedure already declared in `ARCHITECTURE_FREEZE.md` and classified in `FREEZE_CANDIDATES.md`.
**Builds on:** `ARCHITECTURE_FREEZE.md`, `FREEZE_v1.md`, `FREEZE_CANDIDATES.md`, `ARCHITECTURE_DECISIONS.md`, `GOVERNANCE_LIFECYCLE_MODEL.md` (this round).

---

## 1. Purpose

`ARCHITECTURE_FREEZE.md` declares the freeze (`osctl-freeze/1.5`) and lists the Amendment Process. `FREEZE_CANDIDATES.md` classifies every governance file by freeze mode. Neither file specifies the **operational mechanics**: who triggers a bump, what evidence is required, where the bump is recorded, what counts as immutable, and how the freeze interacts with day-to-day editing.

This document operationalizes the freeze **without changing it**. It is policy-application detail, not policy. The freeze itself (`osctl-freeze/1.5`, `osctl-core/1.0`) is untouched.

---

## 2. Freeze Authority — Who May Bump

The freeze authority chain is fully declared in existing canonical docs. Round 5 collects it in one place for operational discoverability.

| Authority role | Source doc | Freeze-related authority |
|----------------|------------|---------------------------|
| **Human owner** (production gate, rollback, reconcile, secrets, migrations) | `ARCHITECTURE_FREEZE.md` §Sign-Off + §Amendment Process + `GOVERNANCE.md` §Role Model | **Sole authority** to bump `osctl-freeze/X.Y` |
| **Human reviewer** | `ARCHITECTURE_FREEZE.md` §Sign-Off | Sign-off required on bump entry |
| **OSCTL core** (`ops/osctl/core/`) | `GOVERNANCE.md` §Role Model | None over freeze; enforces existing kernel only |
| **CI (GHA)** | `GOVERNANCE.md` §Role Model | None over freeze; can read freeze state |
| **Agents (Cursor / Claude / similar)** | `GOVERNANCE.md` §Role Model + `AGENT_RULES.md` | **None.** May propose; never bump. |

**Operational consequence:**

- A freeze bump that lacks a human-owner sign-off entry in `ARCHITECTURE_FREEZE.md` §Sign-Off is **not a freeze bump** — it is an unfinished commit, and the prior freeze ID still rules.
- An agent producing a PR that touches `FREEZE_v1.md` §6 (frozen invariants) without a human-owner-signed bump must be **rejected** at review per `HUMAN_BOUNDARIES.md` and `AGENT_RULES.md`.

---

## 3. Freeze Triggers — When a Bump Is Required

A freeze bump is required when, and only when, one of the following changes is staged:

| Trigger class | Concrete example | Bump scope |
|---------------|------------------|------------|
| **Invariant text change** | Edit to `FREEZE_v1.md` §6 (frozen invariants I-001..I-012 or equivalents); edit to `ARCHITECTURE_FREEZE.md` §Frozen Decisions F-001..F-010 | **Freeze ID bump** (e.g., `osctl-freeze/1.5` → `osctl-freeze/1.6`) + spec bump if event/state semantics change |
| **Canonical path change** | Move ledger or projections from `ops/state/...` to `ops/osctl/...` (or vice versa); change of `core/ledger/paths.py` defaults | **Freeze ID bump** + ADR entry referencing the new path |
| **Role-definition change** | Edit to `GOVERNANCE.md` Role Model; change to "Human production authority" wording in `HUMAN_BOUNDARIES.md` | **Freeze ID bump** |
| **Forbidden-capability change** | Edit to `NON_GOALS.md`; change to `HUMAN_BOUNDARIES.md` forbidden list; change to `TRUST_MODEL.md` non-claims | **Freeze ID bump** |
| **Event-type / state-machine change** | New event type beyond `deploy.recorded`, `rollback.recorded`, `reconcile.recorded`, `incident.recorded`; new transition in `STATE_MACHINE.md` | **Spec bump** (`osctl-core/1.0` → `osctl-core/1.1`) **+ freeze bump** |
| **Serialization rule change** | Edit to `SERIALIZATION_RULES.md` canonical bytes | **Spec bump + freeze bump** |
| **Verification semantics change** | New required verify layer in `VERIFY_MODEL.md`; relaxation of an existing layer | **Freeze bump** |
| **Replay determinism change** | Edit to `REPLAY_GUARANTEES.md` purity claim | **Freeze bump** |

A freeze bump is **not required** for any of the following (per `ARCHITECTURE_FREEZE.md` §Amendment Process last paragraph):

| Editorial change | Bump? |
|------------------|-------|
| Typo, grammar, formatting | No |
| Cross-link fix | No |
| Banner addition (SUPERSEDED / NON-AUTHORITATIVE / PRE-IMPLEMENTATION) per Round 3 §3 | No |
| Vocabulary sweep (`observed`/`marked` → `recorded`, `project` → `replay`, `Phase 3` → `Snapshot Layer (P1.5-S)`) per Round 3 §3 | No |
| Frontmatter rebadging (`**Status:** FROZEN`, `**Mode:** APPEND-ONLY`) | No |
| Core bug fix that restores documented behavior | No (per `ARCHITECTURE_FREEZE.md`) |

---

## 4. Freeze Bump Protocol — Step-by-Step

This is the operational sequence for a freeze bump. It performs exactly the steps `ARCHITECTURE_FREEZE.md` §Amendment Process enumerates, in execution order.

### 4.1 Pre-bump validation

| # | Step | Source | Required? |
|---|------|--------|-----------|
| 1 | Run `python ops/osctl/validation/run_validation.py` on current head | `ARCHITECTURE_FREEZE.md` §Validation Evidence | **Yes** — baseline must be PASS |
| 2 | Record current freeze ID and validation fingerprint in `ARCHITECTURE_DECISIONS.md` (new ADR draft) | `ARCHITECTURE_DECISIONS.md` (append-only) | **Yes** |
| 3 | Write proposal rationale (why this is not editorial; which trigger class from §3 applies) | `ARCHITECTURE_FREEZE.md` §Amendment Process step 1 | **Yes** |

### 4.2 Bump commit

| # | Step | Source | Required? |
|---|------|--------|-----------|
| 4 | Update validation scenarios for the new semantics under `ops/osctl/validation/scenarios/` | `ARCHITECTURE_FREEZE.md` step 2 | **Yes** if scenarios are affected |
| 5 | Spec version bump (e.g., `osctl-core/1.0` → `osctl-core/1.1`) — edit `EVENT_SCHEMA.md`, `core/schema/events.py`, and any header that pins the spec | `ARCHITECTURE_FREEZE.md` step 3 | **Yes** if §3 trigger is event/state/serialization |
| 6 | New freeze ID (e.g., `osctl-freeze/1.5` → `osctl-freeze/1.6`) — update `ARCHITECTURE_FREEZE.md` header, `FREEZE_v1.md` filename or supersession block, `GOVERNANCE.md` header, `README.md` header | `ARCHITECTURE_FREEZE.md` step 4 | **Yes** |
| 7 | Sign-off entry — append Owner + Reviewer rows in `ARCHITECTURE_FREEZE.md` §Sign-Off with date | `ARCHITECTURE_FREEZE.md` step 5 | **Yes** |
| 8 | Finalize the ADR draft from step 2 — record the bump, the changed files, and the rationale | `ARCHITECTURE_DECISIONS.md` | **Yes** |

### 4.3 Post-bump verification

| # | Step | Source | Required? |
|---|------|--------|-----------|
| 9 | Re-run `python ops/osctl/validation/run_validation.py` against the bumped state | `ARCHITECTURE_FREEZE.md` §Validation Evidence | **Yes** — must remain PASS or PASS-with-updated-scenarios |
| 10 | Append validation fingerprint to `validation/HASH_REGISTRY.md` (append-only) | `FREEZE_CANDIDATES.md` §4 | **Yes** |
| 11 | If bump renamed `FREEZE_v1.md` → `FREEZE_v1_6.md` (or kept name + added supersession block), update `README.md` link | `README.md` | **Yes** |
| 12 | Run round-trip read of `python -m ops.osctl.core verify` on production ledger; require exit 0 | `ARCHITECTURE_FREEZE.md` §Validation Evidence | **Yes** |

### 4.4 Atomicity

**The entire sequence is a single coherent change-set.** A freeze bump cannot be "partially applied." If steps 4–8 land in one commit but steps 9–12 fail, the commit must be reverted (`git revert`) — never patched forward with a half-bumped state. The lifecycle invariant L-4 from `GOVERNANCE_LIFECYCLE_MODEL.md` §3 holds: EDIT-RESTRICTED enters and exits only via complete freeze bump.

### 4.5 Bump cadence (recommendation, not rule)

| Bump type | Expected frequency | Driver |
|-----------|--------------------|--------|
| `osctl-freeze/1.5.X` (editorial patch) | As needed | Vocabulary sweep, banner application — but most editorial work doesn't need a bump (see §3) |
| `osctl-freeze/1.6` (minor) | Phase 2 entry | When CI observe-only ingest becomes binding |
| `osctl-freeze/1.7` (minor) | Phase 3 entry | When verify gate becomes binding |
| `osctl-freeze/2.0` (major) | Spec model break | If event-type set or state machine is redesigned |

No bump is required by **time alone**. Freeze is permanent until triggered.

---

## 5. Immutable Governance Sections (FROZEN Sub-Surface)

Sections of canonical and verdict files that are **immutable** even within EDIT-RESTRICTED files. Editing these is a freeze bump, full stop — no editorial exception.

| File | Immutable section(s) | Why |
|------|----------------------|-----|
| `ARCHITECTURE_FREEZE.md` | §Frozen Decisions (F-001..F-010); §Declaration; §This freeze does not authorize | Defines the freeze itself |
| `FREEZE_v1.md` | §6 Frozen Invariants (I-001..I-012 or canonical numbering); §1–§5 governing principles | The single canonical home for invariants per `SOURCE_OF_TRUTH_REDUCTION.md` §2.4 |
| `GOVERNANCE.md` | §Governance Principles; §Role Model; §Phase Alignment | The role model is the authority chain |
| `HUMAN_BOUNDARIES.md` | Forbidden-action lists; "Human production authority = permanent" line | The negative-authority claim |
| `NON_GOALS.md` | Every line (the doc is itself a frozen claim of negative scope) | Canonical for forbidden capabilities |
| `TRUST_MODEL.md` | Guarantees + non-claims | C-15 canonical |
| `EVENT_SCHEMA.md` | Closed event-type enum; field schemas marked `osctl-core/1.0` | Spec-pinned |
| `STATE_MACHINE.md` | Transition table | Spec-pinned |
| `LEDGER_MODEL.md` | Append-only invariant; canonical path declaration | Hard kernel invariant |
| `PROJECTION_RULES.md` | "Derived only — never authoritative" statement | Hard kernel invariant |
| `REPLAY_GUARANTEES.md` | Pure-fold-no-I/O statement | Hard kernel invariant |
| `SERIALIZATION_RULES.md` | Canonical JSON byte rules | Spec-pinned |
| `ROLLBACK_POLICY.md` | "Rollback = metadata, not automation" | Hard non-claim |
| `VERIFY_MODEL.md` | Verify layer list | Hard kernel invariant |
| `DRIFT_DETECTION.md` | Drift taxonomy + handling rules | Hard kernel invariant |
| All Round 1–5 `*_FINAL_VERDICT.md` and `GOVERNANCE_OPERATIONALIZATION_VERDICT.md` | Entire file body (verdicts are FROZEN per `FREEZE_CANDIDATES.md` §2) | Dated audit conclusion |

**Allowed in-place edits** (no bump): banner additions, link fixes, typos in non-invariant prose, restatement removal per `SOURCE_OF_TRUTH_REDUCTION.md` §2 (replacing prose with a cross-reference is editorial — provided the canonical content remains unchanged).

---

## 6. Allowed Evolution Boundaries (Per Document)

The complement of §5: what each canonical / scoped-supplement / active file **is permitted to evolve into** without a freeze bump.

| Tier | Files | Allowed evolution (no bump) |
|------|-------|-----------------------------|
| Canonical spec | C-1..C-11 | Cross-link fixes; typo fixes; banner additions; restatement-to-reference rewrites per `SOURCE_OF_TRUTH_REDUCTION.md` §2 |
| Canonical governance | C-12..C-15 | Same as above |
| Scoped supplements | `SNAPSHOT_*.md` | Snapshot-internal clarifications (format detail, retention numbers, failure-mode prose) provided they don't change the kernel claim |
| `ARCHITECTURE_DECISIONS.md` (APPEND-ONLY) | New ADRs appended | Free — that's the doc's purpose |
| `audit/FUTURE_RISK_REVIEW.md` (APPEND-ONLY) | New dated risks | Free |
| `validation/HASH_REGISTRY.md` (APPEND-ONLY) | New fingerprints | Free |
| `README.md` | Navigation reorganization (must stay ≤ 100 lines per `FREEZE_CANDIDATES.md` §6) | Free within the line cap |
| `CI_INTEGRATION_PLAN.md` | Phase 2 planning revisions while pre-implementation | Free (banner required per Round 3 §2) |
| Validation evidence (`VALIDATION_*.md`) | Regenerated by `run_validation.py` | Regeneration only, never manual policy injection |
| `ops/state/*.template.md`, `ops/rituals/*.md`, `ops/simulations/*.md` | Operator playbook updates | Free; not OSCTL authority |
| `AGENT_RULES.md` | Agent contract updates | Free; not OSCTL authority but agent-binding |
| `MASTER_CONTEXT.md` | Backend section: free. OSCTL section: must stay ≤ 8 lines + link to `ops/osctl/README.md` per Round 3 §6.5 | Free within constraint |

**Boundary rule:** If a proposed edit cannot be cleanly placed in any row of this table, the default is **freeze bump required.** When in doubt, bump.

---

## 7. Freeze Application Status (Snapshot — 2026-05-24)

This snapshot records what has and has not been freeze-bumped. It does not authorize any action.

| Freeze ID / spec | Status | Evidence | Next legal step |
|------------------|--------|----------|------------------|
| `osctl-freeze/1.5` | **DECLARED + VALIDATED** | `ARCHITECTURE_FREEZE.md` (2026-05-23); validation 19/19 PASS | Operate; no bump pending |
| `osctl-core/1.0` | **PINNED** | `EVENT_SCHEMA.md` + `core/schema/events.py` | Pin until Phase 2 |
| Sign-Off rows (Owner / Reviewer) | **PENDING** | `ARCHITECTURE_FREEZE.md` §Sign-Off shows `_pending_` | Human owner must add sign-off entry |
| Round 3 §6 freeze-related actions (banner additions on draft specs, AGENT_RULES verify-before-act) | **NOT APPLIED** (0/10 per Round 4 §3) | Files unchanged since Round 3 publication | Apply Round 3 §6 |
| `FREEZE_v1.md` §6 invariant restatement strip | **NOT APPLIED** | `audit/INVARIANT_REGISTRY.md` still restates | Editorial commit (no bump) |
| FULLY FROZEN headers on Round 1–4 verdict files | **NOT APPLIED** | Files lack explicit "Status: FROZEN" line | Editorial commit (no bump) |
| APPEND-ONLY headers on ADR / risk / hash registries | **NOT APPLIED** | Files lack `**Mode:** APPEND-ONLY` line | Editorial commit (no bump) |

**Net:** The freeze itself is valid. Six small editorial commits would bring the **freeze application state** in line with the **freeze classification state** documented in `FREEZE_CANDIDATES.md`. None of these commits require a bump.

---

## 8. Freeze Hygiene Loop (Maintenance Mode)

Operational loop that keeps the freeze coherent over time without requiring repeated audits. This is the day-to-day routine after Round 5 closes.

```text
                ┌───────────────────────────────────┐
                │   (1) Author proposes an edit     │
                └──────────────────┬────────────────┘
                                   │
                                   ▼
                ┌───────────────────────────────────┐
                │ (2) Classify per §3 (trigger?)    │
                └──────────────────┬────────────────┘
                                   │
                  trigger? ─── no ─┴─ yes ───┐
                       │                     │
                       ▼                     ▼
        ┌─────────────────────┐   ┌──────────────────────────┐
        │ (3a) Editorial PR   │   │ (3b) Freeze bump PR      │
        │  — no bump          │   │  — follow §4 protocol    │
        │  — validate after   │   │  — owner sign-off        │
        └─────────────────────┘   └──────────────────────────┘
                       │                     │
                       └──────────┬──────────┘
                                  ▼
                ┌───────────────────────────────────┐
                │ (4) Re-run run_validation.py      │
                │     Append HASH_REGISTRY.md       │
                └───────────────────────────────────┘
```

| Loop step | Owner | Tools | No-step automation |
|-----------|-------|-------|---------------------|
| (1) Author proposes edit | Any contributor (human or agent) | PR | Allowed |
| (2) Classify | Human reviewer | This document §3 | Allowed |
| (3a) Editorial PR | Any contributor + reviewer | PR | Allowed |
| (3b) Freeze bump PR | **Human owner only** | Protocol §4 | **Forbidden for agents** |
| (4) Validate + append HASH_REGISTRY | Human | `run_validation.py` | Read-only automation OK; append is human commit |

---

## 9. Freeze Drift Detection

Operational checks that detect when the freeze has drifted out of compliance. These are **lookup operations**, not new tools. They use existing canonical files.

| Drift class | Detection signal | Resolution |
|-------------|------------------|------------|
| Freeze ID mismatch across docs | `README.md` header says `1.5` but `GOVERNANCE.md` says `1.6` | Editorial commit aligning headers; **does not** authorize the higher ID unless §4 protocol completed |
| Invariant text edited without bump | Diff on `FREEZE_v1.md` §6 with no sibling ADR entry | Revert and re-PR through §4 protocol |
| Sign-off row missing on a bump | New freeze ID in headers, but `ARCHITECTURE_FREEZE.md` §Sign-Off rows still `_pending_` | Bump is invalid until sign-off row added |
| Spec/freeze version mismatch | `osctl-core/1.1` referenced in code but no `osctl-freeze/1.6` declared | Revert spec bump or complete freeze bump |
| Validation fingerprint missing | New freeze ID committed but no new entry in `validation/HASH_REGISTRY.md` | Append fingerprint or revert bump |
| Editorial edit improperly bumped | New freeze ID with only typo fixes | Revert bump (over-freeze risk) |

**Operational rule:** Drift is detected by **inspection of the canonical files** during code review. No new automation is required. `python ops/osctl/validation/run_validation.py` exit code is the final arbiter.

---

## 10. Freeze Policy Verdict

| Dimension | Verdict |
|-----------|---------|
| Freeze authority enumerated | **Yes** (Section 2) |
| Freeze triggers enumerated | **Yes** (Section 3 — 8 classes) |
| Freeze bump protocol fully specified | **Yes** (Section 4 — 12 steps, atomic) |
| Immutable sections named | **Yes** (Section 5 — per canonical file) |
| Allowed evolution boundaries named | **Yes** (Section 6 — per tier) |
| Current freeze application status known | **Yes** (Section 7) |
| Maintenance loop defined | **Yes** (Section 8) |
| Drift detection without new tooling | **Yes** (Section 9) |
| Round-5 introduces new freeze authority | **No** |
| Round-5 changes `osctl-freeze/1.5` | **No** |
| Round-5 requires deploy / CI / backend / package.json change | **No** |

**Net:** Freeze policy is **operationally complete and reversible.** Every step cites an existing canonical document. The freeze itself is unchanged.

This document is itself **FROZEN at publication** per `FREEZE_CANDIDATES.md` §2 and `GOVERNANCE_LIFECYCLE_MODEL.md` §4.4.
