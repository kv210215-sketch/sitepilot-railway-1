# FIRST STAGING DEPLOYMENT RUNBOOK — SitePilot

> **Mode:** Read-only planning. This document plans the deployment; it performs none of it.
> **Repo:** `D:\Projects\SitePilot\sitepilot-railway` · **Branch:** `feature/parity-harness-p1` · **Ref commit:** `21f9f7b`
> **Scope:** Railway **staging** environment only. Production, Cloudflare, and DNS are out of scope and untouched.
> **Verdict:** ✅ **READY FOR FIRST STAGING DEPLOYMENT** (see §8). Caveats are documented, not blocking.

All claims below are backed by file evidence in this repo at commit `21f9f7b`. No speculation.

---

## 1. Architecture Overview

```
            ┌──────────────────────── Railway: environment "staging" ───────────────────────┐
            │                                                                                 │
  Admin ───▶│  frontend (Next.js dashboard)  ──HTTPS, JWT──▶  backend (NestJS API)            │
            │   root: frontend/                                 root: backend/                │
            │   NEXT_PUBLIC_API_URL ───────────────────────────▶ /api/v1/*  (JWT-protected)   │
            │                                                       │                          │
  Public ──▶│  marketing-web (Next.js SSR) ──HTTPS──▶ /public/v1/*  │ (gated by               │
            │   root: marketing-web/        NEXT_PUBLIC_PUBLIC_API_URL   PUBLIC_API_ENABLED)   │
            │                                                       │                          │
            │                                          Postgres plugin (DATABASE_URL)         │
            └─────────────────────────────────────────────────────────────────────────────────┘
```

**Evidence**
- Topology graph: [docs/lr3/railway-staging-topology.md](docs/lr3/railway-staging-topology.md) (backend + marketing-web + Postgres staging graph).
- Backend exposes a global prefix `api/v1`, **excluding** `public/v1/*` from the prefix — [backend/src/main.ts:77-79](backend/src/main.ts).
- Public read API is gated by `PUBLIC_API_ENABLED` — [backend/src/config/configuration.ts:75-88](backend/src/config/configuration.ts).
- Marketing-web reads the backend through `NEXT_PUBLIC_PUBLIC_API_URL` and hits `/public/v1/pages/*` — [marketing-web/lib/public-api.ts:57-59,92-104](marketing-web/lib/public-api.ts).
- Frontend dashboard reads the backend through `NEXT_PUBLIC_API_URL` — [frontend/src/lib/api-client.ts:8](frontend/src/lib/api-client.ts), [frontend/next.config.js:4](frontend/next.config.js).

**Note on frontend status:** The topology doc ([railway-staging-topology.md:42](docs/lr3/railway-staging-topology.md)) labels `frontend/` as *"Not staging target"*. However, the repo ships a complete staging config for it ([frontend/railway.toml](frontend/railway.toml) + [frontend/.env.railway.staging.example](frontend/.env.railway.staging.example)). This runbook treats frontend as an **optional but fully-supported** staging service. The minimum public-facing staging set is **backend + marketing-web + Postgres**; deploy frontend if the admin UI is in scope for this staging round.

---

## 2. Railway Services (Phase 1 — Inventory)

| Service | Purpose | Source Dir | Build Command | Start Command | Health Endpoint | Dependencies |
|---|---|---|---|---|---|---|
| **backend** | NestJS REST API (auth, orgs, projects, pages, public read API) | `backend/` | `npm install && npm run build` | `npm run start:prod` (`node dist/main.js`) | `GET /health` (200, outside `api/v1` prefix) | Postgres (`DATABASE_URL`) |
| **marketing-web** | Public SSR site (renders published pages, sitemap, robots) | `marketing-web/` | `npm ci && npm run build` | `npx next start -H 0.0.0.0 -p $PORT` | `GET /` (200) | backend `/public/v1/*` |
| **frontend** *(optional)* | Admin dashboard (login, projects, pages) | `frontend/` | `npm ci && npm run build` | `npm run start` (`next start -H 0.0.0.0`) | `GET /` (200) | backend `/api/v1/*` |
| **Postgres** | Staging-isolated database plugin | Railway plugin | — | — | — (Railway plugin) | none |

