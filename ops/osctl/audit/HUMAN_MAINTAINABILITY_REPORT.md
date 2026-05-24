# OSCTL Human Maintainability Report

**Date:** 2026-05-24
**Audit cycle:** Round 4 — Canonical Governance Reduction (strict, read-only)
**Authority of this document:** Observation only — non-authoritative.
**Builds on:** Round 3 `HUMAN_OPERABILITY_REVIEW.md`. That report measured **operability** (can the operator act today). This report measures **maintainability** (can the operator and a future human team **keep** the system understandable for years).

---

## 1. Maintainability vs. Operability

| Dimension | Operability (Round 3) | Maintainability (Round 4) |
|-----------|-----------------------|----------------------------|
| Timescale | First task today | 6 months — 5 years |
| Measure | Time-to-first-correct-action | Doc count, fan-out depth, rule-restatement count, audit-recursion velocity |
| Question | "Can I do the right thing now?" | "Can this team keep doing the right thing without slowly drowning?" |
| Round 3 verdict | BELOW SAFE THRESHOLD (recoverable) | Not measured |
| Round 4 task | Re-confirm with reduction lens | Establish forward maintainability targets |

Round 3 actions, if applied, bring **operability** to safe threshold. Round 4 adds the maintainability layer: the reduction work in `GOVERNANCE_REDUCTION_PLAN.md` + `ARCHIVE_RECOMMENDATIONS.md` + `FREEZE_CANDIDATES.md` is what keeps operability from regressing in 12–24 months.

---

## 2. Maintainability Metrics

Quantitative measurements where possible. Source: file enumeration as of 2026-05-24.

### 2.1 Active governance surface

| Metric | Today | After Round 3 actions applied | After Round 4 reductions applied | Maintainability target |
|--------|-------|--------------------------------|----------------------------------|------------------------|
| `ops/osctl/` root spec files | 22 | 22 | 19 (3 archived) | ≤ 20 |
| `ops/osctl/audit/` active files | 26 (33 after Round 4 deliverables) | 33 | ~9 (24 archived/frozen) | ≤ 10 |
| `ops/osctl/snapshots/` files | 11 | 11 | 11 (4 redirects in place) | ≤ 12 |
| `ops/osctl/validation/` files | 10 | 10 | 10 (1 redirect) | ≤ 10 |
| Adjacent `ops/state/` governance files | 1 (`GOVERNANCE.md`) | 0 (redirect) | 0 | 0 |
| Root MDs treated as authority | 3 (CURRENT_STATUS, DEPLOYMENT_STATE, MASTER_CONTEXT) | 0 (banner/trim) | 0 | 0 |
| **Total active governance surface** | **~63** | **~63** | **~49** | **≤ 55** |

### 2.2 Rule restatement count

| Concept | RESTATE count today | After Round 4 SOURCE_OF_TRUTH_REDUCTION applied | Target |
|---------|---------------------|---------------------------------------------------|--------|
| "Ledger authoritative" | 14+ | 1 (+1 scope-cite) | ≤ 2 |
| Trust kernel definition | 7 | 1 | 1 |
| Snapshot non-authority | 6 | 1 | 1 |
| Frozen invariants | 3 | 1 | 1 |
| Phase roadmap | 6 | 1 | 1 |
| Authority matrices | 5 | 3 | 3 |

### 2.3 Audit recursion velocity

Audit files created per round.

| Round | Files added | Cumulative | Notes |
|-------|-------------|------------|-------|
| Round 1 (Hygiene) | ~13 | 13 | One-shot hygiene workflow |
| Round 2 (Architecture) | 7 | 20 | Reached entropy ceiling (20) |
| Round 3 (Consolidation) | 7 | 27 | Exceeded ceiling |
| Round 4 (Reduction) | 7 | 33 | Further over |
| Round 4 net effect (archive + freeze) | active = ~9 | — | **Active count goes down for the first time** |
| Round 5 | **0 (stop-rule)** | active stays ≤ 10 | Stop-rule enforced |

Round 4 is the first round whose **net effect** decreases active audit surface.

