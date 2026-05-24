# SitePilot Backend — Agent Rules

Operational rules for AI agents working on this repository.

> **VERIFY before ACT**
>
> Do not treat root context files as canonical operational truth.
> For deployment status and current operational state, verify ledger-derived projections under `ops/state/projections/` via `python -m ops.osctl.core verify`.
> Cross-reference: [`ops/osctl/HUMAN_BOUNDARIES.md`](ops/osctl/HUMAN_BOUNDARIES.md), [`ops/osctl/VERIFY_MODEL.md`](ops/osctl/VERIFY_MODEL.md).

## Scope & Context

- **Backend root:** `backend/` only — ignore `sitepilot/backend/` unless explicitly asked to reconcile duplicates
- **Read for context (non-authoritative):** root `MASTER_CONTEXT.md`, `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` — **verify-first** against [`ops/state/projections/`](ops/state/projections/) after `python -m ops.osctl.core verify`
- **Do not load** entire repo into context — inspect targeted files only
- **No hallucinated infra** — Railway project/service names come from docs, not assumptions

## Chat Discipline

| Role | Focus | Example prompt |
|------|-------|----------------|
| Backend feature | Single module + DTO/entity/tests | "Add pagination to projects list endpoint" |
| Deploy / release | Env, migrations, Railway, CI | "Why did prod health pass but login 500?" |
| Debug | One failing path + logs | "Trace publish job failure for job ID …" |

- **Separate chats by role** — don't mix feature work with production deploy debugging
- **Short prompts** — state goal, file/module, constraint in ≤3 sentences
- **Avoid mega-context** — paste error + 1–2 relevant files, not whole modules

## Code Change Rules

- **Minimal diffs** — one concern per change; match existing NestJS patterns in `backend/src/modules/`
- **Do not edit** `sitepilot/` duplicate, frontend, or deploy scripts unless task requires it
- **Do not commit** `.env`, `.env.production`, secrets, or credentials
- **Migrations:** generate via npm script; never rely on `DB_SYNC` for prod
- **Auth:** preserve global `JwtAuthGuard`; mark new public routes with `@Public()`
- **Health:** keep `/health` outside `API_PREFIX`; don't break pre-start server in `main.ts`

## Deploy & Release Isolation

- **Never deploy blindly** — confirm target (local / Railway / VPS) before any deploy command
- **User must explicitly request** deploy, Railway CLI, Docker, or push to prod
- **Backend/deploy/release isolation:**
  - Code change ≠ deployed
  - Merged to `main` → GitHub Actions deploys backend automatically (if secrets set)
  - Migrations are **manual** on Railway — code deploy does not run them

## Pre-Release Validation

Before recommending a release:

1. `npm run build` in `backend/` (when agent is allowed to build)
2. Confirm env vars against `backend/.env.example` + `DEPLOYMENT_STATE.md`
3. New schema → new migration + document manual `migration:run` step
4. If touching auth/CORS/billing → smoke-test those paths, not just `/health`

## Debugging Priority

When prod misbehaves, check in order:

1. **Env mismatch** — `DATABASE_URL`, `JWT_*`, `CORS_ORIGINS`, `FRONTEND_URL`, `DB_SYNC`
2. **Migrations applied?** — missing tables cause 500s while health stays 200
3. **Railway logs** — startup `validateEnv` errors, TypeORM connection retries
4. **Targeted logs** — single request trace, one module, one job ID
5. **Avoid** full-repo grep scans and reading all migrations unless schema issue suspected

## Forbidden Without Explicit Ask

- `railway up`, `railway deploy`, Docker compose up, push to `main`
- Installing deps globally or modifying `package.json` without task scope
- Enabling `DB_SYNC=true` in production
- Force-push, git config changes, amending pushed commits
- Editing the four context files unless updating documented state

## Quick Reference

| Check | Command / URL |
|-------|---------------|
| Health | `GET /health` |
| API base | `/api/v1` |
| Migrations | `npm run migration:run` (in `backend/`) |
| Deploy workflow | `.github/workflows/deploy-railway.yml` |
| Env template | `backend/.env.example` |
| Railway config | `backend/railway.toml` |
