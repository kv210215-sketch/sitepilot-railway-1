# FIRST STAGING DEPLOYMENT CHECKLIST

Repo: `sitepilot-railway` · Branch: `feature/parity-harness-p1` · Ref: `21f9f7b` · Target: Railway **staging** only

## 1. Pre-Deployment Checks
- [ ] On branch `feature/parity-harness-p1` at commit `21f9f7b`
- [ ] Railway **staging** environment created (separate from production)
- [ ] No production services/tokens linked to staging
- [ ] Dedicated staging Postgres plugin provisioned
- [ ] Fresh `JWT_SECRET` generated (`openssl rand -hex 32`)
- [ ] Fresh `JWT_REFRESH_SECRET` generated (`openssl rand -hex 32`)
- [ ] Staging hostnames known (backend / marketing-web / frontend)

## 2. Railway Variables
- [ ] Backend `DATABASE_URL` points at staging Postgres plugin only
- [ ] Backend `JWT_SECRET` set
- [ ] Backend `JWT_REFRESH_SECRET` set
- [ ] Backend `PUBLIC_API_ENABLED=true`
- [ ] Backend `DB_SYNC=false`
- [ ] Backend `NODE_ENV=staging`
- [ ] Backend `CORS_ORIGINS` = marketing-web (and frontend, if used) staging host(s)
- [ ] Backend `FRONTEND_URL` set
- [ ] Backend `LEAD_SINK=sandbox`
- [ ] Marketing-web `NEXT_PUBLIC_PUBLIC_API_URL` = backend staging host
- [ ] Marketing-web `NEXT_PUBLIC_SITE_ORIGIN` = marketing-web staging host
- [ ] Marketing-web `MARKETING_FORCE_NOINDEX=true`
- [ ] Frontend `NEXT_PUBLIC_API_URL` = backend staging host (set BEFORE first build)
- [ ] Frontend `NODE_ENV=production`

## 3. Backend Deployment
- [ ] Service root = `backend/`
- [ ] Build command `npm install && npm run build` succeeds
- [ ] Start command `npm run start:prod` runs
- [ ] Service reaches running state
- [ ] `GET /health` returns `200`

## 4. Database Migration
- [ ] `railway run --service <backend> npm run migration:run` completes with no errors
- [ ] 4 migrations applied
- [ ] `GET /health` returns `db:"up"`
- [ ] (Optional) `npm run seed:local-staging-public` completed

## 5. Marketing-web Deployment
- [ ] Service root = `marketing-web/`
- [ ] Build command `npm ci && npm run build` succeeds
- [ ] Start command `npx next start -H 0.0.0.0 -p $PORT` runs
- [ ] Service reaches running state
- [ ] `GET /` returns `200`

## 6. Frontend Deployment (optional)
- [ ] `NEXT_PUBLIC_API_URL` confirmed set before build
- [ ] Backend `CORS_ORIGINS` includes frontend staging host
- [ ] Service root = `frontend/`
- [ ] Build command `npm ci && npm run build` succeeds
- [ ] Start command `npm run start` runs
- [ ] `GET /` returns `200`

## 7. Smoke Tests
- [ ] Backend `GET /health` returns `200` with `db:"up"`
- [ ] `POST /api/v1/auth/register` returns tokens
- [ ] `POST /api/v1/auth/login` returns access + refresh tokens
- [ ] `GET /api/v1/auth/me` (Bearer) returns `200`
- [ ] `GET /api/v1/organizations` (Bearer) returns `200`
- [ ] `GET /api/v1/projects` (Bearer) returns `200`
- [ ] `POST /api/v1/projects` (Bearer) returns `201`
- [ ] `GET /public/v1/sitemap-entries` returns `200`
- [ ] Marketing-web `GET /` returns `200`
- [ ] Marketing-web public page renders correctly
- [ ] `GET /robots.txt` returns `Disallow: /`
- [ ] `GET /sitemap.xml` returns `200`
- [ ] SEO tags present in homepage `<head>`
- [ ] (Optional) Frontend login succeeds
- [ ] (Optional) Frontend dashboard loads with no API errors
- [ ] (Optional) Frontend create project succeeds
- [ ] (Optional) Frontend create page succeeds

## 8. Rollback Triggers
- [ ] Backend build/boot fails → redeploy previous deployment
- [ ] `[Config] Missing required environment variables` at boot → set vars, redeploy
- [ ] `/health` returns `db:"down"` → fix `DATABASE_URL`, restart backend
- [ ] Migration error → `npm run migration:revert` (repeat per step)
- [ ] Marketing-web pages empty/500 → verify `NEXT_PUBLIC_PUBLIC_API_URL` + `PUBLIC_API_ENABLED`, redeploy
- [ ] Frontend API calls fail → fix `NEXT_PUBLIC_API_URL`, REBUILD (not restart)
- [ ] CORS errors → add host to backend `CORS_ORIGINS`, redeploy
- [ ] Full DB reset (staging only) → drop + reprovision plugin, re-migrate

## 9. Success Criteria
- [ ] Backend healthy (`/health` 200, `db:"up"`)
- [ ] All 4 migrations applied
- [ ] Required env vars set; boot did not throw
- [ ] Auth works (register + login + me)
- [ ] Project creation works (201)
- [ ] Public API enabled (`/public/v1/*` 200)
- [ ] Public page renders
- [ ] SEO tags visible and noindex active (`Disallow: /`)
- [ ] No 500 responses across services
- [ ] (Optional) Admin UI flows work end to end
- [ ] Isolation confirmed: dedicated staging DB, staging hosts only, no production hosts/tokens
