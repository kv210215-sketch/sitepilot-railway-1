# CURRENT STATUS — Projection Template

> **Type:** Operational projection (summary only — not a journal)  
> **Release:** `{{RELEASE_ID}}` · **As of:** `{{ISO8601_UTC}}` · **Ledger seq:** `{{SEQ|null}}`

---

## Active Release

| Field | Value |
|-------|-------|
| Release ID | `{{RELEASE_ID}}` |
| Git SHA | `{{GIT_SHA}}` |
| Service | `sitepilot-railway` |
| Lifecycle state | `{{planned\|staging\|validating\|promoted\|production\|failed\|rollback\|reconciled\|archived}}` |
| Deploy channel | `github-actions → railway up` |

---

## Environment

| Env | Target | URL | Health |
|-----|--------|-----|--------|
| production | Railway `triumphant-purpose` | `{{BACKEND_URL}}` | `{{ok\|starting\|fail\|unknown}}` |
| database | Railway Postgres | linked `DATABASE_URL` | `{{connected\|unknown}}` |
| frontend | `{{deployed\|not-deployed\|unknown}}` | `{{FRONTEND_URL\|n/a}}` | `{{ok\|n/a}}` |

---

## Known Blockers

| ID | Blocker | Severity | Owner | Since |
|----|---------|----------|-------|-------|
| B1 | `{{description}}` | `{{P0\|P1\|P2\|none}}` | `{{owner}}` | `{{ISO8601_UTC}}` |

_None if empty._

---

## Deployment Baton

> Who holds the operational baton for the current step.

| Role | Holder | Action pending |
|------|--------|----------------|
| Execute deploy | `{{ci\|human:NAME}}` | `{{none\|deploy\|verify\|rollback}}` |
| Production gate | `human:{{OWNER}}` | `{{approve\|hold\|n/a}}` |
| Record state | `{{human\|osctl-future}}` | `{{fill template\|ingest event\|n/a}}` |

---

## Next Actions

- [ ] `{{action 1}}`
- [ ] `{{action 2}}`
- [ ] `{{action 3}}`

---

## Rollback Target

| Field | Value |
|-------|-------|
| Rollback active | `{{yes\|no}}` |
| Target ledger seq | `{{SEQ\|n/a}}` |
| Target git SHA | `{{GIT_SHA\|n/a}}` |
| Railway deployment ID | `{{RAILWAY_DEPLOYMENT_ID\|n/a}}` |
| Rollback lock | `{{held\|released\|n/a}}` |

---

## Verification Status

| Check | Status | Last run (UTC) | Evidence |
|-------|--------|----------------|----------|
| `GET /health` | `{{pass\|fail\|skip}}` | `{{ISO8601_UTC}}` | `{{link or seq}}` |
| Auth smoke (`/api/v1/auth/login`) | `{{pass\|fail\|skip}}` | `{{ISO8601_UTC}}` | |
| Migrations applied | `{{pass\|fail\|skip\|unknown}}` | `{{ISO8601_UTC}}` | |
| CORS aligned | `{{pass\|fail\|skip}}` | | |
| Projections in sync | `{{n/a until Phase 2}}` | | |

---

## Metadata

| Field | Value |
|-------|-------|
| Template version | `ops-state-template/1.0` |
| Spec reference | `osctl-spec/0.1.0-draft` |
| Supersedes release | `{{RELEASE_ID\|none}}` |
