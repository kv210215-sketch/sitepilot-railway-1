# SitePilot Backend — Master Context

> **OPERATIONAL / BACKEND CONTEXT ONLY — NOT OSCTL GOVERNANCE AUTHORITY**
>
> This file provides backend architecture, deployment model, and environment reference for agents and operators.
> **It is not** the OSCTL governance kernel, canonical trust anchor, or ledger-derived operational truth.
>
> **OSCTL governance authority:** `ops/osctl/` (see [`ops/osctl/README.md`](ops/osctl/README.md), [`ops/osctl/TRUST_MODEL.md`](ops/osctl/TRUST_MODEL.md)).
>
> **Operational status (verify-first):** [`ops/state/projections/CURRENT_STATUS.md`](ops/state/projections/CURRENT_STATUS.md), [`ops/state/projections/DEPLOYMENT_STATE.md`](ops/state/projections/DEPLOYMENT_STATE.md) — run `python -m ops.osctl.core verify` before acting.

---

> Repo: `sitepilot-railway` · Active backend root: `backend/` · API prefix: `api/v1`

## Architecture Overview

NestJS monolith exposing a REST API for SitePilot (AI website builder + publish pipeline).

```
Client (Next.js frontend)
    → HTTPS /api/v1/*
        → NestJS AppModule
            → Feature modules (auth, projects, pages, publish, billing, ai, …)
            → TypeORM → PostgreSQL
            → Optional: Playwright (Tilda publish), Stripe webhooks
```

**Module layout** (`backend/src/`):

| Area | Path | Role |
|------|------|------|
| Core API | `modules/auth`, `users`, `organizations`, `projects`, `pages` | Auth, tenancy, CRUD |
| Content | `modules/templates`, `content`, `seo`, `onboarding` | Templates, blocks, slugs, onboarding |
| Ops | `modules/publish`, `audit`, `notifications` | Publish jobs, audit log, email queue |
| Revenue | `modules/billing` | Stripe checkout + webhooks |
| Automation | `modules/automation` | Playwright → Tilda publish |
| AI | `modules/ai` | Site generator + sales agent |
| Shared | `modules/common` | Guards, filters, decorators |
| DB | `database/` | TypeORM data-source + 4 migrations |

Legacy duplicate tree exists at `sitepilot/backend/` — **do not treat as deploy root**; CI and `railway.toml` use `backend/`.

## Stack Overview

| Layer | Choice |
|-------|--------|
| Runtime | Node.js 20 (`engines: >=20 <21`) |
| Framework | NestJS 10, Express |
| ORM | TypeORM 0.3 → PostgreSQL 16 |
| Auth | Passport JWT + refresh tokens, bcrypt |
| Validation | class-validator, global ValidationPipe |
| Docs | Swagger at `/docs` (non-production only) |
| Rate limit | `@nestjs/throttler` (global config) |
| Billing | Stripe SDK (`rawBody: true` for webhooks) |
| Publish | Playwright (dynamic import, sim mode without Tilda creds) |
| Optional | Mongoose/Mongo (`movies` module exists but **not imported** in AppModule) |

## Deployment Model

Two supported paths; **Railway is the active production channel** (per `RAILWAY_DEPLOY.md`, `BUILD_STATUS.md`).

### Railway (primary)

- Builder: Nixpacks via `backend/railway.toml`
- Build: `npm install && npm run build` → `dist/main.js`
- Start: `npm run start:prod`
- Health: `GET /health` (30s timeout, restart on failure)
- Postgres: Railway plugin → auto `DATABASE_URL`
- Deploy trigger: **GitHub Actions only** (`deploy-railway.yml`); Railway GitHub App auto-deploy is OFF

### VPS / Docker (secondary)

- Config under `deploy/docker/` (`docker-compose.prod.yml`)
- Full stack: postgres + redis + backend + frontend + nginx
- Documented for `solomiya-energy.com` domains in `deploy/env/.env.production.example`

### Local dev

- Root `docker-compose.yml`: postgres, redis, adminer, mailhog (no backend container)
- Backend runs on host against local Postgres

## Environments

| Env | `NODE_ENV` | Notes |
|-----|------------|-------|
| Local | `development` | `.env` / `.env.local`, Swagger on, `DB_SYNC` allowed |
| Production (Railway) | `production` | `validateEnv` enforces secrets; `DB_SYNC=true` blocked |
| VPS prod | `production` | Same env contract via `deploy/env/.env.production` |