**Evidence**
- backend build/start/health: [backend/railway.toml:1-10](backend/railway.toml); start script `start:prod = node dist/main.js`; health route [backend/src/main.ts:56-74](backend/src/main.ts).
- marketing-web build/start/health: [marketing-web/railway.toml:5-15](marketing-web/railway.toml).
- frontend build/start/health: [frontend/railway.toml:1-11](frontend/railway.toml).
- Postgres is a Railway plugin, one per environment — [railway-staging-topology.md:41](docs/lr3/railway-staging-topology.md).

**Health endpoint is deploy-robust:** backend starts a *pre-start* HTTP server answering `/health` with `200 {status:"starting"}` while TypeORM connects, then hands off to the Nest `/health` route that also probes the DB (`SELECT 1`, 1s timeout) and reports `db: "up"|"down"` — [backend/src/main.ts:22-38,56-74](backend/src/main.ts). Railway healthcheck timeout is 30s ([backend/railway.toml:8](backend/railway.toml)).

---

## 3. Variables Matrix (Phase 2)

Source of truth = the committed staging examples. Railway auto-injects `PORT` for every service and `DATABASE_URL` when a Postgres plugin is linked.

### 3.1 Backend variables — source: [backend/.env.railway.staging.example](backend/.env.railway.staging.example)

| Name | Required? | Example Value | Purpose |
|---|---|---|---|
| `DATABASE_URL` | **Required** (or `DB_HOST`+user+pass) | `postgresql://<user>:<pw>@<staging-host>:5432/railway` | DB connection. Auto-injected by linked staging Postgres. Validated at boot. |
| `JWT_SECRET` | **Required** | `<openssl rand -hex 32>` | Access-token signing. Boot fails if missing. |
| `JWT_REFRESH_SECRET` | **Required** | `<openssl rand -hex 32>` | Refresh-token signing. Boot fails if missing. |
| `PUBLIC_API_ENABLED` | **Required on staging** | `true` | Enables `/public/v1/*` for marketing-web. |
| `CORS_ORIGINS` | **Required** | `https://<MARKETING_STAGING_HOST>` | Comma-separated allowed origins. Default is `http://localhost:3000` if unset. |
| `FRONTEND_URL` | Recommended | `https://<MARKETING_STAGING_HOST>` | Used for app-generated URLs. |
| `NODE_ENV` | Recommended | `staging` | Environment identity. Keep ≠ `production` to allow Swagger/dev logging. |
| `APP_URL` | Recommended | `https://<BACKEND_STAGING_HOST>` | Self URL. |
| `API_PREFIX` | Optional | `api/v1` | Global route prefix (default `api/v1`). |
| `PUBLIC_DEFAULT_PROJECT_SLUG` | Optional | `solomiya-energy` | Default public project. |
| `DB_SYNC` | Recommended | `false` | Must be `false`; use migrations. (Hard-blocked when `NODE_ENV=production`.) |
| `DB_LOGGING` | Optional | `false` | SQL logging. |
| `BCRYPT_ROUNDS` | Optional | `12` | Password hashing cost. |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Optional | `15m` / `7d` | Token TTLs. |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` | Optional | `60000` / `100` | Rate limiting. |
| `LEAD_SINK` | Recommended on staging | `sandbox` | Prevents real lead delivery. |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Optional (empty) | *(empty)* | Lead notifications; leave empty on staging. |
| `STRIPE_*`, `TILDA_*` | Optional (empty) | *(empty)* | Billing/automation; leave empty on staging. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Optional | `admin@staging.sitepilot.local` / … | Optional admin seed (non-prod email only). |

**Required-at-boot evidence:** `validateEnv()` throws if `JWT_SECRET`, `JWT_REFRESH_SECRET`, or `DATABASE_URL`/`DB_HOST` are missing — [backend/src/config/env.validation.ts:10-26](backend/src/config/env.validation.ts). `PUBLIC_API_ENABLED` logic — [backend/src/config/configuration.ts:76-88](backend/src/config/configuration.ts). CORS default — [backend/src/config/configuration.ts:9-12](backend/src/config/configuration.ts).

### 3.2 Marketing-web variables — source: [marketing-web/.env.railway.staging.example](marketing-web/.env.railway.staging.example)

| Name | Required? | Example Value | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_PUBLIC_API_URL` | **Required** | `https://<BACKEND_STAGING_HOST>` | Base for `/public/v1/*`. If unset, `publicApiBaseUrl()` returns `null` → public pages cannot fetch. |
| `NEXT_PUBLIC_SITE_ORIGIN` | **Required** | `https://<MARKETING_STAGING_HOST>` | Canonical / sitemap / robots origin. |
| `MARKETING_FORCE_NOINDEX` | **Required on staging** | `true` | Forces `robots.txt` to `disallow: /` (blocks crawlers). |
| `MARKETING_SITE_ORIGIN` | Optional | `https://<MARKETING_STAGING_HOST>` | Server-only origin override when proxy headers differ. |
| `NEXT_PUBLIC_SITE_NAME` / `NEXT_PUBLIC_DEFAULT_OG_IMAGE` / `NEXT_PUBLIC_DEFAULT_LOCALE` | Optional | `SitePilot Staging` / `/og-image.jpg` / `uk_UA` | SEO labels. |

