# Docker Compose Isolation — Final Preparation Report

**Date:** 2026-05-24  
**Agent:** OSCTL Docker Compose Isolation Agent  
**Mode:** STRICT — read-only analysis; isolation command **NOT executed**  
**Repository:** `D:\Projects\SitePilot\sitepilot-railway`  
**Branch:** `fix/app-module-template-compile`  
**HEAD:** `ca6f1e5` — `fix docker compose and production config`  
**Governance status:** H1–H7 human-approved; topology frozen. No governance re-analysis performed.

---

## 1. Current docker-compose status

| Property | Value |
|----------|-------|
| Git path | `docker-compose.yml` (repository root) |
| Index state | **Unstaged modification only** (` M docker-compose.yml`) |
| Staged changes | **None** (`git diff --cached docker-compose.yml` empty) |
| Working tree vs HEAD | **Near-total dev-infra rewrite** (57 lines → 53 lines; structural change) |
| Branch context | Backend compile-fix branch; **not** an OSCTL or dev-infra branch |
| Prior isolation | Backend compile surface isolated in prior session; compose **deliberately left dirty** per mission rules |

**HEAD topology (committed):** `backend`, `frontend`, `db` (Postgres 15), `redis` — full local stack with app containers built from repo Dockerfiles.

**Working tree topology (modified):** `postgres` (Postgres 16), `redis`, `adminer`, `mailhog` — infra-only; application services removed; host-run backend/frontend assumed.

---

## 2. Modification classification

Every hunk in `git diff docker-compose.yml` classified below.

| # | Change | local-dev only | backend-runtime | governance-affecting | replay-affecting | disposable |
|---|--------|:--------------:|:---------------:|:--------------------:|:----------------:|:----------:|
| 1 | **Remove `backend` service** (build, port 3001, env_file, depends_on) | ✓ | ✓ | — | — | — |
| 2 | **Remove `frontend` service** (build, port 3000, NEXT_PUBLIC_API_URL) | ✓ | ✓ | — | — | — |
| 3 | **Rename service `db` → `postgres`** | ✓ | ✓ | — | — | — |
| 4 | **Postgres image `15-alpine` → `16-alpine`** | — | ✓ (risky) | — | — | — |
| 5 | **Postgres credentials** `postgres/postgres` → `sitepilot/sitepilot123` | — | ✓ (risky) | — | — | — |
| 6 | **Postgres healthcheck** user/db + interval 5s → 10s | ✓ | ✓ | — | — | — |
| 7 | **`container_name: sitepilot_db`** on postgres (unchanged value, explicit) | ✓ | ✓ | — | — | — |
| 8 | **Redis `container_name: sitepilot_redis`** | ✓ | ✓ | — | — | — |
| 9 | **Redis healthcheck** (`redis-cli ping`, 10s interval) | ✓ | ✓ | — | — | — |
| 10 | **Add `adminer` service** (port 8080, depends on postgres healthy) | ✓ | — | — | — | ✓ |
| 11 | **Add `mailhog` service** (ports 1025/8025) | ✓ | ✓ (notifications-adjacent) | — | — | ✓ |

### Aggregate classification

| Domain | Verdict |
|--------|---------|
| **Primary owner** | Backend / runtime — local development infrastructure |
| **OSCTL / governance** | **Not applicable** — file is explicitly out of OSCTL scope per `BOUNDARIES.md`, `BACKEND_RUNTIME_ISOLATION_REVIEW.md` §4.2 |
| **Logical sub-groups** | **Group B** (dev-infra refactor: items 1–9, 10) + **Group A-adjacent** (MailHog, item 11, coupled to removed `backend/src/notifications/**` SMTP defaults) |
| **Disposable subset** | Adminer and MailHog are optional dev tooling; safe to omit from production paths |
| **Non-disposable / risky subset** | PG16 bump, credential rotation, removal of app services — require human review before any commit on `chore/dev-compose-refactor` |

**Governance-affecting:** **No** — no ledger, projection, replay, or canonical governance file content changed.

**Replay-affecting:** **No** — `docker-compose.yml` is not referenced by `ops/osctl/core/replay/`, validation scenarios, or `events.jsonl`.

---

## 3. Runtime impact

| Impact area | Assessment |
|-------------|------------|
| **Local development** | **High.** Working tree assumes infra-only compose; developers must run backend/frontend on host. Committed HEAD assumes full Docker stack. |
| **Service discovery / naming** | **Breaking.** `db` → `postgres` breaks any script or env referencing service name `db`. |
| **Database compatibility** | **Breaking risk.** PG15 → PG16 with credential change invalidates existing `pgdata` volume unless migrated or volume wiped. |
| **Backend connectivity** | **Neutral if host-run.** Backend `.env` must align with new credentials/host; not verified in this read-only pass. |
| **Staging / production deploy** | **None from dirty file alone** — file is uncommitted; Railway/production deploy paths are separate. |
| **Notifications feature (removed WIP)** | MailHog block supports `localhost:1025` SMTP; irrelevant while notifications tree is off workspace. |

**Runtime verdict:** Changes are **local-dev infrastructure only** but **materially alter** the dev environment. They must not remain mixed on `fix/app-module-template-compile` or any OSCTL-prep workspace.

---

## 4. Governance impact

| Concern | Status |
|---------|--------|
| Direct mutation of canonical governance files | **None** |
| OSCTL ledger / projection content | **Unchanged** |
| Trust boundary (runtime mixed with governance workspace) | **VIOLATED while dirty** — `docker-compose.yml` modified alongside ~197 untracked `ops/**` files |
| LR-1 readiness condition #2 (`No modified docker-compose.yml`) | **FAIL** |
| Staging `docker-compose.yml` with `ops/**` | **Forbidden** — would create irrecoverable mixed-commit risk |