### 2.4 Fan-out depth

A new operator opening `ops/osctl/README.md` and following every recommended link.

| State | Mandatory reads | First-task readiness time |
|-------|------------------|----------------------------|
| Today | ~15 (root spec) + 10 (snapshots) + 9 (validation) + 19 (audit) + 4 (root governance) = **57** | 60–90 min (per Round 3) |
| After Round 3 actions applied | ~15 + 10 + 9 + 19 + 1 (root trimmed) = **54** | 20–30 min |
| After Round 4 reductions applied | ~15 + 6 + 9 + ~9 (audit) + 1 = **40** | 10–15 min |
| Maintainability target | ≤ 25 mandatory | ≤ 10 min |

Note: the "mandatory" count overstates required reads — most files are reference-only. The relevant maintainability metric is **what the operator must skim to know where to look**, which the canonical-set restructure cuts roughly in half.

---

## 3. Cognitive Load Inventory (Forward View)

### 3.1 Doc fan-out from README — after reduction

```text
ops/osctl/README.md   (≤ 100 lines, navigation only)
├── ARCHITECTURE_FREEZE.md / FREEZE_v1.md   (declaration + invariants)
├── GOVERNANCE.md                            (roles + hierarchy)
├── TRUST_MODEL.md                           (guarantees)
├── BOUNDARIES.md + HUMAN_BOUNDARIES.md      (authority)
├── NON_GOALS.md                             (negative scope)
├── LEDGER_MODEL.md / PROJECTION_RULES.md    (paths + contracts)
├── EVENT_SCHEMA.md / STATE_MACHINE.md       (data model)
├── REPLAY_GUARANTEES.md / VERIFY_MODEL.md   (replay + verify)
├── SERIALIZATION_RULES.md                   (bytes)
├── ROLLBACK_POLICY.md / DRIFT_DETECTION.md  (recovery)
└── ARCHITECTURE_DECISIONS.md                (ADR log)

DEEP REFERENCES (look up only when needed)
  snapshots/SNAPSHOT_*.md   (6 scoped supplements)

EVIDENCE
  validation/VALIDATION_*.md + run_validation.py

AUDIT (rarely needed; observations only)
  audit/*  (~9 active after reduction)

HISTORY (storage; not active)
  archive/drafts/, archive/hygiene/, archive/consolidation/
```

Compared to Round 3's diagram, the **only structural change** is that `audit/` shrinks from 19 visible files to ~9, and `archive/` appears as a flat storage area outside the active navigation. No new layers introduced.

### 3.2 Approval-chain documents

| Source | Today | After Round 4 |
|--------|-------|----------------|
| `GOVERNANCE.md` | RESTATE | RESTATE (canonical) |
| `BOUNDARIES.md` | RESTATE | REFERENCE |
| `HUMAN_BOUNDARIES.md` | RESTATE | RESTATE (canonical for human zoning) |
| `ops/state/GOVERNANCE.md` | RESTATE (duplicate) | REDIRECT |
| `snapshots/AGENT_AUTHORITY_MAP.md` | RESTATE | REDIRECT to HUMAN_BOUNDARIES |
| `snapshots/CAPABILITY_MATRIX.md` | RESTATE | REDIRECT to HUMAN_BOUNDARIES |
| `MASTER_CONTEXT.md` | RESTATE | REFERENCE in trimmed section |
| **Distinct approval-chain sources** | **6** | **2** (GOVERNANCE.md + HUMAN_BOUNDARIES.md) |

### 3.3 Decision-chain clarity

Each operator decision today must be re-derived by reading multiple files. The reduction-target state:

| Decision | Today | After reduction |
|----------|-------|------------------|
| "Can an agent run X?" | Read 5 surfaces | Read HUMAN_BOUNDARIES.md |
| "Where is the ledger?" | Read LEDGER_MODEL + paths.py + FREEZE + GOVERNANCE | Read LEDGER_MODEL.md (single canonical, code-aligned) |
| "What CLI command?" | Read README (wrong) vs main.py | Read README (corrected) |
| "What is forbidden?" | Read NON_GOALS + CAPABILITY_MATRIX + HUMAN_BOUNDARIES | Read NON_GOALS.md |
| "Has this been verified?" | Read VALIDATION_REPORT + SUMMARY + HASH_REGISTRY | Read VALIDATION_SUMMARY.md |
| "Who do I escalate to?" | Read 3 docs | Read HUMAN_BOUNDARIES.md §Escalation |

