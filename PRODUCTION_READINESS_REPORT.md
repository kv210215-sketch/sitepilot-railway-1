# SitePilot — Production Readiness Report

**Date:** 2026-06-28
**Branch:** `claude/sitepilot-production-readiness-wd231c`
**Scope:** Production readiness verification only. No business-logic, refactor, or feature changes were made.

---

## 0. Scope & access disclaimer (read first)

This report is a **static code + configuration audit**. Two things prevented me from
performing the *live* Railway operations the checklist asks for:

1. **No Railway credentials** in this environment — I cannot read or modify production
   environment variables, and I cannot trigger or wait for a redeploy.
2. **Network egress to Railway is blocked** — the managed agent proxy returns
   `403 CONNECT tunnel failed` for `https://sitepilot-railway-production.up.railway.app`,
   so I could not hit `/health`, run smoke tests, or test CORS preflight against the
   live deployment.

Therefore, every item that requires a live deploy (health check, redeploy, smoke test,
CORS preflight, browser request) is marked **NOT VERIFIABLE FROM HERE** with the exact
command the operator should run instead. Every item verifiable from source is marked
**PASS / FAIL** with file:line evidence.

---

## 1. Which code actually deploys (important)

| | Path | Status |
|---|---|---|
| **Deployed tree** | repo-root `backend/` and `frontend/` | CI deploys this — `/.github/workflows/deploy-railway.yml` uses `working-directory: backend` |
| Stale snapshot | `sitepilot/backend`, `sitepilot/frontend` | Older copy; last commit `#5`. Missing the recent IDOR/leads/RBAC fixes. |

**Finding (non-blocking but a trap):** `RAILWAY_DEPLOY.md` (lines 58, 90) tells the operator
to set the Railway service **Root Directory** to `sitepilot/backend` / `sitepilot/frontend`.
That is the **stale** tree. CI (`railway up` from `backend/`) ships the correct tree, and the
doc states the Railway GitHub-App auto-deploy is disabled — so the live deploy path is correct
**as long as deploys go through GitHub Actions**. If anyone re-enables dashboard auto-deploy with
the documented root dir, it would ship stale code without the recent security fixes.
**Action:** fix the doc, or confirm the Railway service Root Directory points at `backend/`.

**Finding (non-blocking):** the frontend deploy job in the workflow is `if: false` (disabled).
Frontend is not auto-deployed by CI and must be deployed by another route.

---

## 2. Environment variables — OLD → NEW

I **cannot read the live Railway values** (`OLD`), so `OLD` is `UNKNOWN (no access)` for all.
`NEW` is the required/target value per the code. **No secret values are invented or printed.**

| Variable | OLD | NEW (target) | Notes |
|---|---|---|---|
| `DATABASE_URL` | UNKNOWN | auto-linked by Railway Postgres | Required. Code parses it (`configuration.ts:29`). |
| `DATABASE_SSL` | UNKNOWN | **— (do not add) —** | ⚠️ **This variable is not read anywhere in the codebase.** See §3. |
| `JWT_SECRET` | UNKNOWN | **secret — you must provide** | Required (`env.validation.ts:10`). Must not be the dev default. |
| `JWT_REFRESH_SECRET` | UNKNOWN | **secret — you must provide** | Required (`env.validation.ts:13`). Must not be the dev default. |
| `FRONTEND_URL` | UNKNOWN | `https://<frontend-domain>` | Used for app links (`configuration.ts:16`). **Not** the CORS source — see §4. |
| `CORS_ORIGINS` | UNKNOWN | `https://<frontend-domain>` | **This is the real CORS allowlist** (`configuration.ts:18`, `main.ts:49`). |
| `NODE_ENV` | UNKNOWN | `production` | Gates Swagger, logging, public API (§5, §6). |
| `PORT` | UNKNOWN | auto-set by Railway | Falls back to 3001 (`main.ts:19`). |
| `ADMIN_EMAIL` | UNKNOWN | your admin email | Seeds super-admin (`configuration.ts:23`). |
| `ADMIN_PASSWORD` | UNKNOWN | **secret — you must provide** | Seeds super-admin (`configuration.ts:24`). |
| `DB_SYNC` | UNKNOWN | `false` (must) | `true` is **hard-blocked** in prod (`env.validation.ts:49`). |

**Secrets I need from you (do not paste them in chat unless you intend to — set them in the
Railway Variables tab):** `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_PASSWORD`.
Generate the two JWT secrets with `openssl rand -hex 32` each (32 bytes / 64 hex chars).

---

## 3. DATABASE_SSL — corrected guidance

**The checklist asks to set `DATABASE_SSL=true`. Do not — it is a no-op in this codebase.**
No file reads `DATABASE_SSL`. SSL is resolved like this:

- When `DATABASE_URL` is set (the Railway case), SSL is **derived automatically**:
  `ssl: url.hostname !== 'localhost'` → `configuration.ts:39`, applied as
  `{ rejectUnauthorized: false }` in `app.module.ts:64` and `data-source.ts:24`.
  → On Railway the DB host is never `localhost`, so **TLS to Postgres is already ON.**
- Only when `DATABASE_URL` is *absent* does the code honour an env flag, and that flag is
  named **`DB_SSL`** (`configuration.ts:51`, `data-source.ts:28`), not `DATABASE_SSL`.

**Verdict:** Postgres SSL is effectively **PASS** already via `DATABASE_URL`. Adding
`DATABASE_SSL=true` changes nothing. No redeploy needed for SSL.

---

## 4. FRONTEND_URL vs CORS — corrected guidance

The checklist conflates `FRONTEND_URL` with CORS. In code they are **separate**:

- `FRONTEND_URL` → `app.frontendUrl`, used for generated links / email, **not** CORS.
- `CORS_ORIGINS` → drives `app.enableCors(...)` (`main.ts:49,74-79`).

CORS behaviour (`main.ts:74-79`):
- multiple origins → comma-separated **without spaces**: `origin1,origin2` (trimmed in
  `configuration.ts:20`, so stray spaces are tolerated but avoid them).
- `CORS_ORIGINS=*` → reflects any origin **and disables credentials** (`credentials: !allowAll`).
  For a locked-down production set `CORS_ORIGINS` to the exact frontend origin(s).

**NOT VERIFIABLE FROM HERE** (needs live deploy):
```bash
# CORS preflight
curl -i -X OPTIONS https://<backend>/api/v1/auth/login \
  -H "Origin: https://<frontend>" \
  -H "Access-Control-Request-Method: POST"
# expect: 204 + access-control-allow-origin: https://<frontend>
```

---

## 5. NODE_ENV

`NODE_ENV=production` is required and drives Swagger-off, reduced logging, and the public API
default-off. Set it in Railway. **Verify after deploy:** `GET /health` returns
`{"status":"ok","env":"production",...}` (`main.ts:64-66`).

---

## 6. JWT

- **Exists:** enforced — startup throws if `JWT_SECRET` / `JWT_REFRESH_SECRET` missing
  (`env.validation.ts:10-15`). **PASS** (when set).
- **Not dev-default:** enforced in prod (`env.validation.ts:39-47`). **PASS**.
- **Length:** ⚠️ **No minimum length is enforced in code.** The checklist says "length meets
  requirements" but there is no length check. Recommendation: use `openssl rand -hex 32`
  (≥32 bytes). I did **not** read, log, or print any secret value.

---

## 7. Swagger

`main.ts:82` — Swagger is only mounted when `env !== 'production'`. With `NODE_ENV=production`,
`/docs` is **not registered**. **PASS (code).**
**Verify after deploy:** `GET https://<backend>/docs` → expect 404.

---

## 8. Database / migrations

- 5 migrations present in `backend/src/database/migrations/` (InitialSchema → CreateLeads).
- `synchronize` is config-driven and **blocked from being `true` in prod**
  (`env.validation.ts:49`); `data-source.ts:33` is `synchronize:false`. **PASS.**
- ⚠️ **Migrations do NOT run automatically on deploy.** `railway.toml` start command is
  `npm run start:prod` = `node dist/main.js`; there is no migration step in build or start.
  The operator must run them once after first deploy:
  ```bash
  railway run npm run migration:run   # uses src/database/data-source.ts
  ```
  **NOT VERIFIABLE FROM HERE** — confirm `migration:run` reports "No migrations are pending".

---

## 9. Security checklist

