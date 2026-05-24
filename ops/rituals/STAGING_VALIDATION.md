# Staging Validation

> **When:** Before production approval in `DEPLOY_RITUAL.md`  
> **Skip policy:** Document waiver in release journal if no staging service

## SitePilot Context

- Primary prod: Railway `sitepilot-railway` · `backend/` root
- Staging service: **not provisioned by default** — use one of:
  - Local prod-like (`docker-compose` postgres + local backend against migrated DB)
  - Dedicated Railway staging service (future)
  - Pre-approval prod read-only probes only (health/public endpoints — limited)

---

## 1. Health Validation

| Check | Command | Pass |
|-------|---------|------|
| Liveness | `GET <BASE_URL>/health` | HTTP 200 |
| Body status | JSON `status` | `ok` (not `starting` sustained >2 min) |
| Env field | JSON `env` | Matches target (`production` / `staging`) |
| Latency | Response time | <3s |

**Fail:** Stop validation · set `verification.state: failed` · do not promote.

---

## 2. API Validation

Base path: `<BASE_URL>/api/v1`

| # | Endpoint | Method | Pass |
|---|----------|--------|------|
| 1 | `/health` (outside prefix) | GET | 200 |
| 2 | `/auth/register` | POST | 201 or 409 (duplicate ok) |
| 3 | `/auth/login` | POST | 200 + `accessToken` |
| 4 | Authenticated resource | GET | 200 with Bearer token |

Use test credentials — not production admin unless intentional admin smoke.

---

## 3. Smoke Tests

Minimum bundle (same as deploy ritual):

```text
health → register → login → authenticated GET
```

Extended (when release touches):

| Area | Smoke |
|------|-------|
| Projects | `GET /projects` with token |
| Pages | `GET /pages` or project-scoped list |
| Billing | Skip if Stripe keys unset |
| Publish | Dry-run or sim mode only |

Record pass/fail + UTC in release instance DEPLOYMENT_STATE entry.

---

## 4. Migration Validation

If release includes new TypeORM migrations:

| Step | When | Pass |
|------|------|------|
| Review migration files | Pre-deploy | Owner reviewed |
| Run `npm run migration:run` | Post-deploy on target env | Exit 0 |
| Log output | After run | "All migrations have been run successfully" |
| Table sanity | Optional | Expected tables exist |

**Staging:** Run migrations on staging DB before prod when staging exists.

**Prod:** Migrations **manual** after deploy — Railway does not auto-run.

---

## 5. Env Consistency Checks

Names only — compare journal vs runtime source:

| Variable | Expected |
|----------|----------|
| `NODE_ENV` | `production` on prod |
| `DB_SYNC` | `false` |
| `DATABASE_URL` | present |
| `JWT_SECRET` | present |
| `JWT_REFRESH_SECRET` | present |
| `CORS_ORIGINS` | not `*` unless waived |
| `API_PREFIX` | `api/v1` |

**Drift:** Block promotion until documented or fixed.

---

## 6. Deployment Diff Checks

Before promote, confirm deploy artifact matches intent:

| Check | Source |
|-------|--------|
| Git SHA | Release scope = deployed commit |
| Service | `sitepilot-railway` |
| Root dir | `backend/` |
| Workflow | `deploy-railway.yml` only (GitHub App auto-deploy OFF) |
| New env vars | Listed in release journal delta |
| Schema delta | Migrations enumerated |

**Diff method (manual Phase 1.5):**

```text
git log -1 --format=%H          → matches RELEASE_ID sha
Railway deployment commit     → matches (dashboard)
```

Phase 2+: `deploy.observed` event refs.

---

## Validation Outcome

| Result | Next |
|--------|------|
| All pass | `lifecycle.state: validating` → seek `promoted` |
| Any fail | `failed` · incident if prod-impacting · no GO |

---

## References

- `ops/rituals/DEPLOY_RITUAL.md`
- `ops/rituals/PRODUCTION_GO_NO_GO.md`
- `backend/.env.example`
- `DEPLOYMENT_STATE.md`
