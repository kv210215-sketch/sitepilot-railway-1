# OSCTL Rehearsal Summary

**Date:** 2026-05-23  
**Scope:** 6 operational rehearsal scenarios  
**Result:** 6/6 base ledgers verify PASS  
**Purpose:** Workflow rehearsal, governance validation, operator usability — not automation

---

## Scenario Matrix

| Scenario | Fragility | Primary human gate | Verify |
|----------|-----------|-------------------|--------|
| staging_deploy_success | Low | Staging promotion (seq 3) | PASS |
| staging_deploy_failure | Medium | Failure attestation | PASS |
| rollback_rehearsal | **High** | Rollback approval + target selection | PASS |
| drift_detection | Medium | Drift investigation (external) | PASS / FAIL on injection |
| reconcile_flow | **High** | Reconcile attestation | PASS |
| operator_handoff | Medium | Severity + handoff acceptance | PASS |

---

## 1. Most Fragile Workflow Areas

| Rank | Area | Why |
|------|------|-----|
| 1 | **Rollback → reconcile** | Multiple human gates; external execution invisible to core; active_release lags restored state |
| 2 | **Multi-event single release** | Staging path requires 3 `deploy.recorded` — easy to skip or mis-order lifecycle |
| 3 | **Handoff metadata** | `refs` not rendered in projections — operator must read raw ledger |
| 4 | **External drift** | Unrecorded deploy and runtime mismatch pass verify |
| 5 | **Post-failure recovery** | `failed` → next action ambiguous without runbook |

---

## 2. Biggest Operator Risks

| Risk | Impact | Mitigation (manual) |
|------|--------|---------------------|
| Treating `rollback.recorded` as rollback executed | False confidence | Ritual banner: record ≠ execute |
| Skipping `replay` + `verify` after append | Stale projections trusted | Mandatory post-append commands |
| Verify PASS = prod healthy | Wrong operational decisions | Weekly reconciliation vs Railway |
| Single global lifecycle | Cannot represent parallel staging + prod | Separate ledgers deferred; use refs + incidents |
| SHA/refs inconsistency | Silent ledger inaccuracy | Human review at append; no auto-check |
| False reconcile attestation | Ledger says recovered; prod broken | Smoke ritual before seq 4 append |

---

## 3. Remaining Ambiguity

| Topic | Status |
|-------|--------|
| `active_release_*` after rollback/reconcile | Shows last deploy event, not restored target |
| Failed staging → incident | No automatic incident creation |
| Handoff without `note.recorded` event | Refs-only pattern undocumented in core |
| Parallel env lifecycles | Single `lifecycle_state` in fold model |
| External vs recorded deploy | Verify cannot detect |
| `refs` vs `payload` SHA cross-check | Not validated |
| CI actor append authority | Policy only — not in core |

---

## 4. Phase 2 Readiness Risks

| Risk | Severity | Notes |
|------|----------|-------|
| CI append before operator runbook finalized | Medium | Observe-only first; non-blocking verify |
| Automated append with wrong lifecycle | High | Requires event template validation in CI script |
| Verify gate blocking deploy prematurely | Medium | Phase 2 should alert, not block initially |
| Concurrent CI + human append | High | Single-writer policy not enforced in core |
| False confidence from CI green + verify pass | Medium | Does not prove runtime truth |

**Verdict:** Core is stable for **observe-only** Phase 2. Blocking gates and concurrent append need policy first.

---

## 5. Recommended Minimal Improvements Before CI Integration

| Priority | Improvement | Effort |
|----------|-------------|--------|
| P0 | Operator runbook: append → replay → verify (one page) | Doc |
| P0 | Rollback ritual: explicit "recorded ≠ executed" checklist | Doc |
| P1 | Event JSON templates per scenario in `examples/*/append-*.json` | Files |
| P1 | Weekly reconciliation ritual linked from verify FAIL output | Doc |
| P2 | Optional SHA cross-field warning in verify (non-blocking) | Core |
| P2 | Render selected `refs` in DEPLOYMENT_STATE journal | Core |
| P3 | `note.recorded` event type for handoff | Spec bump |

**Do not add before Phase 2:** deploy triggers, Railway API, autonomous recovery, blocking CI gates.

---

## Rehearsal Commands Reference

```bash
# All scenarios
python ops/osctl/examples/run_rehearsals.py

# Single scenario
python -m ops.osctl.core replay \
  --ledger ops/osctl/examples/reconcile_flow/events.jsonl \
  --output ops/osctl/examples/reconcile_flow/projections

python -m ops.osctl.core verify \
  --ledger ops/osctl/examples/reconcile_flow/events.jsonl \
  --output ops/osctl/examples/reconcile_flow/projections
```

---

## Cross-Scenario: What Worked

- All valid lifecycle chains verify PASS
- Replay fingerprints stable across runs
- Projection drift detected on manual MD edit
- Rollback target validation catches bad target_seq
- Incident blockers appear in CURRENT_STATUS
- Reconcile clears `rollback_active`

## Cross-Scenario: What Needs Operator Discipline

- External actions always precede ledger assertions
- Verify checks internal consistency only
- Multi-event releases require lifecycle literacy
- Handoff requires reading ledger refs

---

**Related:** `FREEZE_v1.md`, `DRIFT_DETECTION.md`, `ops/rituals/`
