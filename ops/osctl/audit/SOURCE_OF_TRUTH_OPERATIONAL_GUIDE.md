# OSCTL Source-of-Truth Operational Guide

**Date:** 2026-05-24
**Audit cycle:** Round 5 — Governance Operationalization (strict, read-only, explicitly chartered per Round 4 §10 stop-rule exception)
**Authority of this document:** **Observation only — non-authoritative.** This file does not amend the freeze, define new policy, or grant any capability. It operationalizes the canonical map already published in `CANONICAL_GOVERNANCE_MAP.md` §2 and the reduction log in `SOURCE_OF_TRUTH_REDUCTION.md` §2.
**Builds on:** `CANONICAL_GOVERNANCE_MAP.md`, `SOURCE_OF_TRUTH_REDUCTION.md`, `SOURCE_OF_TRUTH_MAP.md`, `GOVERNANCE.md`, `README.md`, `GOVERNANCE_LIFECYCLE_MODEL.md` (this round), `FREEZE_POLICY_OPERATIONALIZATION.md` (this round).

---

## 1. Purpose

A human or agent opening this repository must answer one operational question quickly: **"For concept X, where does the canonical statement live?"**

Round 3 (`SOURCE_OF_TRUTH_MAP.md`) catalogued where duplications exist. Round 4 (`SOURCE_OF_TRUTH_REDUCTION.md`) named the removals that collapse those duplications. Round 5 specifies the **forward operational guide**: how a reader navigates from a question to the canonical answer, and how a writer prevents new duplication.

This is **the navigation contract**, not new architecture. It changes nothing in the canonical set or the freeze.

---

## 2. Canonical Entrypoints (3 — Closed Set)

A reader entering the corpus uses one of exactly three entrypoints. There is no fourth.

| Entrypoint | File | Role | What it answers |
|-----------|------|------|-----------------|
| **E-1. Navigation** | `ops/osctl/README.md` | Quick-reference table of canonical docs, CLI, paths | "Where do I look?" |
| **E-2. Governance** | `ops/osctl/GOVERNANCE.md` | Role model, principles, document hierarchy, phase alignment | "Who owns what? What may agents/CI/OSCTL/humans do?" |
| **E-3. Trust** | `ops/osctl/TRUST_MODEL.md` | Guarantees + non-claims | "What does OSCTL promise — and explicitly not promise?" |

**Forbidden alternative entrypoints:**

- Root `MASTER_CONTEXT.md` — backend-focused; OSCTL section is a **navigation pointer only** (must stay ≤ 8 lines per Round 3 §6.5, banner per Round 3 §3.2). Never the answer.
- Root `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` — banner-marked NON-AUTHORITATIVE per Round 3 §3.2.
- `ops/state/GOVERNANCE.md` — REDIRECT to `ops/osctl/GOVERNANCE.md` per Round 3 §2 action #4.
- `ops/osctl/audit/*` — observations only; never authority.

---

## 3. Canonical Registries (5 — Closed Set)

The corpus contains exactly five registries. Each has a single canonical home; every other doc references rather than restates.

| Registry | Canonical home | Lifecycle state | Operational use |
|----------|----------------|-----------------|-----------------|
| **R-1. Frozen invariants (I-001..I-012)** | `ops/osctl/FREEZE_v1.md` §6 | EDIT-RESTRICTED (freeze-bump gated) | Authoritative invariant text |
| **R-2. Architectural decisions (ADR-XXX)** | `ops/osctl/ARCHITECTURE_DECISIONS.md` | APPEND-ONLY | History of design choices |
| **R-3. Validation fingerprints** | `ops/osctl/validation/HASH_REGISTRY.md` | APPEND-ONLY | Determinism + freeze-bump evidence |
| **R-4. Future risks** | `ops/osctl/audit/FUTURE_RISK_REVIEW.md` | APPEND-ONLY | Forward-looking risk catalogue |
| **R-5. Terminology** | `ops/osctl/audit/TERMINOLOGY_NORMALIZATION.md` | FROZEN after vocab sweep | Canonical vocabulary |

**Per `FREEZE_CANDIDATES.md` §8.2:** No new `*_REGISTRY.md` may be created unless replacing one of R-1..R-5 in scope.

