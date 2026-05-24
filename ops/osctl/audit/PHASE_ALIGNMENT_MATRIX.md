# OSCTL Phase Alignment Matrix

**Date:** 2026-05-24  
**Purpose:** Reconcile conflicting phase definitions across OSCTL documents

---

## Two Competing Phase Models (CRITICAL)

### Model A — CI Integration Roadmap (Governance)

Used in: `GOVERNANCE.md`, `README.md`, `FREEZE_v1.md`, `ARCHITECTURE_FREEZE.md`, `CI_INTEGRATION_PLAN.md`

| Phase | Scope | Documented status |
|-------|-------|-------------------|
| **1** | Manual templates, human MD | Complete |
| **1.5** | Frozen governance + deterministic core | **Current / LOCKED** |
| **2** | Semi-automated ingestion; CI observe-only append | Not started |
| **3** | CI verify gate; fingerprint policy | Not started |
| **4** | Ledger sync policy (not deploy orchestration) | Not defined |

### Model B — Layer Stack (Snapshot docs)

Used in: `snapshots/PHASE3_FINAL_REVIEW.md`, `MASTER_CONTEXT.md` (OSCTL section)

| Layer | Label | Scope | Documented status |
|-------|-------|-------|-------------------|
| L1 | ledger/ | Append-only truth | Validated |
| L2 | core/ | Trust kernel | Validated |
| L3 | validation/ | Evidence | Complete |
| L4 | **Phase 3** | snapshots/ | **Design complete** |

**Conflict:** Model B calls snapshots "Phase 3" while Model A reserves Phase 3 for CI verify gates.

---

## Alignment Matrix — Artifacts vs Phase Model

| Artifact / Capability | Model A phase | Model B layer | Actual state | Aligned? |
|----------------------|---------------|---------------|--------------|----------|
| Governance docs freeze | 1.5 | — | Done | Yes |
| `ops/osctl/core/` CLI | 1.5 | L2 | Implemented | Yes |
| `validation/` 19/19 | 1.5 | L3 | PASS (local) | Yes |
| `snapshots/` specs + scripts | 3 (Model A: not started) | L4 "Phase 3" | Done (design) | **NO** |
| CI observe append | 2 | — | Not implemented | Yes (planned) |
| CI verify gate | 3 | — | Not implemented | Yes (planned) |
| External head-hash | Human (all phases) | — | Not done | N/A |
| Git anchoring | Pre-2 hygiene | — | Not done | Blocker |
| `ops/state/` templates | 1 | — | Present | Yes |
| `ops/rituals/` | 1 | — | Present | Yes |

---

## CI_INTEGRATION_PLAN Internal Drift

| Section | Claim | Contradiction |
|---------|-------|---------------|
| Phase 1.5 status | "No CLI, no workflow edits" | CLI exists (`append/replay/verify`) |
| Phase 1.5 exit | `osctl-freeze/1.0` sign-off | Active freeze is `1.5` |
| Phase 2 ledger path | `ops/osctl/ledger/production.jsonl` | Core default is `events.jsonl`; freeze says `ops/state/ledger/` |

---

## FREEZE_v1 vs Live Workspace

| FREEZE_v1 claim | Observed |
|-----------------|----------|
| Phase 1.5 LOCKED | Consistent with core |
| Phase 2 not started | Consistent |
| Phase 3 not started | **Contradicted** by snapshot "Phase 3 complete" docs |
| Phase 4 not defined | Consistent |

---

## MASTER_CONTEXT Alignment

| Section | Phase reference | Model |
|---------|-----------------|-------|
| OSCTL Snapshot Layer Status | "Phase 3 artifacts" | Model B |
| Forbidden list | No orchestration | Both models |
| Trust kernel validated | Points to validation summary | Model A 1.5 |

**Recommendation:** MASTER_CONTEXT should use **"Snapshot Layer (SL)"** not "Phase 3".

---

## Hygiene / Audit Phase References

| Document | Phase cited | Meaning |
|----------|-------------|---------|
| `CLEAN_STATE_REQUIREMENTS.md` P4-* | Phase 4+ gates | Model A |
| `CLEAN_STATE_REQUIREMENTS.md` G8 | "Phase 3 scope" | Ambiguous — snapshots? |
| `FINAL_HYGIENE_VERDICT.md` | Phase 4 readiness NO-GO | Model A |
| `GIT_ANCHORING_PLAN.md` A4 | snapshots = Phase 3 | Model B |

---

## Recommended Unified Phase Model

Proposed resolution — **adopt Model A for roadmap; rename snapshot work**:

| ID | Name | Scope | Status |
|----|------|-------|--------|
| P1 | Manual governance | Templates, rituals | Complete |
| P1.5 | Trust kernel freeze | core + validation + governance | **Current** |
| P1.5-S | Snapshot layer | snapshots/ read-only | **Complete (design)** |
| P2 | Observe-only ingest | External append to CLI | Not started |
| P3 | Verify gate | CI fingerprint check | Not started |
| P4 | Ledger sync policy | Multi-writer policy | Not defined |

This preserves snapshot deliverables without consuming "Phase 3" label.

---

## Phase Gate Dependencies

```text
P1 ──► P1.5 (freeze) ──► P1.5-S (snapshots, optional acceleration)
                │
                ├──► Git anchoring (hygiene — not a phase, BLOCKER)
                │
                └──► P2 (observe ingest) ──► P3 (verify gate) ──► P4 (sync policy)
```

**Git anchoring is a cross-cutting gate**, not numbered phase — must complete before P2.

---

## Phase Entry Conditions — Consolidated

| Transition | Required (all models) | Current |
|------------|----------------------|---------|
| → P1.5 frozen | Core validated, freeze declared | **MET** (local) |
| → Git anchor | ops/osctl tracked, clean branch | **NOT MET** |
| → P1.5-S accepted | Snapshot docs + read-only scripts | **MET** |
| → P2 | Human approves observe-only plan; schema aligned | **NOT MET** |
| → P3 | Projections stable in CI; path conflicts resolved | **NOT MET** |
| → P4 | P3 operational; sync policy written | **NOT MET** |

---

## Phase Alignment Verdict

| Dimension | Verdict |
|-----------|---------|
| Core at P1.5 | **ALIGNED** |
| Snapshots labeled Phase 3 | **MISALIGNED** with governance roadmap |
| CI plan vs implementation | **STALE** (CLI exists; paths differ) |
| Hygiene blocking P2+ | **CORRECT** — git anchor required |
| Overall | **RENAME REQUIRED** before multi-team coordination |

**Action:** Update snapshot docs and MASTER_CONTEXT to use **P1.5-S** or **Snapshot Layer** terminology; reserve Phase 2/3/4 for CI roadmap only.
