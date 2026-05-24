# OSCTL Future Risk Review

**Date:** 2026-05-24  
**Mode:** Read-only audit synthesis  
**Sources:** `snapshots/FUTURE_RISKS.md`, hygiene audits, architecture consistency findings

---

## Risk Matrix

| ID | Risk | Likelihood | Impact | Phase | Mitigation status |
|----|------|------------|--------|-------|-------------------|
| R-01 | Dual ledger paths diverge after first append | High (if unaddressed) | Critical | Now | **OPEN** |
| R-02 | Agents trust root legacy MDs over ledger | High | Critical | Now | **OPEN** |
| R-03 | Git-unanchored trust kernel | Certain | Critical | Now | **OPEN** |
| R-04 | Draft spec drives CI orchestration design | Medium | High | Phase 2 | Partial docs |
| R-05 | Phase 3 naming collision blocks planning | Medium | Medium | Now | **OPEN** |
| R-06 | Stale snapshot used for decisions | Medium | High | Snapshot layer | Guardrails exist |
| R-07 | AI hallucinated operational state | Medium | High | Any | Partial guardrails |
| R-08 | Mixed commit merges product + OSCTL | High | High | Anchoring | Hygiene plans exist |
| R-09 | Validation evidence stale after core edit | Medium | High | Post-change | Process defined |
| R-10 | No external head-hash anchor | Certain | Medium | Human | Documented |
| R-11 | Concurrent append race | Low | Medium | Phase 2+ | Deferred |
| R-12 | Prod-like data in fixture ledger committed | Medium | Medium | Anchoring | Human review noted |
| R-13 | Coordination layer undefined | Medium | Low | Anchoring | **OPEN** |
| R-14 | `project` vs `replay` breaks automation | Medium | Medium | Phase 2 | **OPEN** |
| R-15 | Governance doc proliferation | Low | Medium | Ongoing | No registry until this audit |

---

## Immediate Risks (Before Git Anchoring)

### R-01: Split-brain ledger

**Scenario:** Operator A appends to `ops/state/ledger/` per freeze docs. CLI defaults append to `ops/osctl/ledger/`. Verify passes locally against wrong file relative to team expectation.

**Blast radius:** Incorrect projections, false confidence, reconciliation nightmares.

**Mitigation:** Single canonical path; one path demoted to `examples/` fixture only.

---

### R-02: Agent authority bypass

**Scenario:** Agent reads root `CURRENT_STATUS.md` (2026-05-02 deploy). Recommends release actions inconsistent with ledger seq 5 rollback/reconcile narrative.

**Blast radius:** Wrong operational advice; skipped verify discipline.

**Mitigation:** Rewrite `AGENT_RULES.md` read order; deprecate root MDs or stamp `NON-AUTHORITATIVE`.

---

### R-03: Unanchored trust kernel

**Scenario:** Fresh clone lacks `ops/osctl/`. Validation claims 19/19 PASS but evidence is not reproducible.

**Blast radius:** No audit trail; forked implementations.

**Mitigation:** Git anchoring series per `GIT_ANCHORING_PLAN.md` on isolated branch.

---

### R-08: Mixed workspace commit

**Scenario:** Single commit includes `notifications/` module + OSCTL core + `docker-compose.yml`.

**Blast radius:** Trust layer commits entangled with product; rollback of one rolls back both.

**Mitigation:** Branch isolation; enforce `TRUST_LAYER_BOUNDARIES.md` forbidden mixes.

---

## Phase 2+ Risks (Planning — Not Implemented)

### R-04: Orchestration creep via CI observe-only

**Scenario:** Phase 2 adds post-deploy `deploy.observed` append using draft schema. Core rejects events or accepts wrong shape.

**Mitigation:** Use `deploy.recorded` only; amend `CI_INTEGRATION_PLAN.md` before implementation.

---

### R-04b: Silent CI append

**Scenario:** CI appends prod assertions without human approval.

**Mitigation:** `AGENT_AUTHORITY_MAP.md` forbids; enforce in workflow review.

---

### R-11: Concurrent append

**Scenario:** Two operators append simultaneously; seq collision or interleaved lines.

**Mitigation:** Deferred locking; human single-writer discipline until Phase 2 policy.

---

## Snapshot Layer Risks (from FUTURE_RISKS.md — validated)

| Risk | Guardrail doc | Residual |
|------|---------------|----------|
| Stale snapshot action | `SNAPSHOT_SECURITY.md` | Human discipline |
| Tampered snapshot | `verify_snapshot.py` | Must run tool |
| Hidden mutable cache | `CAPABILITY_MATRIX.md` | None detected in repo |
| Snapshot-triggered deploy | Forbidden list in PHASE3 review | Not implemented |
| Snapshot writer in CI | Phase 3 policy | Not implemented |

---

## Long-Term Structural Risks

### R-16: Hash chain deferred indefinitely

Without `prev_hash`/`hash`, tamper evidence relies on git history alone. External anchor becomes more important.

### R-17: Actor authorization deferred

Any actor string accepted on append. Malicious or mistaken `ci:*` events possible if append gate weak.

### R-18: Duplicate governance drift

`ops/osctl/GOVERNANCE.md` and `ops/state/GOVERNANCE.md` evolve separately.

### R-19: MASTER_CONTEXT backend/OSCTL coupling

Single file mixes NestJS deploy model and OSCTL snapshot status — agents conflate product and ops layers.

---

## Risk Acceptance (Current State)

| Category | Acceptable? |
|----------|-------------|
| Local dev / rehearsal use of OSCTL | Yes — with verify discipline |
| Production operational reliance | **No** |
| CI integration without path + schema fix | **No** |
| Agent autonomous prod decisions | **No** (forbidden) |
| Snapshot-only handoff | **No** without compare_snapshot |

---

## Recommended Risk Treatment Order

1. R-01, R-02 — path + agent read path (P0)  
2. R-03, R-08 — git anchoring on clean branch (P0)  
3. R-05, R-14 — terminology alignment (P1)  
4. R-04 — scrub draft orchestration from Phase 2 plans (P1)  
5. R-10 — external head-hash (P2, human)  
6. R-11 — concurrent append policy before multi-writer Phase 2 (P2)  

---

## Future Risk Verdict

**Core design risks:** Well-documented with guardrails.  
**Process/workspace risks:** **ELEVATED** — multiple P0 open items block trust chain.  
**Overall:** Proceed with hygiene + path reconciliation before Phase 2 or CI integration.