---

## 4. Canonical Governance Chain

The authority chain is fully declared in `GOVERNANCE.md` §Role Model. Round 5 collapses it into a single navigable chain for operational use.

```text
                ┌──────────────────────────────┐
                │  Human owner (production)    │  ← highest authority
                │  per HUMAN_BOUNDARIES.md     │
                │  + GOVERNANCE.md §Role Model │
                └──────────────┬───────────────┘
                               │ delegates
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
       │ Human       │  │ CI (GHA)    │  │ OSCTL core  │
       │ reviewer    │  │ build +     │  │ append +    │
       │ (sign-off)  │  │ deploy +    │  │ fold +      │
       │             │  │ observe-    │  │ verify      │
       │             │  │ only ingest │  │             │
       └─────────────┘  └─────────────┘  └─────────────┘
                               │
                               ▼
                       ┌─────────────┐
                       │ Agents      │  ← advisory only
                       │ (Cursor /   │     no prod authority
                       │  Claude /   │     per AGENT_RULES.md
                       │  others)    │
                       └─────────────┘
```

| Question | Lookup path |
|----------|-------------|
| "May this actor do X?" | `HUMAN_BOUNDARIES.md` (allowed/forbidden tables) → `NON_GOALS.md` (negative scope) → `BOUNDARIES.md` (platform ownership) |
| "What is OSCTL's role?" | `GOVERNANCE.md` §Role Model |
| "What freeze rules?" | `ARCHITECTURE_FREEZE.md` + `FREEZE_v1.md` |
| "What can the kernel do?" | `TRUST_MODEL.md` (guarantees) + `NON_GOALS.md` (non-claims) |

---

## 5. Canonical Authority Path — Per Operational Decision

For each common operational decision, this table names the canonical files in the order a human/agent should read. **Two-file maximum** per decision (per `HUMAN_MAINTAINABILITY_REPORT.md` §7).

| Operational decision | Canonical lookup (in order) | OK? |
|----------------------|------------------------------|-----|
| **Append an event** | `EVENT_SCHEMA.md` → `LEDGER_MODEL.md` | **Yes** |
| **Run verify** | `VERIFY_MODEL.md` | **Yes** |
| **Trust a projection** | `VERIFY_MODEL.md` → `AGENT_RULES.md` (verify-first, per Round 3 §3.1 once applied) | **Yes** |
| **Decide an action is allowed** | `HUMAN_BOUNDARIES.md` → `NON_GOALS.md` | **Yes** |
| **Trigger rollback** | `ROLLBACK_POLICY.md` (rollback = metadata, not automation) | **Yes** |
| **Detect drift** | `DRIFT_DETECTION.md` | **Yes** |
| **Use a snapshot** | `SNAPSHOT_TRUST_BOUNDARIES.md` → `SNAPSHOT_ARCHITECTURE.md` | **Yes** |
| **Identify the current phase** | `GOVERNANCE.md` §Phase Alignment | **Yes** |
| **Choose canonical ledger path** | `LEDGER_MODEL.md` → `core/ledger/paths.py` (post Round 3 §10 Option L) | **Conditional** — pending path decision |
| **Look up a CLI command** | `ops/osctl/README.md` → `core/cli/main.py` (post vocab sweep) | **Conditional** — pending sweep |
| **Freeze-bump a canonical doc** | `ARCHITECTURE_FREEZE.md` §Amendment Process → `FREEZE_POLICY_OPERATIONALIZATION.md` §4 (this round) | **Yes** |
| **Decide if an audit file has authority** | `GOVERNANCE_LIFECYCLE_MODEL.md` §2 (this round) — answer is always "no" | **Yes** |
| **Decide if a root MD has authority** | `CANONICAL_GOVERNANCE_MAP.md` §7 — answer is "no" | **Yes** |

**Decision-chain score (this round):** **11 of 13 decisions reach two-file canonical clarity.** Two remain conditional on prior-round actions (path decision, vocab sweep) — both already specified, both human-owned to execute.

---

## 6. Canonical Terminology Ownership

Vocabulary that has historically diverged across docs. Single owner per term per `TERMINOLOGY_NORMALIZATION.md`.

