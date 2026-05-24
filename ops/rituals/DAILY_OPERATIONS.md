# Daily Operations Ritual

> **Frequency:** Every operating day before any deploy or prod change  
> **Duration target:** 10–15 minutes  
> **Owner:** On-call operator (human)

## Purpose

Establish situational awareness before touching production. No deploy starts without completing this flow.

---

## Operator Startup Flow

```
1. Read CURRENT_STATUS
2. Validate deployment baton
3. Check unresolved incidents
4. Confirm rollback target exists
5. Review environment drift
6. Record "daily clear" or escalate blockers
```

---

## Step 1 — Read CURRENT_STATUS First

**Sources (in order):**

1. Root `CURRENT_STATUS.md`
2. Latest `ops/state/instances/*/CURRENT_STATUS.md` (if release active)
3. Root `DEPLOYMENT_STATE.md` (last journal entry)

**Extract:**

| Field | Action if missing/stale |
|-------|-------------------------|
| Active release ID | Stop — reconcile before deploy |
| Lifecycle state | Must not be `rollback` without active operator |
| Last verified UTC | If >7 days, run health smoke today |
| Known blockers | Treat P0/P1 as deploy freeze |

---

## Step 2 — Validate Deployment Baton

From CURRENT_STATUS **Deployment Baton** section (or infer):

| Check | Pass criteria |
|-------|---------------|
| Baton holder identified | Named human or `ci:deploy-railway` |
| Pending action explicit | `none`, `deploy`, `verify`, or `rollback` only |
| No conflicting holders | Two operators not both holding `deploy` |
| CI not mid-flight | GitHub Actions `deploy-railway.yml` not running unless expected |

**If baton ambiguous:** Run `HANDOFF_PROTOCOL.md` before any release work.

---

## Step 3 — Check Unresolved Incidents

- Scan `ops/state/instances/inc-*/INCIDENT_LOG.md` (if any)
- Status must not be `open` or `mitigating` for SEV1/SEV2 during planned deploy
- SEV3: deploy allowed only with documented waiver in journal

| Severity | Daily action |
|----------|--------------|
| SEV1 open | **Deploy freeze** |
| SEV2 open | Deploy freeze unless hotfix for that incident |
| SEV3 open | Review at standup; note in daily log |
| SEV4 open | Monitor only |

---

## Step 4 — Validate Rollback Target Exists

Before any prod-bound work, confirm documented rollback target:

| Field | Required |
|-------|----------|
| Previous known-good release ID | Yes |
| Previous git SHA | Yes |
| Railway deployment ID (or waiver) | Yes for prod |
| Rollback lock | Must be `released` or `n/a` |

**If missing:** Update from Railway dashboard → last successful deployment → record in CURRENT_STATUS before proceeding.

---

## Step 5 — Review Environment Drift

Compare documented vs expected (names only — never log secret values):

| Check | Source A | Source B |
|-------|----------|----------|
| `DB_SYNC` | `DEPLOYMENT_STATE.md` | Railway vars = `false` |
| `CORS_ORIGINS` | Journal | Matches `FRONTEND_URL` or documented waiver |
| Required keys present | `backend/.env.example` | Railway: JWT_*, DATABASE_URL |
| Deploy channel | `MASTER_CONTEXT.md` | GitHub App auto-deploy OFF |
| CI frontend job | `deploy-railway.yml` | Still disabled unless journal updated |

**Drift found:** Log in DEPLOYMENT_STATE journal entry or incident (SEV3 process) — do not deploy until reconciled or waived.

---

## Step 6 — Daily Clear or Escalate

**Daily clear (all pass):**

- Note in operator log: `daily-clear YYYY-MM-DD operator:NAME`
- Baton unchanged or explicitly transferred

**Escalate (any fail):**

- Open/update incident per `INCIDENT_TRIAGE.md`
- Notify release owner
- Do not push to `main` for deploy until cleared

---

## Quick Health Probe (optional daily)

```text
GET https://sitepilot-railway-production.up.railway.app/health
Expect: 200, "status":"ok"
```

Failure on daily probe → SEV2 triage minimum.

---

## References

- `ops/state/GOVERNANCE.md`
- `ops/rituals/HANDOFF_PROTOCOL.md`
- `ops/rituals/PRODUCTION_GO_NO_GO.md`
