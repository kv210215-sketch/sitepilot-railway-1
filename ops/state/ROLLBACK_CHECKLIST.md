# Rollback Checklist

> **Use when:** prod regression, failed smoke, or `lifecycle.state: rollback`  
> **Authority:** Human owner only — see `GOVERNANCE.md`

**Release under rollback:** `{{RELEASE_ID}}` · **Incident:** `{{INCIDENT_ID|n/a}}` · **Started:** `{{ISO8601_UTC}}`

---

## 1. Declare rollback

- [ ] Confirm incident severity warrants rollback (SEV1/SEV2 or human policy)
- [ ] Identify **rollback target** (known-good):
  - [ ] Ledger seq: `{{SEQ}}` (Phase 2+) or documented release: `{{RELEASE_ID}}`
  - [ ] Git SHA: `{{GIT_SHA}}`
  - [ ] Railway deployment ID: `{{RAILWAY_DEPLOYMENT_ID}}`
- [ ] Notify stakeholders (minimal: owner + active operator)
- [ ] Copy `INCIDENT_LOG.template.md` → active incident file
- [ ] Phase 2+: ingest `rollback.marked` + `lock.acquired` (`lock_name: rollback`)

---

## 2. Halt forward deploy

- [ ] Do **not** merge deploy-fix PRs until rollback path clear
- [ ] Verify no concurrent CI deploy running (`deploy-railway.yml`)
- [ ] If rollback lock active: no new success `deploy.observed` until released

---

## 3. Execute external rollback

**Railway (primary):**

- [ ] Railway dashboard → `sitepilot-railway` → Deployments
- [ ] Redeploy **known-good** deployment artifact (not git revert alone)
- [ ] Confirm service status `Active`

**Env vars (if regression env-related):**

- [ ] Revert Railway variables to known-good set (names documented in journal)
- [ ] Wait for auto-redeploy to complete

**Database (if schema involved):**

- [ ] Assess whether `migration:revert` required — **separate human decision**
- [ ] If revert: `railway run npm run migration:revert` (one step at a time)
- [ ] Record outcome in incident log — OSCTL does not auto-revert schema

**VPS path (if applicable):**

- [ ] `./scripts/deploy.sh --rollback` per `deploy/README.md`

---

## 4. Verify rollback

- [ ] `GET {{BACKEND_URL}}/health` → `200`, `"status":"ok"`
- [ ] `POST {{BACKEND_URL}}/api/v1/auth/login` → `200` + token
- [ ] CORS check with real frontend origin (if frontend live)
- [ ] Critical business path: `{{define}}`
- [ ] Record results in incident log smoke section

---

## 5. Reconcile state

- [ ] Update `CURRENT_STATUS` projection (manual or `osctl project`)
- [ ] Append `DEPLOYMENT_STATE` journal entry (`lifecycle.state: reconciled`)
- [ ] Phase 2+: ingest `lock.released` + `note.human` (reconcile summary)
- [ ] Close or downgrade incident severity

---

## 6. Forward fix (after stable)

- [ ] Root cause documented in incident log
- [ ] Fix developed on branch — **not** hot-pushed without checklist
- [ ] Run `RELEASE_CHECKLIST.md` for re-deploy
- [ ] Release rollback lock only after human sign-off

---

## Sign-off

| Role | Name | UTC timestamp | Notes |
|------|------|---------------|-------|
| Rollback authority | | | |
| Verification | | | |

**Forbidden:** Agent-initiated rollback without human approval · Auto DB revert without assessment