**Governance verdict:** No governance *content* impact, but **high workspace hygiene impact**. Isolation is a prerequisite for OSCTL-only surface verification (Step 7 in `BACKEND_WORKSPACE_ISOLATION_PLAN.md`).

---

## 5. Replay impact

| Replay surface | Involvement |
|----------------|-------------|
| `ops/osctl/core/replay/engine.py` | None |
| `ops/osctl/validation/scenarios/**` | None |
| `ops/osctl/ledger/events.jsonl` | None |
| `ops/state/ledger/events.jsonl` | None |
| Projection fold/render | None |

**Replay verdict:** **Zero replay impact.** Compose isolation is a workspace/trust-boundary operation only.

---

## 6. Recommended isolation strategy

### Decision: **Targeted stash** (exactly one)

**Rationale (why not the alternatives):**

| Option | Assessment |
|--------|------------|
| **`git restore docker-compose.yml`** | Rejected as default. Destroys a large, intentional dev-infra rewrite without human confirmation that the diff is unwanted. HEAD on this branch already carries a compose fix; working tree is a *second* divergence. |
| **Move to dedicated runtime branch** | Rejected for Step 1. Correct long-term home is `chore/dev-compose-refactor`, but branch move requires commit + review of risky hunks (PG16, creds, service removal). That is Step 5 disposition, not immediate workspace isolation. |
| **Targeted stash** | **Selected.** Single-file, non-destructive, immediately clears the mixed workspace for OSCTL prep, preserves full diff for later branch/commit after human hunk review. Aligns with `CANONICAL_GOVERNANCE_RESOLUTION.md` §10 and `WORKSPACE_BLOCKER_CLASSIFICATION.md` §2. |

### Post-stash human path (not executed here)

When ready to land runtime changes:

1. `git stash pop` (or `git stash apply`) on `chore/dev-compose-refactor` created from clean `main`/HEAD.
2. Split commit: safe subset (Redis healthcheck, Adminer) vs risky subset (PG16, creds, app service removal) vs MailHog (optional: `feature/notifications` if revived).
3. Never commit compose on `osctl/governance-application`.

---

## 7. Risk if left unresolved

| Risk | Severity | Description |
|------|----------|-------------|
| **Accidental mixed staging** | Critical | `git add .` or broad staging could bundle compose with `ops/**` — trust boundary violation |
| **LR-1 false start** | High | Operator or agent may believe workspace is OSCTL-ready while compose remains dirty |
| **Wrong-branch commit** | High | Infra rewrite committed on `fix/app-module-template-compile` conflates compile-fix with dev-env pivot |
| **Data loss on PG16/creds** | Medium | Developer runs modified compose against existing PG15 volume without migration plan |
| **Script breakage** | Medium | References to service `db` or old credentials fail silently |
| **Audit drift** | Low | Reports reference mixed state; repeated re-triage cost |

---

## 8. Exact safe command (NOT executed)

Human operator runs **after approving this report**:

```powershell
Set-Location D:\Projects\SitePilot\sitepilot-railway

# Step 1 — isolate compose only (preserves WIP in stash)
git stash push -m "OSCTL-isolation: local-dev compose rewrite (Step 1)" -- docker-compose.yml
```

**Verification commands (run immediately after stash; also not executed by this agent):**

```powershell
git status --short docker-compose.yml
git diff docker-compose.yml
git stash list
```

**Expected outcome:**

- `docker-compose.yml` matches HEAD (clean, no ` M` flag).
- Stash entry contains full compose rewrite for later `chore/dev-compose-refactor` work.
- Remaining blockers: untracked `ops/**`, root context files (`AGENT_RULES.md`, etc.) — unchanged by this step.

---

## 9. Forbidden actions

The following are **explicitly forbidden** for agents and **must not** be performed without separate human authorization:

| Forbidden action | Reason |
|------------------|--------|
| `git add .` | Bundles runtime, governance, and root context unpredictably |
| Staging `ops/**` before compose isolation | Mixed-commit / trust boundary violation |
| Governance edits (canonical 15, freeze docs, ledger events) | H1–H7 frozen; out of Step 1 scope |
| Replay rewrites (`core/replay`, scenarios, validation fixtures) | No replay defect; scope creep |
| Runtime/governance mixing in one commit | Core OSCTL invariant |
| **LR-1 execution** | Blocked until workspace clean + explicit human approval |
| `git restore docker-compose.yml` **without human approval** | Destructive to intentional WIP |
| `git stash pop` / branch switch / commit on compose | Deferred to human after this report |
| Deploy, production mutations, infrastructure apply | Out of agent authority |
| Reopening H1–H7 governance analysis | Human-approved; topology frozen |

### Agent authorization boundary (this session)

| Allowed | Performed |
|---------|-----------|
| Read-only diff inspection | ✓ |
| Classification and strategy report | ✓ |
| Create this audit report | ✓ |

| Not authorized | Status |
|----------------|--------|
| Execute restore, stash, or branch | **NOT performed** |
| Continue toward LR-1 | **NOT performed** |
| Any git mutation | **NOT performed** |

---

**Human approval required** before running §8. After approval and successful stash, proceed to root-context classification and OSCTL branch prep — not LR-1.

**Report status:** COMPLETE — Step 1 preparation only.
