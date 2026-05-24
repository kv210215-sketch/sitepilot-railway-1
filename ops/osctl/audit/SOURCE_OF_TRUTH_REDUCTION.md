# OSCTL Source-of-Truth Reduction

**Date:** 2026-05-24
**Audit cycle:** Round 4 — Canonical Governance Reduction (strict, read-only)
**Authority of this document:** Observation only — non-authoritative.
**Builds on:** Round 3 `SOURCE_OF_TRUTH_MAP.md` (which catalogues canonicals); this file specifies **what gets removed from secondary docs** so the canonical is the only place the rule lives.

---

## 1. Reduction Principle

A concept has one canonical doc (per `CANONICAL_GOVERNANCE_MAP.md` Section 2). Every other doc that **restates** that concept must instead **reference** it by a one-line cross-link.

Round 3 identified *where* duplication lives. Round 4 specifies *what to remove* and *what to leave* in each secondary doc.

| Term | Meaning |
|------|---------|
| **RESTATE** | Secondary doc re-asserts the rule in its own words |
| **REFERENCE** | Secondary doc says "see canonical X" and nothing more |
| **SCOPE-CITE** | Secondary doc applies the canonical rule to its scoped sub-layer, citing canonical for the general rule |

Goal: **every general OSCTL rule appears as a RESTATE in exactly one file.**

---

## 2. Restatement Removal Log

Each row identifies one canonical statement and lists where it is currently restated. The "Action" column says what to do in each secondary file.

### 2.1 "Ledger is authoritative / source of truth"

