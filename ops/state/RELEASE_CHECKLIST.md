# Release Checklist

> **Release ID:** `{{RELEASE_ID}}` (`rYYYYMMDD-<short-sha>`)  
> **Target env:** `{{production \| staging}}` · **Owner:** `human:{{NAME}}`

Copy `CURRENT_STATUS.template.md` and `DEPLOYMENT_STATE.template.md` into `ops/state/instances/{{RELEASE_ID}}/` before starting.

---

## Pre-release

- [ ] Release scope documented (commits, migrations, env changes)
- [ ] `git sha` recorded: `{{GIT_SHA}}`
- [ ] No open `rollback` lock (Phase 2+: check ledger)
- [ ] Migrations reviewed — new migration files identified: `{{yes \| no}}`
- [ ] If schema change: plan manual `migration:run` **after** deploy (Railway does not auto-run)
- [ ] Env delta list (names only): `{{list or none}}`
- [ ] Secrets present in Railway (names verified, not values): JWT_*, DATABASE_URL, DB_SYNC=false
- [ ] `lifecycle.state`: set intent to `planned` → record in journal

---

## Staging validation

_Skip if no staging service — document waiver in journal._

- [ ] Deploy to staging target (or local prod-like)
- [ ] `GET /health` → `200`
- [ ] Auth register/login smoke
- [ ] Feature-specific checks: `{{list}}`
- [ ] `lifecycle.state`: `staging` → `validating`

---

## Smoke tests

Run against target URL before production gate:

| # | Test | Command / path | Pass |
|---|------|----------------|------|
| 1 | Health | `GET /health` | ☐ |
| 2 | Register | `POST /api/v1/auth/register` | ☐ |
| 3 | Login | `POST /api/v1/auth/login` | ☐ |
| 4 | Authenticated route | `GET /api/v1/...` + Bearer | ☐ |
| 5 | CORS (if frontend ready) | Browser or curl with Origin | ☐ |

- [ ] Migration observe (if run): exit code 0, tables expected
- [ ] `verification.state`: `passed` or stop and mark `failed`

---

## Rollback verification (pre-gate)

- [ ] Known-good rollback target identified **before** prod deploy:
  - Previous release ID: `{{RELEASE_ID}}`
  - Previous SHA: `{{GIT_SHA}}`
  - Previous Railway deployment ID: `{{ID}}`
- [ ] `ROLLBACK_CHECKLIST.md` reviewed by operator
- [ ] Rollback target recorded in CURRENT_STATUS template

---

## Production gate

> **Human approval required** — CI cannot pass this gate alone.

- [ ] Owner explicit approve: `human:{{NAME}}` at `{{ISO8601_UTC}}`
- [ ] `lifecycle.state`: `promoted` (or hotfix waiver noted)
- [ ] CORS / FRONTEND_URL aligned if frontend deploying
- [ ] No active SEV1/SEV2 incidents
- [ ] Deploy baton handed to CI: push `main` or manual `railway up` per policy

**Hotfix waiver (if skipping staging):** document reason in journal — still requires smoke + human gate.

---

## Post-release verification

- [ ] CI deploy completed (`deploy-railway.yml` success)
- [ ] Railway deployment ID recorded
- [ ] `GET {{BACKEND_URL}}/health` → `200`, `"status":"ok"`
- [ ] Smoke tests re-run on production URL
- [ ] If migrations pending: `railway run npm run migration:run` + verify
- [ ] Append DEPLOYMENT_STATE journal entry
- [ ] Update root `CURRENT_STATUS.md` / `DEPLOYMENT_STATE.md` (until OSCTL projects)
- [ ] Phase 2+: ingest `deploy.observed`, `health.observed`, `osctl project`, `osctl verify`
- [ ] `lifecycle.state`: `production`
- [ ] Archive previous release status → `archived` in journal

---

## Sign-off

| Gate | Name | UTC |
|------|------|-----|
| Production approver | | |
| Post-release verifier | | |

**Reference:** `GOVERNANCE.md`, `ops/osctl/CI_INTEGRATION_PLAN.md`
