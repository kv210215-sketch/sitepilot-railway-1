# Weekly Reconciliation

> **Frequency:** Once per week (fixed day recommended: Monday UTC)  
> **Duration target:** 30–45 minutes  
> **Owner:** Release owner or designated ops lead

## Purpose

Detect drift between **what happened**, **what was recorded**, and **what docs claim** — before it causes silent prod risk.

---

## Reconciliation Agenda

```
1. Deployments vs ledger (or journal)
2. Unrecorded deploys
3. Rollback references
4. Incidents review
5. Operational drift
6. Actions + owners
```

---

## 1. Reconcile Deployments vs Ledger

**Phase 1.5 (manual):**

| Source A | Source B | Match |
|----------|----------|-------|
| Railway deployment history (7 days) | Root `DEPLOYMENT_STATE.md` entries | ☐ |
| GitHub Actions `deploy-railway.yml` runs | Journal release IDs | ☐ |
| Git `main` merge commits | Documented git SHA per release | ☐ |

**Phase 2+:** Compare Railway history to `ops/osctl/ledger/*.jsonl` `deploy.observed` events.

**Mismatch:** Create SEV3 incident or journal correction entry (append-only — note superseding prior doc).

---

## 2. Detect Unrecorded Deploys

For each Railway deployment in window:

- [ ] Exists matching RELEASE_ID in `ops/state/instances/` or DEPLOYMENT_STATE journal?
- [ ] CURRENT_STATUS active release updated?
- [ ] Unexpected deploy source (not GitHub Actions)?

**Unrecorded deploy:** SEV3 minimum — document how it happened · fix process gap.

---

## 3. Validate Rollback References

- [ ] CURRENT_STATUS rollback target matches last known-good journal entry
- [ ] No orphaned `lifecycle.state: rollback` without active incident
- [ ] Last rollback drill / real rollback has reconciled entry
- [ ] Railway deployment IDs in docs still exist in dashboard (not purged)

**Stale rollback target:** Update before next prod GO.

---

## 4. Review Incidents

Open incidents: `ops/state/instances/inc-*/`

| Check | Action |
|-------|--------|
| SEV1/SEV2 still open | Escalate · assign owner + date |
| Postmortem missing for SEV1/SEV2 | Schedule within 5 business days |
| Prevention follow-ups (PF*) | Track to done or re-prioritize |
| Incident severity still accurate | Reclassify if needed |

Close loop: resolved incidents archived · linked in weekly notes.

---

## 5. Validate Operational Drift

| Area | Check |
|------|-------|
| Env vars (names) | Journal vs Railway vs `backend/.env.example` |
| CORS / FRONTEND_URL | Aligned or waived |
| CI config | Frontend job still intentionally disabled? |
| Deploy channel | GitHub App auto-deploy still OFF? |
| Health URL | Still valid Railway domain |
| Context MD staleness | `CURRENT_STATUS.md` verified date >7 days? |
| Known blockers | Still accurate or resolved? |

**Drift log:** Table of findings → owner → due date.

---

## 6. Weekly Output

Produce short note (path: `ops/state/instances/weekly-YYYY-Www/reconciliation.md`):

```text
Week: YYYY-Www
Reviewer: human:<NAME>
Deployments recorded: N/M match
Unrecorded deploys: 0 | list
Open incidents: count by severity
Drift items: count
Actions: [owner: action due]
```

Phase 2+: ingest as `note.human` with `event_kind: weekly_reconciliation`.

---

## Escalation from Reconciliation

| Finding | Escalation |
|---------|------------|
| Unrecorded prod deploy | SEV3 incident + owner review |
| Rollback target missing | Block next GO until fixed |
| SEV1/SEV2 open >SLA | Owner + stakeholder notify |
| Secret name missing in Railway | SEV2 until verified |

---

## References

- `ops/rituals/DAILY_OPERATIONS.md`
- `ops/osctl/CI_INTEGRATION_PLAN.md` Phase 3 verify
- Root `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md`
