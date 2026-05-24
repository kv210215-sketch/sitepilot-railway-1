# OSCTL Governance Maintenance Protocol

**Date:** 2026-05-24
**Audit cycle:** Round 5 — Governance Operationalization (strict, read-only, explicitly chartered per Round 4 §10 stop-rule exception)
**Authority of this document:** **Observation only — non-authoritative.** This file does not amend the freeze, define new policy, or grant any capability. It operationalizes the maintenance behaviors implied by Rounds 1–4 stop-rules and the freeze policy.
**Builds on:** `FREEZE_CANDIDATES.md` §8 (stop-rule), `GOVERNANCE_LIFECYCLE_MODEL.md` (this round), `FREEZE_POLICY_OPERATIONALIZATION.md` (this round), `SOURCE_OF_TRUTH_OPERATIONAL_GUIDE.md` (this round).

---

## 1. Purpose

After Round 5 closes, OSCTL governance must **operate as a maintained system** — not as a project that requires another audit round to resolve every question. This document operationalizes the maintenance behaviors needed to keep the corpus stable: how future audits are chartered, how phases get approved, how drift is detected, how recursive growth is prevented, and how duplicate truth is prevented from re-emerging.

This is **routine operations**, not architecture. No new authority. No new automation.

---

## 2. Maintenance Cadence

OSCTL governance is **event-driven, not time-driven**. There is no scheduled re-audit. The corpus is maintained when **one of the following events occurs**:

| Trigger | Maintenance response | Frequency expectation |
|---------|-----------------------|------------------------|
| Phase transition (1.5 → 2 → 3 → 4 per `GOVERNANCE.md` §Phase Alignment) | Phase entry checklist (§4 below) | ~1× per phase |
| Freeze-bump trigger fires (per `FREEZE_POLICY_OPERATIONALIZATION.md` §3) | Freeze bump protocol (§4 of that doc) | As needed; expected rare |
| Drift detected (per §6 of this doc) | Drift resolution loop (§6) | As detected |
| New kernel capability proposed | Reject (per `NON_GOALS.md`) **or** chartered phase work | Default reject |
| Operational incident affecting the kernel | Incident review → ADR entry → possible freeze bump | Per incident |
| Governance recursion warning (per §7) | Stop-rule application; no Round-N audit unless chartered | Continuous monitoring; rare invocation |
| Human owner requests a chartered audit | Round-N audit with explicit scope | At most 1× per 6 months recommended |

**No calendar maintenance.** The corpus is maintenance-mode quiet by default. Audits are exceptional.

---

## 3. Future-Audit Authorization Model

A future audit round may exist **only if** all of these conditions hold:

| Condition | Source |
|-----------|--------|
| **C-A. Explicit human-owner charter** | `GOVERNANCE.md` §Role Model + `ARCHITECTURE_FREEZE.md` §Sign-Off |
| **C-B. Charter references the most-recent verdict** | `FREEZE_CANDIDATES.md` §8.1 |
| **C-C. Charter names the cap-exit being invoked** | Verdict cap (§8.1), registry replacement (§8.2), plan replacement (§8.3) |
| **C-D. Charter declares which prior artefact is being superseded or moved to archive** | `ARCHIVE_RECOMMENDATIONS.md` + this protocol §5 |
| **C-E. Charter declares the strict-mode constraints (read-only, no deploy, no CI, no kernel)** | This protocol §10 + prior rounds' strict-mode summaries |

**Authorization sequence:**

```text
(1) Human owner identifies maintenance need
        │
        ▼
(2) Owner writes a charter (≤ 1 page) that includes:
       - The trigger (which event from §2)
       - The named cap-exit (§8.1 / §8.2 / §8.3)
       - The artefact being superseded
       - Scope, strict-mode constraints, deliverables
        │
        ▼
(3) Owner signs the charter and stores it in
    ops/osctl/audit/<round>/CHARTER.md or as a
    sign-off entry in ARCHITECTURE_FREEZE.md §Sign-Off
        │
        ▼
(4) Audit round executes inside the charter's scope
        │
        ▼
(5) Round closes with a single verdict file that
    explicitly supersedes one prior verdict (per cap)
        │
        ▼
(6) Superseded verdict moves FROZEN → ARCHIVED
    in the same commit as new verdict publication
```

**No agent has authority to charter an audit round.** Agents may produce a charter **draft**; only a human owner's sign-off is authorization.

**Default disposition for an uncharter audit attempt:** rejection at review. The PR introducing the audit files is closed without merge. The contributor is directed to this §3.

---

## 4. Phase Approval Model