| Term | Canonical home | Forbidden synonyms | Notes |
|------|----------------|--------------------|-------|
| Event suffixes (`.recorded`) | `EVENT_SCHEMA.md` | `.observed`, `.marked` (draft-only, banner-marked in archive) | Vocab sweep required in rituals/simulations per Round 3 §3 |
| CLI verbs (`append`, `replay`, `verify`) | `core/cli/main.py` + `README.md` | `project` (legacy README), `ingest` (draft) | Vocab sweep required per Round 3 §3 |
| Phase labels (1, 1.5, 1.5-S, 2, 3, 4) | `GOVERNANCE.md` §Phase Alignment | "Phase 3" used loosely for snapshot layer (rename to "P1.5-S") per Round 3 §6.7 |
| Freeze ID (`osctl-freeze/X.Y`) | `ARCHITECTURE_FREEZE.md` header | Stale labels in `ARCHITECTURE_DECISIONS.md`, `CI_INTEGRATION_PLAN.md` (one-time bump per Round 3 §6.8) |
| Spec version (`osctl-core/X.Y`) | `EVENT_SCHEMA.md` + `core/schema/events.py` | None — keep pinned |
| "Trust kernel" | `TRUST_MODEL.md` | "Coordination layer" (never built; stop-rule §8.5) |
| "Ledger" / "Projections" | `LEDGER_MODEL.md` / `PROJECTION_RULES.md` | "State" used ambiguously in root MDs (banner-marked) |
| "Snapshot" | `SNAPSHOT_*.md` scoped supplements | "Cache" (forbidden — kernel has no hidden mutable cache; see `MASTER_CONTEXT.md` forbidden list and `NON_GOALS.md`) |

**Ownership rule:** Any document introducing a synonym for a term in this table must instead use the canonical term. New terms require an ADR entry (`ARCHITECTURE_DECISIONS.md`) before being added.

---

## 7. Single-Source Compliance — Operational Lookup

Per `SOURCE_OF_TRUTH_REDUCTION.md` §4, the corpus has 10 truth concepts. Round 5 lists them as an operational checklist a reviewer can apply to any new doc.

| # | Concept | Canonical | "Is this commit OK?" check |
|---|---------|-----------|-----------------------------|
| 1 | Ledger authority | `LEDGER_MODEL.md` | Does the new doc REFERENCE rather than RESTATE this? |
| 2 | Trust kernel | `TRUST_MODEL.md` | Does the new doc REFERENCE rather than RESTATE? |
| 3 | Snapshot non-authority | `SNAPSHOT_TRUST_BOUNDARIES.md` | Does the new doc REFERENCE? |
| 4 | Frozen invariants | `FREEZE_v1.md` §6 | Does the new doc REFERENCE? |
| 5 | Event types | `EVENT_SCHEMA.md` | Does the new doc use `.recorded` suffix only? |
| 6 | Ledger / projection paths | `LEDGER_MODEL.md` + `PROJECTION_RULES.md` (post Option L) | Does the new doc cite only the canonical path? |
| 7 | CLI surface | `core/cli/main.py` + `README.md` (post sweep) | Does the new doc use `replay`, not `project`? |
| 8 | Phase roadmap | `GOVERNANCE.md` §Phase Alignment | Does the new doc reference the canonical phase table? |
| 9 | Human authority | `HUMAN_BOUNDARIES.md` | Does the new doc REFERENCE rather than restate? |
| 10 | Validation evidence | `validation/VALIDATION_REPORT.md` + `SUMMARY.md` | Does the new doc cite the report, not restate "19/19 PASS"? |

A doc that fails any of these is asked to **convert RESTATE → REFERENCE** per `SOURCE_OF_TRUTH_REDUCTION.md` §1.

---

## 8. Navigation Patterns (Operator Workflows)

Three operational workflows that exercise the canonical entrypoints. Each is meant to complete in ≤ 5 minutes for a returning operator.

### 8.1 Pattern A — "I need to act on an event"

