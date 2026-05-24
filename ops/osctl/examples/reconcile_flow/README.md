# Reconcile Flow — Rehearsal

**Environment:** production  
**Events:** 5  
**Fingerprint:** `ab1df6124ca1792c3a69ec2526175c79e475770a57b62bd03c3580fa9b5fac1b`

---

## 1. Scenario Description

| Field | Value |
|-------|-------|
| What happened | Bad prod deploy → rollback marked → external rollback rehearsed → reconciled → incident resolved |
| Environment | `production` |
| Expected lifecycle end | `reconciled` |
| Expected ledger events | 2 × deploy, 1 × rollback, 1 × reconcile, 1 × incident (resolved) |

Full rollback recovery **recording** workflow. External Railway redeploy assumed complete before seq 4.

---

## 2. Event Sequence

```text
None → production       (seq 1, good deploy)
production → failed       (seq 2, bad deploy)
failed → rollback         (seq 3, human marks target seq 1)
rollback → reconciled     (seq 4, human attests smoke passed)
(incident resolved)       (seq 5)
```

---

## 3. Example Ledger

See `events.jsonl`.

---

## 4. Replay Result

```bash
python -m ops.osctl.core replay \
  --ledger ops/osctl/examples/reconcile_flow/events.jsonl \
  --output ops/osctl/examples/reconcile_flow/projections
```

| Output | Key fields |
|--------|------------|
| `CURRENT_STATUS.generated.md` | `lifecycle_state: reconciled`, `rollback_active: no`, verification `passed` |
| `DEPLOYMENT_STATE.generated.md` | 4 journal entries including reconcile summary |

Excerpt — reconcile journal:

```markdown
| Summary | `Manual Railway redeploy to seq 1 artifact; auth smoke passed` |
| Lifecycle state | `reconciled` |
```

---

## 5. Verify Result

| Check | Result |
|-------|--------|
| Schema | PASS |
| Transitions | PASS |
| Rollback target | PASS |
| Replay consistency | PASS |
| Projection drift | PASS |
| **Overall** | **PASS** |

---

## 6. Human Checkpoints

| Checkpoint | Actor | This scenario |
|------------|-------|---------------|
| GO/NO-GO | Human | N/A — recovery flow |
| Rollback approval | Human | seq 3 |
| Severity | Human | seq 5 (SEV2 resolved) |
| **Reconcile attestation** | **Human** | **seq 4** — smoke passed claim |
| Rollback execution | Human | External — referenced in refs |

---

## 7. Drift Scenarios

| Drift type | Risk after reconcile |
|------------|---------------------|
| False reconcile | seq 4 appended without actual smoke pass — verify cannot detect |
| Unrecorded forward deploy | Reconciled but new prod deploy not appended |
| Stale projection | Reconcile appended; no replay |

---

## 8. Recovery Semantics

This scenario **is** the recovery path:

```text
rollback → reconciled → (optional) production via new deploy
```

Verify-after-replay:

```bash
python -m ops.osctl.core replay ...
python -m ops.osctl.core verify ...
```

Incident escalation: SEV2 resolved at seq 5 after reconcile.

---

## 9. Operator Ergonomics

| Area | Observation |
|------|-------------|
| Confusing steps | Reconcile clears rollback but active release still shows seq 2 fields until new deploy |
| Naming friction | `reconcile.recorded` vs operational "rollback complete" |
| Replay readability | Full journal chain — best reference for rollback recovery |
| Projection usability | Rollback section shows inactive — clear |
| Reconciliation complexity | **Highest** — 5 events, multiple human gates |

---

## 10. Final Assessment

| | |
|-|-|
| **Worked** | Full lifecycle to reconciled; verify PASS; incident + rollback + reconcile chain |
| **Ambiguous** | Active release metadata lags restored reality until next deploy event |
| **Improve before Phase 2** | Document post-reconcile deploy append for active_release refresh |