Phase transitions (per `GOVERNANCE.md` §Phase Alignment + `ARCHITECTURE_FREEZE.md` §Phase Gate) are the **only** governance events that justify a freeze bump beyond corrective work. The approval model:

| Phase | Entry condition (canonical) | Approval evidence |
|-------|------------------------------|--------------------|
| **1.5 (now)** | Freeze declared; core validated | `ARCHITECTURE_FREEZE.md` (declared 2026-05-23) + `validation/VALIDATION_REPORT.md` 19/19 PASS |
| **2** | Human approves CI observe-only ingest plan | Owner sign-off on a Phase-2 ADR entry; new `osctl-freeze/1.6`; updated validation scenarios |
| **3** | Projections stable; verify gate policy defined | Owner sign-off on a Phase-3 ADR; new `osctl-freeze/1.7`; verify-gate scenarios added |
| **4** | Ledger sync policy — still not deploy orchestration | Owner sign-off; new `osctl-freeze/1.8`; sync-policy scenarios |

**Phase-entry checklist** (Round 5 specifies the operational sequence, not the gate criteria):

1. Confirm prior phase's exit criteria satisfied (cite the canonical line in `GOVERNANCE.md` §Phase Alignment).
2. Draft phase entry ADR in `ARCHITECTURE_DECISIONS.md` (APPEND-ONLY append, not edit of prior ADRs).
3. Update validation scenarios for the new phase's invariants under `ops/osctl/validation/scenarios/`.
4. Re-run `python ops/osctl/validation/run_validation.py`; require PASS.
5. Bump freeze ID per `FREEZE_POLICY_OPERATIONALIZATION.md` §4.
6. Owner + Reviewer sign-off rows added in `ARCHITECTURE_FREEZE.md` §Sign-Off.
7. Append validation fingerprint to `validation/HASH_REGISTRY.md`.
8. Update `GOVERNANCE.md` §Phase Alignment "now" indicator and `README.md` Phase Status.

**A phase transition is exactly one freeze bump.** It is not a "new round." It does not produce a new `*_FINAL_VERDICT.md` file.

---

## 5. Stop-Rule Reaffirmation (Operational Form)

`FREEZE_CANDIDATES.md` §8 declares the stop-rule. Round 5 restates it operationally as a **PR-time review checklist**.

A reviewer reading a PR that touches `ops/osctl/audit/` or adds a governance file applies this checklist:

| Check | If FAIL |
|-------|---------|
| Is this PR adding a `*_FINAL_VERDICT.md`? | Only if the prior round's verdict moves FROZEN → ARCHIVED in the same commit, AND a human-owner-signed charter exists. Otherwise REJECT. |
| Is this PR adding a `*_REGISTRY.md`? | Only if it replaces an existing R-1..R-5 (per `SOURCE_OF_TRUTH_OPERATIONAL_GUIDE.md` §3), with the replaced registry archived in the same commit. Otherwise REJECT. |
| Is this PR adding a `*_PLAN.md` to `audit/`? | Only if active plans count would remain ≤ 2 (§8.3). Otherwise REJECT or require a prior plan be archived. |
| Is this PR adding a sub-folder under `ops/osctl/` other than `archive/`? | REJECT — requires freeze bump (§8.4). |
| Is this PR adding a layer under `ops/osctl/core/`? | REJECT — requires freeze bump (§8.5). |
| Is this PR creating a new "authority document" (anything claiming policy) outside the 15 canonical files? | REJECT (§8.6). |
| Is this PR an editorial commit (banner, link, typo, restatement removal)? | ACCEPT after lint/validation. |
| Is this PR a freeze bump? | Validate per `FREEZE_POLICY_OPERATIONALIZATION.md` §4 protocol. Reject if sign-off rows missing or HASH_REGISTRY not appended. |

**The reviewer is a human.** No CI gate is required; the stop-rule is a review-discipline rule, not a tooling rule.

---

## 6. Governance Drift Detection

Drift is governance content that has slipped out of compliance with the canonical statements. Round 4 named drift classes; Round 5 operationalizes detection.