| Item | Result | Evidence |
|---|---|---|
| Helmet | ✅ **PASS** *(fixed in this branch)* | `helmet@^8.2.0` added to `backend/package.json` + lockfile; `app.use(helmet())` registered in `main.ts` right after shutdown hooks, before the health endpoint / CORS / routes. Runtime smoke confirms hardened headers (HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options`, CSP). |
| CORS | ✅ PASS | `main.ts:74-79`, origins from `CORS_ORIGINS`. Lock to exact origin in prod. |
| ValidationPipe | ✅ PASS | Global, `whitelist + forbidNonWhitelisted + transform` (`app.module.ts:127-132`). |
| JWT | ✅ PASS | Global `JwtAuthGuard` (`app.module.ts:123`); secrets validated at boot. |
| Rate limit | ✅ PASS | Global `ThrottlerGuard` (`app.module.ts:122`), config in `app.module.ts:97-105`; `trust proxy` set for real client IP (`main.ts:58`). |
| RBAC | ✅ PASS | Global `RolesGuard` (`app.module.ts:124`). |
| Swagger disabled in prod | ✅ PASS | `main.ts:82` (`env !== 'production'`). |
| Stack traces hidden | ✅ PASS | `GlobalExceptionFilter` returns a generic message, no stack/`error` detail leaked for 500s (`http-exception.filter.ts:25-65`). |
| No debug endpoints | ✅ PASS | None found. `start:debug` is a dev-only npm script, not a route. |

**Update (this branch): the Helmet gap is now fixed.** Added `helmet@^8.2.0` and
`app.use(helmet())` (default config) in `main.ts`. `npm run build` (tsc) passes, and a
standalone runtime smoke confirms the security headers are emitted. The middleware is registered
before routes so every response — including `/health` and CORS preflights — carries the headers.
Helmet's default CSP only affects HTML responses; this is a JSON API, and the dev-only Swagger UI
(`@nestjs/swagger` v7) loads external scripts, so dev mode is unaffected. **No business logic,
auth, RBAC, CORS, migrations, or frontend code was touched.** The security checklist is now
fully green.

---

## 10. Smoke test (backend / frontend / browser)

**ALL NOT VERIFIABLE FROM HERE** — require the live deploy, which this environment cannot reach.
Run after env vars are set and migrations applied:

```bash
B=https://<backend>;  F=https://<frontend>
curl -s $B/health                                   # health   -> {"status":"ok","env":"production"}
curl -s -X POST $B/api/v1/auth/login -H 'Content-Type: application/json' \
     -d '{"email":"'"$ADMIN_EMAIL"'","password":"<pw>"}'   # auth
curl -s $B/api/v1/projects -H "Authorization: Bearer <token>"        # sites list / search / sort
# site details / add / edit / delete -> exercise /api/v1/projects/:id (GET/POST/PATCH/DELETE)
curl -s $B/docs -o /dev/null -w '%{http_code}\n'    # expect 404 (Swagger off)
```
Frontend (dashboard, login, routing, site details, create modal) and browser checks
(CORS / OPTIONS / GET / POST, no 403-CORS, no mixed content, no SSL warnings, no network
failures) must be exercised manually in a browser against the live URLs.

---

## Summary

| Section | Result |
|---|---|
| Deploy path correct (CI ships `backend/`) | PASS (doc mismatch to fix) |
| Env vars present in Railway | **UNVERIFIED (no access)** |
| DATABASE_SSL | N/A — SSL already on via `DATABASE_URL`; do not add the var |
| NODE_ENV / Swagger off | PASS (code) |
| JWT exists / not default | PASS (code); length unenforced |
| Migrations present | PASS; **manual run required & unverified** |
| Health endpoint | **NOT VERIFIABLE FROM HERE** |
| Smoke test | **NOT VERIFIABLE FROM HERE** |
| Security checklist | ✅ **PASS** — Helmet added; all other controls already passing |

### Remaining blockers
1. ~~Helmet not installed~~ → **RESOLVED** in this branch (`helmet@^8.2.0` + `app.use(helmet())`).
2. **Live env vars unverified** — must confirm in Railway: `JWT_SECRET`, `JWT_REFRESH_SECRET`,
   `ADMIN_PASSWORD` (secrets you provide), plus `NODE_ENV=production`, `DB_SYNC=false`,
   `CORS_ORIGINS=<frontend origin>`, `FRONTEND_URL=<frontend origin>`.
3. **Migrations not confirmed applied** — must run `railway run npm run migration:run` once and
   confirm zero pending.
4. **Live health + smoke + CORS tests not run** — blocked by no Railway access / blocked egress.
5. **Doc mismatch** — `RAILWAY_DEPLOY.md` points Root Directory at the stale `sitepilot/` tree.

### Final recommendation

## ⛔ DO NOT DEPLOY — yet

The application code is well-built and the security checklist is now fully green (Helmet added in
this branch). First production deploy remains gated **only on live-environment confirmations that
this environment cannot perform**:
- confirming the **required env vars/secrets** are set in Railway
  (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_PASSWORD`, `NODE_ENV=production`, `DB_SYNC=false`,
  `CORS_ORIGINS`, `FRONTEND_URL`);
- running and confirming **migrations** (`railway run npm run migration:run`, zero pending);
- executing the **live health + smoke + CORS** checks against the deployed URLs.

**Do NOT add `DATABASE_SSL`.** The codebase never reads that variable — TLS to Postgres is already
controlled by the `DATABASE_URL` host logic (`ssl` enabled whenever the DB host ≠ `localhost`,
`configuration.ts:39`), with `DB_SSL` as the only fallback flag on the no-`DATABASE_URL` path.
Adding `DATABASE_SSL=true` would be a silent no-op.

Once the three live confirmations above are green, this flips to
**READY FOR FIRST PRODUCTION DEPLOY**. No remaining item requires business-logic changes.
