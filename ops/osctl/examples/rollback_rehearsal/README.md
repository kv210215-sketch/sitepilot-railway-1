# Rollback Rehearsal — Rehearsal

**Environment:** production  
**Events:** 4  
**Fingerprint:** `ab0ab863d20ed1f16495dfc106b95c2fe6fdbad13ac10548f5cef65045764b88`

---

## 1. Scenario Description

| Field | Value |
|-------|-------|
| What happened | Good prod deploy; bad prod deploy; SEV2 incident; rollback marked — **execution not performed** |
| Environment | `production` |
| Expected lifecycle end | `rollback` |
| Expected ledger events | 2 × `deploy.recorded`, 1 × `incident.recorded`, 1 × `rollback.recorded` |

Records rollback **intent and target**. Does not execute Railway redeploy.

---

## 2. Event Sequence

```text
None → production       (seq 1, good deploy)
production → failed     (seq 2, bad deploy observe)
(incident open)         (seq 3, SEV2 — no lifecycle change)
failed → rollback       (seq 4, human marks rollback to seq 1)
```

---

## 3. Example Ledger

See `events.jsonl`.

---

## 4. Replay Result

```bash
python -m ops.osctl.core replay \
  --ledger ops/osctl/examples/rollback_rehearsal/events.jsonl \
  --output ops/osctl/examples/rollback_rehearsal/projections
```

| Output | Key fields |
|--------|------------|
| `CURRENT_STATUS.generated.md` | `rollback_active: yes`, target seq 1, lifecycle `rollback`, blocker B1 |
| `DEPLOYMENT_STATE.generated.md` | 3 journal entries + rollback pointers section |

Excerpt — Rollback Target:

```markdown
| Rollback active | `yes` |
| Target ledger seq | `1` |
| Target release ID | `r20260524-prod-good` |
```

---

## 5. Verify Result

| Check | Result |
|-------|--------|
| Schema | PASS |
| Transitions | PASS |
| Rollback target | PASS (seq 1 exists, successful deploy) |
| Replay consistency | PASS |
| **Overall** | **PASS** |

---

## 6. Human Checkpoints

| Checkpoint | Actor | This scenario |
|------------|-------|---------------|
| GO/NO-GO | Human | N/A — response to failure |
| **Rollback approval** | **Human** | **seq 4** — before append |
| **Severity classification** | **Human** | **seq 3** — SEV2 |
| Reconcile attestation | Human | **Not yet** — rollback posture active |
| Rollback execution | Human | **External** — Railway dashboard (not performed) |

---

## 7. Drift Scenarios

| Drift type | Risk |
|------------|------|
| Unrecorded deploy | Railway rolled back manually; ledger still `rollback` |
| Stale projection | Rollback marked; operator skips replay |
| Missing verify | Target seq wrong — verify catches missing target |

---

## 8. Recovery Semantics

Next steps (see `reconcile_flow/`):

```text
rollback → reconciled  (after external rollback + smoke)
```

Verify-after-replay required before trusting projections:

```bash
python -m ops.osctl.core replay ...
python -m ops.osctl.core verify ...
```

Incident escalation: SEV2 open at seq 3 — remains until reconcile scenario.

---

## 9. Operator Ergonomics

| Area | Observation |
|------|-------------|
| Confusing steps | Rollback recorded but `active_release_id` still shows bad deploy (seq 2) |
| Naming friction | `rollback.recorded` vs "rollback executed" — ledger does not distinguish |
| Replay readability | Rollback pointers section is clear |
| Projection usability | Blockers + rollback target visible — good |
| Reconciliation complexity | **High** — requires external action not reflected until reconcile |

---

## 10. Final Assessment

| | |
|-|-|
| **Worked** | Rollback target validation; rollback_active in projection |
| **Ambiguous** | Active release fields vs rollback target fields — operator must read both sections |
| **Improve before Phase 2** | Runbook step: "rollback.recorded ≠ rollback done" banner in ritual docs |