| Drift class | Detection signal | Detection cost | Resolution |
|-------------|------------------|----------------|------------|
| **D-1. Freeze-ID mismatch across headers** | `grep -r osctl-freeze` shows ≥ 2 distinct IDs in `ops/osctl/**/*.md` | 1 grep | Editorial alignment commit; if values diverge by major version, halt and engage human owner |
| **D-2. Restatement re-emergence** | Per `SOURCE_OF_TRUTH_OPERATIONAL_GUIDE.md` §7 — a non-canonical doc restates a canonical concept | Review-time check | Convert RESTATE → REFERENCE |
| **D-3. Spec/freeze version mismatch** | `osctl-core/X` in code but no matching `osctl-freeze/Y` in declaration | Code-vs-doc diff | Revert or complete freeze bump |
| **D-4. Active plans exceed 2** | `ls audit/*_PLAN.md` returns > 2 | Listing | Archive oldest plan |
| **D-5. Active audit files exceed 10** | `ls audit/` (excluding archive/) returns > 10 | Listing | Apply archive moves per `ARCHIVE_RECOMMENDATIONS.md` |
| **D-6. Active root spec exceeds 20** | `ls ops/osctl/*.md` (excluding subfolders) > 20 | Listing | Archive draft specs per `ARCHIVE_RECOMMENDATIONS.md` §3 |
| **D-7. Vocabulary drift (`.observed`/`.marked`/`project`/Phase 3)** | Grep across rituals + simulations + README | 3 greps | Vocab sweep editorial commit |
| **D-8. New file under `ops/osctl/` (not in canonical set)** | Diff against `CANONICAL_GOVERNANCE_MAP.md` §2 + scoped supplements list | Listing | Stop-rule rejection or freeze bump |
| **D-9. Validation regression** | `python ops/osctl/validation/run_validation.py` exits non-zero | Single command | Halt; engage human owner; do not proceed with merges |
| **D-10. Sign-off rows missing for declared freeze** | Header says new freeze ID but `ARCHITECTURE_FREEZE.md` §Sign-Off still `_pending_` | Inspection | Revert bump or complete sign-off |

**Detection ownership:** Code review (D-1..D-8 + D-10) and `run_validation.py` (D-9). No new automation required.

**Detection cadence:** Per-PR. Maintenance does not require a periodic sweep beyond what review naturally produces.

---

## 7. Recursive Growth Prevention

Audit recursion was the primary entropy vector through Rounds 1–4 (per `ARCHITECTURAL_ENTROPY_REPORT.md`). Round 4 §8 capped audit file count. Round 5 operationalizes the cap as a **bounded counter**.

| Counter | Cap | Current value (post Round 5) | Action on breach |
|---------|-----|------------------------------|-------------------|
| `audit/*_FINAL_VERDICT.md` (excl. this round) | 4 | 5 (Rounds 1–5) — this round is the **final** chartered audit; future verdicts require prior to ARCHIVE | If breached: oldest moves FROZEN → ARCHIVED in same commit |
| `audit/*_VERDICT.md` (all forms) | 5 | 5 (Rounds 1–5) | Same — supersession only |
| `audit/*_PLAN.md` (active) | 2 | 1 (`GOVERNANCE_REDUCTION_PLAN.md`) | Reject new plan until ≤ 1 |
| `audit/*_REGISTRY.md` (active) | 1 in `audit/` | 1 (`INVARIANT_REGISTRY.md` once stripped) | Reject new registry |
| Active `audit/` file count (post-archive) | 10 | Pending: post archive ~6–9 | If breached: apply archive moves per `ARCHIVE_RECOMMENDATIONS.md` |
| Sub-folders under `ops/osctl/` | `core/`, `audit/`, `validation/`, `snapshots/`, `examples/`, `ledger/`, `projections/`, `archive/` (planned) | 7 today + 1 planned (archive) = 8 | No new sub-folder without freeze bump |
| New `ops/state/` governance docs (not templates) | 0 | 1 (`GOVERNANCE.md` → REDIRECT pending per Round 3) | No new authority docs in `ops/state/` |

**Recursion prevention is enforced by**:

1. The **stop-rule** in `FREEZE_CANDIDATES.md` §8.
2. The **PR-time review checklist** in §5 of this doc.
3. The **lifecycle invariants** in `GOVERNANCE_LIFECYCLE_MODEL.md` §3 (FROZEN → ACTIVE forbidden; ARCHIVED → anything forbidden).
4. The **default rejection** of any uncharter Round-N audit attempt.

---

## 8. Duplicate-Truth Prevention

Duplicate truth surfaces (multiple docs asserting the same canonical rule) is the second entropy vector. Round 4 (`SOURCE_OF_TRUTH_REDUCTION.md`) named the dispositions. Round 5 operationalizes prevention.