```text
1. Open ops/osctl/README.md
2. README.md → LEDGER_MODEL.md  (path of canonical ledger)
3. README.md → EVENT_SCHEMA.md   (event types I may write)
4. README.md → HUMAN_BOUNDARIES.md  (am I allowed to perform this action?)
5. Run python -m ops.osctl.core append --file event.json
6. Run python -m ops.osctl.core verify
7. Trust projections iff verify exit 0  (per TRUST_MODEL.md + VERIFY_MODEL.md)
```

Touched canonical files: 5. Required reading: README + 4 canonicals.

### 8.2 Pattern B — "I need to know if an agent may do this"

```text
1. Open ops/osctl/README.md
2. README.md → HUMAN_BOUNDARIES.md
3. Cross-check NON_GOALS.md if the action could be forbidden
4. Stop. Decision is final.
```

Touched canonical files: 3 (incl. README).

### 8.3 Pattern C — "I need to propose a change to a canonical file"

```text
1. Open ops/osctl/README.md
2. README.md → ARCHITECTURE_FREEZE.md §Amendment Process
3. FREEZE_POLICY_OPERATIONALIZATION.md §3 (this round) — is it a trigger?
4. If yes: §4 protocol. If no: editorial commit.
5. Re-run python ops/osctl/validation/run_validation.py
6. If bump: append HASH_REGISTRY.md.
```

Touched canonical files: 2 + 2 supporting docs. Process is single-page.

---

## 9. Anti-Patterns (Detected — Bounded by This Guide)

Source-of-truth anti-patterns the corpus has shown, and the operational rule that prevents recurrence.

| Anti-pattern | Where seen | Operational rule |
|--------------|------------|------------------|
| "Master context" used as authority | `MASTER_CONTEXT.md` OSCTL section restates kernel claims | §2: only 3 canonical entrypoints; root MDs are non-authoritative |
| Two `GOVERNANCE.md` files | `ops/osctl/` + `ops/state/` | §2: `ops/state/GOVERNANCE.md` is REDIRECT only |
| Two `TRUST_MODEL.md` files | `ops/osctl/` + `validation/` | §3: only one canonical; validation copy is REDIRECT (Round 3 §2 action #5) |
| Capability matrix parallel to authority doc | `snapshots/CAPABILITY_MATRIX.md` ≠ `HUMAN_BOUNDARIES.md` | §6: merge planned per Round 4 `GOVERNANCE_REDUCTION_PLAN.md` §3 |
| Future-risks register parallel to audit register | `snapshots/FUTURE_RISKS.md` ≠ `audit/FUTURE_RISK_REVIEW.md` | §3 R-4: single register; merge planned |
| Phase number collides ("Phase 3") | `snapshots/PHASE3_FINAL_REVIEW.md` vs `GOVERNANCE.md` "Phase 3" | §6: rename to P1.5-S per Round 3 §6.7 |
| Audit file used as policy | Round 1–4 audit docs occasionally imperative | §2 + `GOVERNANCE_LIFECYCLE_MODEL.md` L-1: FROZEN observations are not authority |
| Implicit "read first" grant in agent rules | `AGENT_RULES.md` says "Read first" without verify-first | Round 3 §3.1 EDIT: require VERIFY before ACT |

---

## 10. Operational Verdict

| Dimension | Verdict |
|-----------|---------|
| Canonical entrypoints enumerated and capped | **Yes** (Section 2 — 3 entrypoints) |
| Canonical registries enumerated and capped | **Yes** (Section 3 — 5 registries) |
| Authority chain operationally navigable | **Yes** (Section 4) |
| Each operational decision has a ≤ 2 file lookup | **11 of 13** unconditional (Section 5) |
| Terminology owners named | **Yes** (Section 6) |
| Compliance check fits one page | **Yes** (Section 7) |
| Navigation patterns ≤ 5 min each | **Yes** (Section 8) |
| Anti-patterns each bounded by an operational rule | **Yes** (Section 9) |
| Round-5 adds new canonical authority | **No** |
| Round-5 changes the canonical set | **No** |
| Round-5 changes the freeze | **No** |

**Net:** The source-of-truth corpus is **operationally navigable from three entrypoints, with every decision answerable from ≤ 2 canonical files**, provided the conditional items (path decision, vocab sweep) are applied by the human owner. No new authority required.

This document is itself **FROZEN at publication**.