| File | Current state | Round-4 action |
|------|----------------|-----------------|
| `LEDGER_MODEL.md` | RESTATE | **KEEP** — single canonical home |
| `TRUST_MODEL.md` (osctl) | RESTATE | **REFERENCE** — cite `LEDGER_MODEL.md` |
| `validation/TRUST_MODEL.md` | RESTATE (duplicate file) | **REDIRECT** entire body (Round 3 §2 action #5) |
| `GOVERNANCE.md` (osctl) | RESTATE | **REFERENCE** |
| `ops/state/GOVERNANCE.md` | RESTATE | **REDIRECT** entire body (Round 3 §2 action #4) |
| `BOUNDARIES.md` | RESTATE | **REFERENCE** |
| `HUMAN_BOUNDARIES.md` | RESTATE | **REFERENCE** |
| `FREEZE_v1.md` §1 | RESTATE (prose) | **REPLACE** prose with table-cell cite to `LEDGER_MODEL.md` |
| `snapshots/SNAPSHOT_TRUST_BOUNDARIES.md` | SCOPE-CITE (acceptable) | **KEEP** |
| `snapshots/SNAPSHOT_ARCHITECTURE.md` | RESTATE | **REFERENCE** |
| `snapshots/AGENT_AUTHORITY_MAP.md` | RESTATE | **REFERENCE** then merge per `GOVERNANCE_REDUCTION_PLAN.md` §3 |
| `snapshots/CAPABILITY_MATRIX.md` | RESTATE | **REFERENCE** then merge per §3 |
| `MASTER_CONTEXT.md` | RESTATE | **REFERENCE** in trimmed OSCTL section (Round 3 §6.5) |
| 7× audit files | RESTATE | **REFERENCE** — but most audit files are being archived per `GOVERNANCE_REDUCTION_PLAN.md` §4 |

**Net effect:** "Ledger is authoritative" exists as a RESTATE in **1 file** (LEDGER_MODEL.md), as a SCOPE-CITE in **1 file** (SNAPSHOT_TRUST_BOUNDARIES.md), and as a REFERENCE everywhere else.

---

### 2.2 "Trust kernel = `ops/osctl/core/`"

| File | Current state | Round-4 action |
|------|----------------|-----------------|
| `TRUST_MODEL.md` (osctl) | RESTATE | **KEEP** — canonical (C-15) |
| `validation/TRUST_MODEL.md` | RESTATE | **REDIRECT** body |
| `snapshots/SNAPSHOT_ARCHITECTURE.md` | RESTATE | **REFERENCE** |
| `MASTER_CONTEXT.md` | RESTATE | **REFERENCE** in trimmed section |
| `audit/TRUST_BOUNDARY_AUDIT.md` | RESTATE (with diagram) | **FREEZE** as observation |
| `audit/TRUST_LAYER_BOUNDARIES.md` | RESTATE | **MERGE-INTO** `BOUNDARIES.md`, retire (Round 3 §2 action #10) |
| `audit/TRUST_SIMPLIFICATION_PLAN.md` | RESTATE | **REFERENCE** + retire after §5 applied |

---

### 2.3 "Snapshots are non-authoritative"

| File | Current state | Round-4 action |
|------|----------------|-----------------|
| `snapshots/SNAPSHOT_TRUST_BOUNDARIES.md` | RESTATE | **KEEP** — canonical for snapshot scope |
| `snapshots/SNAPSHOT_ARCHITECTURE.md` | RESTATE | **REFERENCE** |
| `snapshots/AGENT_AUTHORITY_MAP.md` | RESTATE | **REFERENCE** then merge |
| `snapshots/CAPABILITY_MATRIX.md` | RESTATE | **REFERENCE** then merge |
| `MASTER_CONTEXT.md` | RESTATE | **REFERENCE** |
| 3× audit files | RESTATE | **REFERENCE** |

---

### 2.4 Frozen invariants (I-001..I-012)

| File | Current state | Round-4 action |
|------|----------------|-----------------|
| `FREEZE_v1.md` §6 | RESTATE (table) | **KEEP** — single canonical home |
| `ARCHITECTURE_FREEZE.md` §Frozen Decisions | Partial restatement (F-001..F-010) | **REPLACE** with link to `FREEZE_v1.md` §6 |
| `audit/INVARIANT_REGISTRY.md` §"Core Invariants" | Full restatement | **REMOVE** restatement; retain only the conflict register (P-, S-, CLI-, G-, PH- IDs) |
| `audit/TRUST_BOUNDARY_AUDIT.md` | Partial restatement | **REFERENCE** |

---

### 2.5 Closed event-type enum

| File | Current state | Round-4 action |
|------|----------------|-----------------|
| `EVENT_SCHEMA.md` | RESTATE | **KEEP** — canonical (C-3) |
| `core/schema/events.py` | Implementation | **KEEP** — code conforms |
| `FREEZE_v1.md` §4 | RESTATE | **REPLACE** with cite |
| `SPEC_REFERENCE.md` | RESTATE (draft names — divergent) | **BANNER** + archive |
| `CI_INTEGRATION_PLAN.md` | RESTATE (draft names) | **BANNER** + vocabulary sweep |
| Rituals / simulations | RESTATE (draft names) | **VOCAB SWEEP** to `.recorded` |

---

### 2.6 Ledger / projection paths

| File | Current state | Round-4 action |
|------|----------------|-----------------|
| `LEDGER_MODEL.md` | RESTATE | **KEEP** canonical (C-5); aligned to chosen option |
| `PROJECTION_RULES.md` | RESTATE | **KEEP** canonical (C-6) |
| `core/ledger/paths.py` | Implementation | **ALIGN** per Round 3 §10 Option L (recommended) |
| `ARCHITECTURE_FREEZE.md` F-001/F-002 | RESTATE | **KEEP** declaration; ensure consistent with chosen option |
| `BOUNDARIES.md`, `GOVERNANCE.md`, `ARCHITECTURE_DECISIONS.md` (ADR-001) | RESTATE | **REFERENCE** `LEDGER_MODEL.md` / `PROJECTION_RULES.md` |
| Root legacy MDs | Implicit alternate path | **BANNER** as non-authoritative |

**Resolution required:** Single path. Without it, every reference in this section remains ambiguous regardless of how many secondary docs reference rather than restate.

---

### 2.7 CLI surface

| File | Current state | Round-4 action |
|------|----------------|-----------------|
| `core/cli/main.py` | Implementation (`append`, `replay`, `verify`) | **KEEP** — source of truth |
| `README.md` | RESTATE (uses `project`) | **EDIT** → `replay` |
| `HUMAN_BOUNDARIES.md` | RESTATE | **EDIT** → `replay` |
| `ARCHITECTURE_FREEZE.md` | RESTATE | **EDIT** → `replay` |
| `SPEC_REFERENCE.md`, `IMPLEMENTATION_NOTES.md` | RESTATE draft `ingest` | **BANNER** + archive |
| `CI_INTEGRATION_PLAN.md` | RESTATE draft | **BANNER** + sweep |

---

### 2.8 Phase roadmap

| File | Current state | Round-4 action |
|------|----------------|-----------------|
| `GOVERNANCE.md` §Phase Alignment | RESTATE | **KEEP** — canonical |
| `README.md` "Phase Status" table | RESTATE | **REPLACE** with cite |
| `FREEZE_v1.md` §5 | RESTATE | **REPLACE** with cite |
| `ARCHITECTURE_FREEZE.md` §Phase Gate | RESTATE | **REPLACE** with cite |
| `CI_INTEGRATION_PLAN.md` | RESTATE | **VOCAB SWEEP** + cite |
| `ops/state/GOVERNANCE.md` | RESTATE | **REDIRECT** body |
| `snapshots/PHASE3_FINAL_REVIEW.md`, `MASTER_CONTEXT.md` | RESTATE (Phase 3 collision) | **RENAME** to "Snapshot Layer (P1.5-S)" |

---

### 2.9 Human authority / forbidden capabilities

| File | Current state | Round-4 action |
|------|----------------|-----------------|
| `HUMAN_BOUNDARIES.md` | RESTATE | **KEEP** canonical (C-14) |
| `NON_GOALS.md` | RESTATE (forbidden capabilities) | **KEEP** as negative-scope companion |
| `BOUNDARIES.md` | RESTATE (overlaps) | **REFERENCE** C-14, C-15 |
| `snapshots/CAPABILITY_MATRIX.md` | RESTATE (overlaps) | **TRIM** to snapshot-scoped rows; merge unique rows into C-14 |
| `snapshots/AGENT_AUTHORITY_MAP.md` | RESTATE | **TRIM** to snapshot read-flow only; merge unique rows into C-14 |
| `MASTER_CONTEXT.md` "Forbidden" list | RESTATE | **REFERENCE** |
| `AGENT_RULES.md` "Forbidden Without Explicit Ask" | RESTATE (agent-scoped) | **KEEP** scoped — but require VERIFY before ACT in the same section |

---

### 2.10 Validation evidence claims

| File | Current state | Round-4 action |
|------|----------------|-----------------|
| `validation/VALIDATION_REPORT.md` | RESTATE | **KEEP** — primary evidence |
| `validation/VALIDATION_SUMMARY.md` | RESTATE | **KEEP** — summary |
| `validation/HASH_REGISTRY.md` | RESTATE | **KEEP** — fingerprints |
| `FREEZE_v1.md` §7 | RESTATE ("19/19 PASS") | **REPLACE** with cite |
| `ARCHITECTURE_FREEZE.md` | RESTATE | **REPLACE** with cite |
| `MASTER_CONTEXT.md` "Trust kernel status" | RESTATE | **REPLACE** with cite in trimmed section |

---

## 3. Hidden Source-of-Truth Surfaces — Closure

Beyond restatement removal, three implicit truth surfaces must close. These are not text edits; they are **path** or **read-contract** decisions.

| Surface | Current authority | Round-4 action |
|---------|-------------------|-----------------|
| `ops/osctl/ledger/events.jsonl` vs `ops/state/ledger/events.jsonl` | Both claim canonical | **DECIDE** per Round 3 §10 Option L; demote loser to `examples/freeze_v1_fixture/` |
| `ops/osctl/projections/*` vs `ops/state/projections/*` vs root `CURRENT_STATUS.md` | Three surfaces | **DECIDE** path; banner root MDs |
| Root `CURRENT_STATUS.md` / `DEPLOYMENT_STATE.md` | Agent read-first | **BANNER** as non-authoritative (Round 3 §3.2) |
| `MASTER_CONTEXT.md` | "Master" implies authority | **TRIM** OSCTL section + add "non-canonical — see ops/osctl/README.md" banner |
| `AGENT_RULES.md` "Read first" | Implicit trust grant | **EDIT** to require VERIFY before ACT |

---

## 4. Single-Source Compliance Scorecard

| Concept | Canonical (after reduction) | Restatements (after reduction) | Compliant? |
|---------|------------------------------|---------------------------------|-------------|
| Ledger authority | LEDGER_MODEL.md | 0 (only references + 1 scope-cite) | **Yes** |
| Trust kernel | TRUST_MODEL.md | 0 | **Yes** |
| Snapshot non-authority | SNAPSHOT_TRUST_BOUNDARIES.md | 0 | **Yes** |
| Frozen invariants | FREEZE_v1.md §6 | 0 (audit registry stripped to conflict-only) | **Yes** |
| Event types | EVENT_SCHEMA.md | 0 (drafts banner-marked) | **Yes** |
| Ledger / projection paths | LEDGER_MODEL.md + PROJECTION_RULES.md | 0 (after path decision) | **Conditional** — requires Option L/O |
| CLI surface | core/cli/main.py | 0 (docs swept) | **Conditional** — requires vocab sweep |
| Phase roadmap | GOVERNANCE.md §Phase Alignment | 0 (snapshots renamed) | **Conditional** — requires rename |
| Human authority | HUMAN_BOUNDARIES.md | 0 (snapshot matrices trimmed) | **Yes** (after §3 merges) |
| Validation evidence | validation/VALIDATION_REPORT.md + SUMMARY.md | 0 | **Yes** |

**Net:** Of 10 truth concepts, **7 reach single-source after this round's editorial actions**; **3 require additional human decisions** (path choice, vocab sweep, snapshot rename) already specified in prior rounds.

---

## 5. Reduction Verdict

| Dimension | Verdict |
|-----------|---------|
| Restatement removal targets identified | **Yes** (Sections 2.1–2.10) |
| Each target has an action (RESTATE/REFERENCE/REDIRECT/MERGE) | **Yes** |
| Actions require new authority | **No** |
| Actions require code change | **One** (`core/ledger/paths.py`, per Round 3) |
| Actions require freeze bump | **No** (path defaults are not freeze invariants) |
| Single-source achievable in this round | **7 of 10** concepts; **3 conditional** on path/vocab/rename decisions |

**Recommendation:** Execute restatement removal as a single doc-only commit grouped by Section (2.1, 2.2, ...). Do not mix with path decision or vocabulary sweep — those are separate commits per Round 3 §3.