| Prevention mechanism | Where it lives | When it fires |
|----------------------|----------------|---------------|
| **Canonical entrypoint cap (3)** | `SOURCE_OF_TRUTH_OPERATIONAL_GUIDE.md` §2 | Reviewer rejects new "master" or "central" doc |
| **Canonical registry cap (5)** | §3 of that doc + this protocol §7 counter | Reviewer rejects new registry not replacing one of R-1..R-5 |
| **RESTATE → REFERENCE rule** | `SOURCE_OF_TRUTH_REDUCTION.md` §1 | Reviewer flags any restatement of a §2 truth concept |
| **Terminology ownership table** | `SOURCE_OF_TRUTH_OPERATIONAL_GUIDE.md` §6 + `TERMINOLOGY_NORMALIZATION.md` | Reviewer rejects synonyms for owned terms |
| **`SOURCE_OF_TRUTH_OPERATIONAL_GUIDE.md` §7 checklist** | Per-PR | Reviewer applies 10 single-source checks |
| **Lifecycle state forbids new EDIT-RESTRICTED docs** | `GOVERNANCE_LIFECYCLE_MODEL.md` §6 | New canonical doc requires freeze bump |

**Operational rule:** A doc whose body would, if accepted, cause any of `SOURCE_OF_TRUTH_OPERATIONAL_GUIDE.md` §7 to fail is rejected without further review. Conversion to a one-line `REFERENCE` (cross-link to canonical) is offered.

---

## 9. Maintenance Roles (Human Discipline, Not Automation)

The maintenance loop is fully human-owned. Each maintenance behavior has a default owner.

| Behavior | Default owner | Tool |
|----------|---------------|------|
| PR review against stop-rule checklist (§5) | Reviewer | This protocol |
| Drift detection (§6) | Reviewer | `grep`, `ls`, `run_validation.py` |
| Phase entry (§4) | **Human owner** | `FREEZE_POLICY_OPERATIONALIZATION.md` §4 protocol |
| Freeze bump (§3 of FREEZE_POLICY_OPERATIONALIZATION) | **Human owner** | Same |
| Archive moves (per `ARCHIVE_RECOMMENDATIONS.md`) | Human (any contributor with reviewer sign-off) | `git mv` |
| Charter authorship for future audits | **Human owner** | This protocol §3 |
| Editorial sweep (banners, vocabulary) | Any contributor + reviewer | PR |
| Validation re-run | Any contributor | `run_validation.py` |
| Hash-registry append | Human (post-bump) | Editor + commit |
| Stop-rule enforcement on agent-authored PRs | Reviewer | Reject or downgrade to draft |

**No role is automatable.** OSCTL `core/` does not maintain the corpus — it maintains the ledger.

---

## 10. Maintenance Constraints (Strict-Mode, Continuous)

These constraints apply not only to Round 5 itself but to **all maintenance work after Round 5 closes**.

| Constraint | Status |
|------------|--------|
| Maintenance never modifies `ops/osctl/core/` (kernel) | Hard |
| Maintenance never touches `backend/` | Hard |
| Maintenance never modifies CI workflows (`.github/workflows/*`) | Hard |
| Maintenance never modifies `package.json` | Hard |
| Maintenance never deploys to Railway / Cloudflare / any infra | Hard |
| Maintenance never autonomous (agent-initiated, agent-signed) | Hard |
| Maintenance never mutates production ledger (`events.jsonl`) outside `append` semantics | Hard (kernel-enforced) |
| Maintenance never adds new orchestration capability | Hard (`NON_GOALS.md` + stop-rule §8.5) |
| Maintenance never adds new authority document | Hard |
| Maintenance always runs `run_validation.py` before merging | Soft (review-enforced) |
| Maintenance always preserves git history (`git mv`, never copy-delete) | Soft (review-enforced) |
| Maintenance always editorial-by-default; freeze-bump only on triggers | Hard (per `FREEZE_POLICY_OPERATIONALIZATION.md` §3) |

---

## 11. Maintenance Verdict

| Dimension | Verdict |
|-----------|---------|
| Maintenance is event-driven (not time-driven) | **Yes** (Section 2) |
| Future audits require explicit charter | **Yes** (Section 3) |
| Phase approval has a single operational sequence | **Yes** (Section 4) |
| Stop-rule operationalized as a PR-time review checklist | **Yes** (Section 5) |
| Drift detection has 10 classes, all detectable with existing tools | **Yes** (Section 6) |
| Recursive growth bounded by explicit counters | **Yes** (Section 7) |
| Duplicate-truth prevented by 6 review mechanisms | **Yes** (Section 8) |
| Every maintenance role is human | **Yes** (Section 9) |
| Strict-mode constraints continuous (not Round-5-only) | **Yes** (Section 10) |
| Round-5 adds new authority | **No** |
| Round-5 adds new automation | **No** |

**Net:** The corpus is **maintainable in routine mode** without further audit rounds. Every future event either fits within a defined behavior (editorial PR, phase bump, archive) or triggers an explicitly chartered Round-N — which itself is bounded by the cap-exit conditions of §3 and §5.

This document is itself **FROZEN at publication**.
