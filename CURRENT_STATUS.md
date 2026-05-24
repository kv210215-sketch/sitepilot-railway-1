# SitePilot Backend — Current Status

> **NON-CANONICAL — LEGACY OPERATIONAL SUMMARY**
>
> **Do not treat this file as authoritative operational truth.**
>
> **Canonical source of truth:** [`ops/state/projections/CURRENT_STATUS.md`](ops/state/projections/CURRENT_STATUS.md) (ledger-derived, generated-only).
>
> **Verify-first:** Run `python -m ops.osctl.core verify` before acting on operational status. Do not trust manual summaries without verification.

---

> Last verified against repo docs: `BUILD_STATUS.md`, `DEPLOY_CHECKLIST.md`, `RAILWAY_DEPLOY.md` (2026-05-02 reports)

## Repository State

| Item | Status |
|------|--------|
| Layout | Monorepo: `backend/`, `frontend/`, `deploy/`, legacy `sitepilot/` copy |
| Active backend | `backend/` (NestJS, TypeORM, 15 feature modules) |
| Deploy config | `backend/railway.toml`, `backend/Dockerfile`, `.github/workflows/deploy-railway.yml` |
| Context docs | `RAILWAY_DEPLOY.md`, `BUILD_STATUS.md`, `DEPLOY_CHECKLIST.md`, `verify-deployment.sh` |
| Root README | **None** — deployment docs are the source of truth |

**Documented last deploy (2026-05-02):** backend SUCCESS on Railway; health 200 at `/health`.

## Active Infra Assumptions

- Railway project `triumphant-purpose`, service `sitepilot-railway`, environment `production`
- PostgreSQL plugin linked → `DATABASE_URL` on backend service
- Root directory for Railway backend: **`backend/`** (matches GitHub Actions `working-directory`)
- Deploy channel: push to `main` → GitHub Actions → `railway up` (Railway GitHub App auto-deploy **OFF**)
- `RAILWAY_TOKEN` in GitHub secrets = project-scoped token
- Node 20, Nixpacks build, start `npm run start:prod`
- Frontend **not** deployed by CI (`deploy-frontend` job disabled)

## Likely Deployment Status

| Component | Likely state |
|-----------|--------------|
| Backend API | Deployed and healthy per May 2026 report |
| PostgreSQL | Connected via Railway plugin |
| Migrations | **Manual** — must have been run once; not auto on boot |
| Frontend on Railway | Unknown / not in CI — may be manual or not deployed |
| Stripe / Tilda / AI keys | Optional — likely unset in prod unless configured post-deploy |
| Email (SMTP/Redis) | Not in `.env.example`; Railway Redis not documented for backend |

## Unfinished Areas

- **Frontend CI deploy** — workflow job exists but `if: false`
- **CORS lockdown** — checklist expects `CORS_ORIGINS=*` initially, then frontend URL
- **Notifications stack** — `NotificationsModule` uses Bull + Mailer; deps **not** in `package.json`; SMTP/Redis env vars undocumented
- **Movies/Mongo** — `MoviesModule` not imported in `AppModule`
- **Duplicate `sitepilot/` tree** — may drift from `backend/`; docs inconsistently reference `sitepilot/backend`
- **`railway.json`** — referenced in `verify-deployment.sh` / `BUILD_STATUS.md` but **not present** in repo
- **Production smoke tests** — documented in checklist, not automated in CI beyond optional health curl

## Suspected Risks

| Risk | Detail |
|------|--------|
| Missing migration run | App starts (health OK) but API fails on missing tables |
| `DB_SYNC=true` in prod | `validateEnv` blocks startup — intentional safety |
| Env mismatch | `FRONTEND_URL`, `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL` out of sync → auth/CORS failures |
| Notifications deps | `@nestjs/bull`, `@nestjs-modules/mailer` imported but absent from `package.json` — build/runtime risk |
| `Template` entity in `app.module.ts` | Referenced in TypeORM entities array without visible import — possible TS/build issue |
| Playwright on Railway | Publish jobs may fail without browser deps / sufficient memory |
| Stale status docs | `BUILD_STATUS.md` claims clean git + zero TS errors — may predate recent module changes |
| Path confusion | Agents editing `sitepilot/backend` instead of `backend/` |

## Known Blockers

- **None confirmed live** — last documented deploy succeeded
- **Potential blockers for full product launch:**
  - Frontend not wired into CI deploy
  - Migrations not automated — new environments need manual `railway run npm run migration:run`
  - Notifications/email requires Redis + SMTP + missing npm deps before production use
  - Billing/Tilda/AI require secrets not set in base Railway vars