**Production backend URL (documented):** `https://sitepilot-railway-production.up.railway.app`

## Auth Strategy

- **Access token:** JWT (`JWT_SECRET`, default TTL 15m)
- **Refresh token:** separate secret (`JWT_REFRESH_SECRET`, default 7d)
- **Global guards:** `JwtAuthGuard` (default deny) + `RolesGuard` (system roles)
- **Public routes:** `@Public()` on auth register/login/refresh, billing webhook, etc.
- **Org/project access:** `OrgRolesGuard`, `ProjectAccessGuard`, `PageAccessGuard` on resource routes
- **Password:** bcrypt (`BCRYPT_ROUNDS`, default 12)
- **Admin bootstrap:** `SeedService` creates super-admin when `ADMIN_EMAIL` + `ADMIN_PASSWORD` set
- **Production guards:** dev JWT defaults and missing secrets cause startup failure

## DB Strategy

- **Primary store:** PostgreSQL via `DATABASE_URL` (Railway) or `DB_*` vars (local/VPS)
- **SSL:** auto-enabled for non-localhost URLs (`rejectUnauthorized: false`)
- **Schema management:**
  - Dev: `DB_SYNC=true` optional
  - Prod: **migrations only** — `npm run migration:run` (4 files in `backend/src/database/migrations/`)
- **Connection:** TypeORM retries 10× / 3s on startup
- **Entities:** users, organizations, projects, pages, templates, publish jobs, audit, subscriptions, notifications, onboarding
- **MongoDB:** `MONGO_URI` in `.env.example`; MoviesModule not wired — treat as inactive

## Healthcheck Strategy

1. **Pre-start HTTP server** binds `$PORT` immediately; `/health` → `{"status":"starting",…}` while NestJS + DB connect
2. **NestJS ready:** same path → `{"status":"ok","env":"…","ts":"…"}`
3. **Outside API prefix** — no `/api/v1` prefix on health
4. **Railway:** `healthcheckPath = "/health"` in `backend/railway.toml`
5. **CI:** optional post-deploy curl if `RAILWAY_BACKEND_URL` secret set

## CI/CD Overview

```
git push main
  → .github/workflows/deploy-railway.yml
    → railway up --service sitepilot-railway --detach  (cwd: backend/)
    → optional: curl $RAILWAY_BACKEND_URL/health
```

| Item | Value |
|------|-------|
| Secret | `RAILWAY_TOKEN` — Railway **project token** (not account token) |
| Service name | `sitepilot-railway` |
| Railway project | `triumphant-purpose` |
| Frontend job | **disabled** (`if: false`) — `sitepilot-frontend` not deployed via CI yet |

## Known Production Goals

- Backend live on Railway with locked-down CORS (`CORS_ORIGINS` → real frontend URL)
- Frontend Railway service + `NEXT_PUBLIC_API_URL` pointing to backend `/api/v1`
- Schema via migrations (`DB_SYNC=false` in prod)
- Stripe billing (checkout + webhook secrets)
- Tilda publish via Playwright (`TILDA_EMAIL`, `TILDA_PASSWORD`)
- AI features (API keys not yet in `.env.example` — add when enabling)
- Email notifications (SMTP + Redis/Bull — module present, infra/env TBD on Railway)
- Custom domains (documented for VPS path; optional on Railway)

## OSCTL Snapshot Layer Status

**Purpose:** Deterministic operational state reconstruction layer for OSCTL.

**Core rule:** Ledger remains authoritative. Snapshots are disposable acceleration artifacts only.

**Trust kernel status:** Validated candidate (see `ops/osctl/validation/VALIDATION_SUMMARY.md`).

**Validated assumptions:**

- Deterministic replay required
- Snapshot rebuild must be reproducible
- Snapshots must never gain orchestration authority
- Hidden mutable state is forbidden
- Replay verification required before trust

**Forbidden:**

- Snapshot-triggered deploys
- Autonomous recovery
- Snapshot authority escalation
- Mutable hidden caches
- Production orchestration hooks

**Phase 3 artifacts:** `ops/osctl/snapshots/` (architecture, format, security, read-only verify/compare scripts).

**Remaining human responsibility:** External head-hash anchoring.