**Evidence:** base-URL resolution + `null` fallback — [marketing-web/lib/public-api.ts:57-59,92-95](marketing-web/lib/public-api.ts). `MARKETING_FORCE_NOINDEX` → `disallow: '/'` — [marketing-web/lib/seo/robots.ts:9-16](marketing-web/lib/seo/robots.ts).

### 3.3 Frontend variables — source: [frontend/.env.railway.staging.example](frontend/.env.railway.staging.example)

| Name | Required? | Example Value | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Required (BUILD-TIME)** | `https://<BACKEND_STAGING_HOST>` | Backend base URL. **Inlined into the client bundle at `next build`** — must exist *before* the build; changing it requires a **rebuild**, not a restart. |
| `NODE_ENV` | Recommended | `production` | Next.js production build/runtime. |
| `NEXT_PUBLIC_APP_NAME` | Optional | `SitePilot Staging` | UI label. |
| `NEXT_TELEMETRY_DISABLED` | Optional | `1` | Disable Next telemetry. |

**Evidence:** build-time inlining warning — [frontend/.env.railway.staging.example:8-17](frontend/.env.railway.staging.example); consumed by [frontend/next.config.js:4](frontend/next.config.js) and [frontend/src/lib/api-client.ts:8](frontend/src/lib/api-client.ts).

> ⚠️ **Critical ordering rule:** Set `NEXT_PUBLIC_API_URL` on the frontend service **before its first build**. A wrong/missing value bakes a broken API base into the static bundle (see §6 / Failure: wrong `NEXT_PUBLIC_API_URL`).

---

## 4. Deployment Order (Phase 3)

Manual deploy via Railway dashboard/CLI. **There is no staging CI job** — the only deploy workflow targets production (`.github/workflows/deploy-railway.yml`, per [railway-staging-topology.md:74](docs/lr3/railway-staging-topology.md)), so staging will not auto-deploy and must be driven manually here.