---

## 4. Long-Term Maintainability Risks (Detected)

These risks live on the **maintainability** time horizon (months to years). They are recurrences of the entropy patterns Round 3 first surfaced.

### 4.1 Audit recursion (R-15 from FUTURE_RISK_REVIEW)

| Risk | Round-4 mitigation |
|------|---------------------|
| New audit rounds add new files indefinitely | Stop-rule in `FREEZE_CANDIDATES.md` §8 |
| Each round produces its own "FINAL_VERDICT.md" | Verdict cap = 4 (Rounds 1–4); supersession required |
| Each round produces its own "_REGISTRY.md" | Registry replacement-only rule |
| Each round produces its own "_PLAN.md" | Max 2 active plans rule |

### 4.2 Phase fragmentation (E-2 in entropy report)

| Risk | Round-4 mitigation |
|------|---------------------|
| Phase numbering proliferates (1.5-S, P3.1, P3.2, ...) | Phase model frozen in GOVERNANCE.md (1, 1.5, 1.5-S, 2, 3, 4); no further proliferation |
| Snapshot layer rename pending | Editorial — once renamed, no recurrence |
| Hygiene "G1..G8" becomes a phase model | One-shot — archived after hygiene applied |

### 4.3 Trust-boundary fragmentation (R-08, R-18)

