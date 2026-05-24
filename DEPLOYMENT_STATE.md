# SitePilot Backend — Deployment State

> **NON-CANONICAL — LEGACY OPERATIONAL SUMMARY**
>
> **Do not treat this file as authoritative operational truth.**
>
> **Canonical source of truth:** [`ops/state/projections/DEPLOYMENT_STATE.md`](ops/state/projections/DEPLOYMENT_STATE.md) (ledger-derived, generated-only).
>
> **Verify-first:** Run `python -m ops.osctl.core verify` before acting on deployment state. Env catalog below is reference material only — not ledger truth.

---

## Railway Assumptions

| Setting | Expected value |
|---------|----------------|
| Project | `triumphant-purpose` |
| Service name | `sitepilot-railway` |
| Root directory | `backend/` |
| Builder | Nixpacks (`backend/railway.toml`) |
| Build command | `npm install && npm run build` |
| Start command | `npm run start:prod` → `node dist/main.js` |
| Port | `$PORT` (Railway-injected; fallback 3001) |
| Postgres | Plugin linked; `DATABASE_URL` auto-referenced |
| Auto-deploy from GitHub App | **Disabled** — only GitHub Actions deploys |
| Restart policy | ON_FAILURE, max 5 retries |

## Environment Variables

### Required (startup fails without)

| Variable | Notes |
|----------|-------|
| `JWT_SECRET` | Strong random; dev defaults blocked in prod |
| `JWT_REFRESH_SECRET` | Separate from access secret |
| `DATABASE_URL` | From Postgres plugin **or** `DB_HOST` + `DB_USER` + `DB_PASS` |

### Required for production behavior

| Variable | Typical prod value |
|----------|-------------------|
| `NODE_ENV` | `production` |
| `DB_SYNC` | `false` (must not be `true` — validateEnv throws) |
| `CORS_ORIGINS` | Frontend origin(s); `*` only for initial bootstrap |
| `FRONTEND_URL` | Frontend base URL (emails, redirects) |

### Recommended

| Variable | Default / notes |
|----------|-----------------|
| `API_PREFIX` | `api/v1` |
| `PORT` | Railway sets automatically |
| `BCRYPT_ROUNDS` | `12` |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `THROTTLE_TTL` | `60000` |
| `THROTTLE_LIMIT` | `100` |
| `DB_LOGGING` | `false` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Seeds super-admin on first boot |

### Optional (feature-gated)

| Variable | Feature |
|----------|---------|
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` | Billing |
| `TILDA_EMAIL`, `TILDA_PASSWORD` | Real Tilda publish (else simulation) |
| `MONGO_URI` | Mongo (module not active in AppModule) |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | AI (commented in `.env.example`) |
| `SMTP_*`, Redis | Notifications (module expects them; not in `.env.example`) |

Reference template: `backend/.env.example`

## Health Endpoint Expectations

| Phase | `GET /health` response |
|-------|------------------------|
| Pre-bootstrap | `200` — `{"status":"starting","ts":"…"}` |
| Ready | `200` — `{"status":"ok","env":"production","ts":"…"}` |
| Not ready (non-health paths on pre-server) | `503` |

- Path: **`/health`** (no `/api/v1` prefix)
- Railway probe: 30s timeout per `railway.toml`
- CI: waits 60s, then 3 retries × 15s if `RAILWAY_BACKEND_URL` secret set

## Startup Sequence

```
1. dotenv loads .env / .env.local
2. Pre-start HTTP server on 0.0.0.0:$PORT  (/health → "starting")
3. NestFactory.create(AppModule)
4. ConfigModule validateEnv() — fail fast on missing/invalid prod vars
5. TypeORM connects to Postgres (retry 10×, 3s interval)
6. SeedService.onApplicationBootstrap — optional admin user
7. Pre-server closes; NestJS listens on same port
8. API available at /api/v1/*
```

**Not in startup:** migrations, Playwright browser install, Stripe webhook registration.

## Migration Flow

| Step | Command / action |
|------|-------------------|
| Local | `cd backend && npm run migration:run` |
| Railway (recommended) | `railway link` → `railway run npm run migration:run` |
| Railway (one-shot alt) | Temporarily set start command to `npm run migration:run`, deploy, revert to `npm run start:prod` |
| Revert last | `npm run migration:revert` |
| Generate new | `npm run migration:generate --name=MigrationName` |

**Migrations (4):**

1. `1714000000000-InitialSchema`
2. `1714000000001-AddUserRoleAndRefreshToken`
3. `1714000000002-CreateOrganizations`
4. `1714000000003-Stage5ProjectsAndPages`

Data-source: `backend/src/database/data-source.ts` (reads same env as app).

**First deploy pattern (from docs):** optionally `DB_SYNC=true` once to bootstrap, then set `DB_SYNC=false` and use migrations going forward. Current `validateEnv` **blocks** `DB_SYNC=true` in production — use migrations from the start.

## Known Deployment Failure Patterns

| Symptom | Likely cause |
|---------|--------------|
| Container crash on boot | Missing `JWT_*` or DB vars |
| `DB_SYNC must not be "true"` | Prod var left from bootstrap |
| Health timeout | DB unreachable; TypeORM retry exhausts before Nest listens |
| Health 200 but API 500 | Migrations not applied |
| CORS errors from frontend | `CORS_ORIGINS` mismatch or `FRONTEND_URL` wrong |
| Stripe webhook 400 | Missing `rawBody` (enabled in `main.ts`) or wrong `STRIPE_WEBHOOK_SECRET` |
| Publish job failures | Playwright/Chromium missing on Railway or missing Tilda creds |
| Duplicate deploys | Railway GitHub App re-enabled alongside Actions |
| `railway up` auth fail | Wrong token type (need project token, not account token) |
| Build fail on notifications | Bull/Mailer packages missing from `package.json` |

## Rollback Notes

### Railway

- Roll back via Railway dashboard → Deployments → redeploy previous successful deployment
- Reverting git + push `main` triggers new Actions deploy (forward fix, not instant rollback)
- Env var changes trigger automatic redeploy — revert vars before redeploying old image if needed
- **Database:** migration revert is separate (`migration:revert`); schema rollback is not automatic with image rollback

### VPS (deploy/docker)

- Documented: `./scripts/deploy.sh --rollback`
- Requires prior image/tag strategy in deploy scripts

### Safe rollback checklist

1. Identify last known-good Railway deployment ID
2. Redeploy that artifact (don't change env unless known-good env snapshot exists)
3. If schema changed, assess whether migration revert is required
4. Verify `/health`, then auth smoke test (`POST /api/v1/auth/login`)
5. Check CORS with actual frontend origin