| # | Action | Verification | Rollback Point |
|---|---|---|---|
| 1 | Create Railway **staging** environment (separate from production) | Environment exists; no production services linked | Delete environment (nothing live yet) |
| 2 | Provision a **dedicated** Postgres plugin in staging | Plugin healthy; `DATABASE_URL` present in staging vars | Remove plugin (no app depends yet) |
| 3 | Configure backend vars from [backend/.env.railway.staging.example](backend/.env.railway.staging.example) (generate fresh `JWT_SECRET`/`JWT_REFRESH_SECRET`; `PUBLIC_API_ENABLED=true`; `DB_SYNC=false`) | All required vars set; `DATABASE_URL` points at staging plugin only | Edit vars (no deploy yet) |
| 4 | Deploy **backend** (root `backend/`, Nixpacks) | Build succeeds; service starts | Railway → redeploy previous / stop |
| 5 | Verify backend `GET /health` | `200 {status:"ok", db:"up"}` | If `db:"down"`, fix `DATABASE_URL` before continuing |
| 6 | Run migrations: `railway run --service <backend> npm run migration:run` | 4 migrations applied, no errors | `npm run migration:revert` (per migration) |
| 7 | Verify DB state (tables exist); optional seed: `npm run seed:local-staging-public` | `migrations` table has 4 rows; seed creates public project | Revert migrations / drop+reprovision plugin |
| 8 | Configure marketing-web vars from [marketing-web/.env.railway.staging.example](marketing-web/.env.railway.staging.example) (`NEXT_PUBLIC_PUBLIC_API_URL` = backend staging host; `MARKETING_FORCE_NOINDEX=true`) | Vars set | Edit vars (no deploy yet) |
| 9 | Deploy **marketing-web** (root `marketing-web/`) | Build + start succeed on `$PORT` | Railway → redeploy previous / stop |
| 10 | Verify public render | `GET /` → 200; a published page renders; `GET /robots.txt` → `Disallow: /` | Redeploy previous marketing-web |
| 11 | *(optional)* Set backend `CORS_ORIGINS` += frontend staging host; configure frontend vars (set `NEXT_PUBLIC_API_URL` **before build**) | Vars set | Edit vars (no deploy yet) |
| 12 | *(optional)* Deploy **frontend** (root `frontend/`) | Build + start succeed | Railway → redeploy previous / stop |
| 13 | *(optional)* Verify admin UI (login → dashboard → create project → create page) | Flows succeed against staging backend | Redeploy previous frontend |

**Evidence:** migration scripts present (4) — `backend/src/database/migrations/` (`InitialSchema`, `AddUserRoleAndRefreshToken`, `CreateOrganizations`, `Stage5ProjectsAndPages`); migration/seed scripts — [backend/package.json](backend/package.json) (`migration:run`, `migration:revert`, `seed:local-staging-public`); seed file — [backend/scripts/seed-local-staging-public.ts](backend/scripts/seed-local-staging-public.ts). Startup order mirrors [railway-staging-topology.md:44-53](docs/lr3/railway-staging-topology.md).

---

## 5. Smoke Tests (Phase 4)

### Backend (base `https://<BACKEND_STAGING_HOST>`)
| Test | Request | Expected |
|---|---|---|
| Health | `GET /health` | `200 {status:"ok", env:"staging", db:"up"}` ([main.ts:56-74](backend/src/main.ts)) |
| Auth — register | `POST /api/v1/auth/register` | `201` + tokens ([auth.controller.ts:31](backend/src/modules/auth/auth.controller.ts)) |
| Auth — login | `POST /api/v1/auth/login` | `200/201` + access + refresh tokens ([auth.controller.ts:42](backend/src/modules/auth/auth.controller.ts)) |
| Auth — me | `GET /api/v1/auth/me` (Bearer) | `200` current user ([auth.controller.ts:105](backend/src/modules/auth/auth.controller.ts)) |
| Organizations | `GET /api/v1/organizations` (Bearer) | `200` list ([organizations.controller.ts:36](backend/src/modules/organizations/organizations.controller.ts)) |
| Projects — list | `GET /api/v1/projects` (Bearer) | `200` list ([projects.controller.ts:32](backend/src/modules/projects/projects.controller.ts)) |
| Projects — create | `POST /api/v1/projects` (Bearer) | `201` created ([projects.controller.ts:45](backend/src/modules/projects/projects.controller.ts)) |
| Public API gate | `GET /public/v1/sitemap-entries` | `200` when `PUBLIC_API_ENABLED=true` ([public-catalog.controller.ts:14-18](backend/src/modules/public/public-catalog.controller.ts)) |

### Marketing-web (base `https://<MARKETING_STAGING_HOST>`)
| Test | Request | Expected |
|---|---|---|
| Homepage | `GET /` | `200`, SSR HTML ([marketing-web/railway.toml:12](marketing-web/railway.toml)) |
| Public page | `GET /<published-path>` → backend `/public/v1/pages/<path>` | `200`, rendered page content ([public-api.ts:92-104](marketing-web/lib/public-api.ts), [marketing-web/app/[...path]](marketing-web/app)) |
| SEO — robots | `GET /robots.txt` | `User-agent: * / Disallow: /` (noindex) — [robots.ts:9-16](marketing-web/lib/seo/robots.ts) |
| SEO — sitemap | `GET /sitemap.xml` | `200`, entries from backend ([marketing-web/app/sitemap.ts](marketing-web/app/sitemap.ts)) |
| SEO — tags | view homepage `<head>` | canonical/OG tags present using `NEXT_PUBLIC_SITE_ORIGIN` |
| SEO validator (CI/local) | `npm run validate:seo` | passes ([marketing-web/package.json](marketing-web/package.json)) |