| Risk | Round-4 mitigation |
|------|---------------------|
| `ops/state/GOVERNANCE.md` evolves separately from `ops/osctl/GOVERNANCE.md` | Redirect (Round 3 action #4); single canonical |
| Snapshot capability matrix evolves separately from HUMAN_BOUNDARIES | Merge per `GOVERNANCE_REDUCTION_PLAN.md` §3 |
| `MASTER_CONTEXT.md` grows as third truth surface | Trim to ≤ 8 OSCTL lines + banner (Round 3 action #5) |

### 4.4 Future orchestration creep (R-04, AR-7 from prior verdicts)

| Risk | Round-4 mitigation |
|------|---------------------|
| `CI_INTEGRATION_PLAN.md` Phase 2/3/4 designs become binding | "Pre-implementation — not in `osctl-core/1.0`" banner |
| `IMPLEMENTATION_NOTES.md` lock/CLI ideas surface in code | Archive after banner (Round 4 §3 of `ARCHIVE_RECOMMENDATIONS.md`) |
| Snapshot writer becomes binding | `SNAPSHOT_ARCHITECTURE.md` lifecycle labeled "design — not implemented" |
| New "coordination layer" gets built | Stop-rule §8.5 forbids new layers without freeze bump |

### 4.5 Authority creep into audit files

| Risk | Round-4 mitigation |
|------|---------------------|
| Audit files start asserting policy ("future audits must do X") | Round 4 explicitly states all audit files are observations, never authority; the stop-rule itself is housed in `FREEZE_CANDIDATES.md`, not an audit observation |
| Verdict files become living documents | Verdicts FULLY FROZEN per `FREEZE_CANDIDATES.md` §2 |

---

## 5. Onboarding Complexity Test

A new operator with no prior context should reach decision capability quickly. Forward target:

| Onboarding minute | Expected milestone (after reduction) |
|-------------------|---------------------------------------|
| 0–2 min | Read `ops/osctl/README.md`; identify the 15 canonical files |
| 2–5 min | Read `GOVERNANCE.md` §Phase Alignment + `TRUST_MODEL.md` summary |
| 5–8 min | Read `HUMAN_BOUNDARIES.md` (can/can't matrix) |
| 8–10 min | Run `python -m ops.osctl.core verify` → see PASS |
| 10–15 min | Read `EVENT_SCHEMA.md` + `LEDGER_MODEL.md` enough to interpret events |
| 15 min | Capable of describing OSCTL's invariants and running read-only commands without supervision |
| 30 min | Capable of identifying which file is canonical for any given question |

Target: 15 min to read-only operability; 30 min to "I know where the rules live". Without reduction, Round 3 measured 60–90 min just to first action.

---

## 6. Governance Readability Score

Soft qualitative score, not a metric. Scale 1 (poor) – 5 (excellent).

| Dimension | Today | After Round 3 | After Round 4 |
|-----------|-------|---------------|----------------|
| Single canonical entrypoint | 2 | 3 | **4** |
| Single canonical truth path | 1 (split-brain) | 4 (path decision) | **4** |
| Clear forbidden actions | 4 (NON_GOALS clear) | 4 | **4** |
| Clear allowed actions | 3 (spread across 5 docs) | 4 | **4** |
| Audit history visible but bounded | 2 (recursion) | 3 (registries) | **4** (archive + freeze) |
| Stop-rule against further growth | 1 | 3 (Round 3 §8) | **4** (Round 4 §8) |
| Cognitive load on new operator | 2 | 3 | **4** |
| **Average** | **2.1** | **3.4** | **4.0** |

Round 4 brings score from 3.4 → 4.0 primarily by **closing the audit recursion vector** and **bounding the file count**.

---

## 7. Decision-Chain Clarity Inventory

Every operational decision should be answerable from ≤ 2 canonical files.

| Decision | Canonical files (after reduction) | OK? |
|----------|------------------------------------|-----|
| Append an event | `EVENT_SCHEMA.md` + `LEDGER_MODEL.md` | **Yes** |
| Run verify | `VERIFY_MODEL.md` | **Yes** |
| Trust a projection | `VERIFY_MODEL.md` + `AGENT_RULES.md` (verify-first) | **Yes** |
| Decide action allowed | `HUMAN_BOUNDARIES.md` + `NON_GOALS.md` | **Yes** |
| Trigger rollback | `ROLLBACK_POLICY.md` | **Yes** |
| Detect drift | `DRIFT_DETECTION.md` | **Yes** |
| Use a snapshot | `SNAPSHOT_TRUST_BOUNDARIES.md` (+ `SNAPSHOT_ARCHITECTURE.md` design) | **Yes** |
| Phase entry | `GOVERNANCE.md` §Phase Alignment | **Yes** |
| Choose canonical path | `LEDGER_MODEL.md` + `PROJECTION_RULES.md` (after path decision) | **Conditional** |
| Apply CLI command | `README.md` + `core/cli/main.py` (after vocab sweep) | **Conditional** |

**Net:** 8 of 10 decisions reach 1–2 file clarity unconditionally; **2 conditional on path + vocab sweep** already specified in prior rounds.

---

## 8. Maintainability Verdict

| Dimension | Verdict |
|-----------|---------|
| Active governance surface bounded | **Yes** (target ≤ 55, achievable at ~49 post-reduction) |
| Rule restatement reduced to single canonical per concept | **7 of 10** unconditional; **3 conditional** on prior-round actions |
| Audit recursion velocity halted | **Yes** (Round 4 is first net-reducer; stop-rule formalized) |
| Phase fragmentation halted | **Yes** (no new schemes allowed without freeze bump) |
| Decision-chain clarity (1–2 files per decision) | **8 of 10** unconditional |
| First-task readiness time | Estimated **10–15 min** post-reduction (vs 60–90 today) |
| Long-term maintainability risks have mitigations | **Yes** — all 5 risk classes covered (Section 4) |

**Net human maintainability:** **ACHIEVABLE and BOUNDED.** The kernel is already maintainable (low-code, deterministic, validated). The governance + audit surface is what threatens 12-month maintainability, and Round 4 closes that vector via archive + freeze + stop-rule — provided the recommendations are actually applied by a human.

**Critical follow-up:** If reduction recommendations are not applied, maintainability regresses to Round 3's observed state and a 4th audit cycle would likely add 5–7 more files, breaching maintainability targets. The stop-rule must be applied **even if** the file moves are not.