### Frontend (optional, base `https://<FRONTEND_STAGING_HOST>`)
| Test | Action | Expected |
|---|---|---|
| Login | Submit credentials | Authenticates against staging backend ([api-client.ts:8](frontend/src/lib/api-client.ts)) |
| Dashboard | Load after login | Lists orgs/projects; no console API errors |
| Create project | Create flow | `POST /api/v1/projects` → 201; appears in list |
| Create page | Create flow | `POST /api/v1/projects/:id/pages` → 201 ([pages.controller.ts:46](backend/src/modules/pages/pages.controller.ts)) |

---

## 6. Failure Scenarios (Phase 5)

| Scenario | Symptoms | Diagnosis | Recovery |
|---|---|---|---|
| **Migration failure** | `migration:run` errors; tables missing | Bad `DATABASE_URL`, partial/locked migration, schema drift | Fix `DATABASE_URL`; re-run `migration:run`; if partial, `npm run migration:revert` then re-run; worst case drop & reprovision staging plugin, re-migrate ([package.json](backend/package.json)) |
| **Backend deploy failure** | Build fails, or boot crashes with `[Config] Missing required environment variables` | Missing `JWT_SECRET`/`JWT_REFRESH_SECRET`/`DATABASE_URL`; build error | Set required vars ([env.validation.ts:10-26](backend/src/config/env.validation.ts)); redeploy; rollback to previous deployment if needed |
| **Frontend deploy failure** | Build fails, or UI loads but all API calls fail | `NEXT_PUBLIC_API_URL` missing/wrong at **build time** (inlined); or backend `CORS_ORIGINS` excludes frontend host | Set `NEXT_PUBLIC_API_URL` then **rebuild** ([next.config.js:4](frontend/next.config.js)); add frontend host to backend `CORS_ORIGINS` ([main.ts:82-87](backend/src/main.ts)) |
| **Marketing-web deploy failure** | Build fails, or pages render but content empty/500 | `NEXT_PUBLIC_PUBLIC_API_URL` unset → base `null` → no fetch; or backend public API off | Set `NEXT_PUBLIC_PUBLIC_API_URL`; ensure backend `PUBLIC_API_ENABLED=true`; redeploy ([public-api.ts:57-59](marketing-web/lib/public-api.ts)) |
| **Database connection failure** | `/health` returns `db:"down"`; app retries | Wrong/expired `DATABASE_URL`; plugin down; SSL mismatch | Verify staging plugin & `DATABASE_URL`; backend auto-SSL for non-localhost hosts ([configuration.ts:30](backend/src/config/configuration.ts)); restart backend |
| **`PUBLIC_API_ENABLED` missing** | Marketing public pages 404/empty; `/public/v1/*` not serving as expected | On non-prod, default is *enabled*; but explicit `=false` (or prod default-off) disables it | Set `PUBLIC_API_ENABLED=true` on backend; redeploy ([configuration.ts:76-88](backend/src/config/configuration.ts)) |
| **Wrong `NEXT_PUBLIC_API_URL`** | Frontend points at wrong/old backend; CORS or 404 errors; persists after var fix | Value was inlined at build; a restart does not pick up the new value | Correct the var, then trigger a **full rebuild** of frontend ([frontend/.env.railway.staging.example:8-17](frontend/.env.railway.staging.example)) |

---

## 7. Rollback Plan (Phase 6)

**Level 1 — Railway deployment rollback (fast, no data change).**
Per service, in Railway → Deployments → redeploy the previous successful deployment (or Stop). Use for bad builds or bad runtime config. Reversible; affects only the chosen service. Backend `restartPolicyType=ON_FAILURE`, max 5 retries ([backend/railway.toml:9-10](backend/railway.toml), same in marketing-web/frontend tomls).

**Level 2 — Environment / variable rollback.**
Revert the offending service variables to the last-known-good set from the `*.env.railway.staging.example` files, then redeploy. For frontend `NEXT_PUBLIC_*` changes this **requires a rebuild**, not just a restart (build-time inlining). Staging is fully isolated, so reverting vars cannot affect production.

**Database rollback.**
- Per-migration: `railway run --service <backend> npm run migration:revert` (reverts the most recent migration; repeat to step back) — [backend/package.json](backend/package.json) `migration:revert` → `typeorm migration:revert`.
- Full reset (staging only): drop & reprovision the staging Postgres plugin, then `migration:run` + optional `seed:local-staging-public`. Safe because the plugin is dedicated to staging ([railway-staging-topology.md:41,77](docs/lr3/railway-staging-topology.md)).
- ⚠️ Never point staging at production Postgres; never run reverts against a shared `DATABASE_URL`.

---

## 8. Success Criteria (Phase 7) — Go-Live Checklist

- [ ] **Backend healthy** — `GET /health` → `200 {status:"ok", db:"up"}` ([main.ts:56-74](backend/src/main.ts))
- [ ] **Migrations applied** — 4 migrations present and run with no errors (`backend/src/database/migrations/`)
- [ ] **Required env set** — `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL` present; boot did not throw ([env.validation.ts](backend/src/config/env.validation.ts))
- [ ] **Auth works** — register + login return tokens; `GET /auth/me` authorized ([auth.controller.ts](backend/src/modules/auth/auth.controller.ts))
- [ ] **Project creation works** — `POST /api/v1/projects` → 201 ([projects.controller.ts:45](backend/src/modules/projects/projects.controller.ts))
- [ ] **Public API enabled** — `PUBLIC_API_ENABLED=true`; `/public/v1/sitemap-entries` → 200 ([configuration.ts:76-88](backend/src/config/configuration.ts))
- [ ] **Public page renders** — marketing-web serves a published page via `/public/v1/pages/*` ([public-api.ts](marketing-web/lib/public-api.ts))
- [ ] **SEO tags visible & noindex** — `robots.txt` = `Disallow: /`; sitemap/canonical present ([robots.ts:9-16](marketing-web/lib/seo/robots.ts))
- [ ] **No 500 responses** — backend `/health`, marketing-web `/`, and (if deployed) frontend dashboard return 2xx/3xx
- [ ] *(optional)* **Admin UI works** — frontend login → dashboard → create project → create page, with correct `NEXT_PUBLIC_API_URL`
- [ ] **Isolation confirmed** — staging Postgres dedicated; `CORS_ORIGINS`/`NEXT_PUBLIC_*` reference staging hosts only; no production hosts/tokens used

---

## Final Verdict

### ✅ READY FOR FIRST STAGING DEPLOYMENT

**Evidence basis:**
- All three app services have committed Railway configs: [backend/railway.toml](backend/railway.toml), [marketing-web/railway.toml](marketing-web/railway.toml), [frontend/railway.toml](frontend/railway.toml).
- All three have committed staging env templates with placeholders only (no secrets): `backend/.env.railway.staging.example`, `marketing-web/.env.railway.staging.example`, `frontend/.env.railway.staging.example`.
- Backend has boot-time env validation, a deploy-robust pre-start `/health` server, DB-probing health route, and `PUBLIC_API_ENABLED` gating.
- 4 migrations + a staging seed script are present and runnable via committed npm scripts.
- Staging topology and isolation boundaries are documented: [docs/lr3/railway-staging-topology.md](docs/lr3/railway-staging-topology.md).

**Non-blocking caveats to confirm during execution:**
1. **No staging CI** — staging deploy is fully manual; the only deploy workflow targets production. Drive steps in §4 by hand and do not trigger the production workflow.
2. **Frontend status ambiguity** — topology doc calls `frontend/` "not a staging target," yet full staging config exists. Decide per round whether the admin UI is in scope; backend + marketing-web + Postgres are the minimum set.
3. **`NEXT_PUBLIC_API_URL` is build-time** — must be set before the frontend's first build; later changes need a rebuild.
4. **Isolation discipline** — generate fresh JWT secrets, use a dedicated staging Postgres, and keep all origins on staging hosts (production untouched).

*Read-only planning complete. No deploy, push, merge, migration, or infrastructure change was performed.*
