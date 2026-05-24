# BACKEND RUNTIME ISOLATION REVIEW

**Agent:** Backend Runtime Isolation Review Agent
**Mode:** READ-ONLY REVIEW
**Repository:** `D:\Projects\SitePilot\sitepilot-railway`
**Branch:** `main`
**Generated:** 2026-05-24
**Scope:** Backend / runtime dirty-state triage prior to OSCTL LR-1.
**Authority:** None over runtime, infra, OSCTL, governance, deploy, or CI. Advisory only.

---

## 1. Verdict (Executive Summary)

**The current dirty state is MIXED, not coherent.**
It contains at least **four distinct logical change-sets** entangled in the working tree, plus **one likely build-break** in a tracked file. Committing any of it as a single unit would conflate unrelated concerns and may also commit broken code.

**OSCTL LR-1 must remain BLOCKED until the four change-sets below are isolated by the human operator.**

Isolation order recommended:
1. Repair the build break in `backend/src/app.module.ts` (Group D below).
2. Decide on the duplicate `backend/src/templates/**` tree (Group C — likely stash or move-to-branch; **do not commit blindly**).
3. Commit the coherent notifications feature (Group A) on a feature branch.
4. Commit the local dev-infra changes in `docker-compose.yml` (Group B) **separately** and **never inside any OSCTL commit**.

---

## 2. Dirty Backend File Summary

### 2.1 Tracked, modified

| File | Status | Logical group |
| --- | --- | --- |
| `backend/src/app.module.ts` | Modified | A (notifications wiring) **+** D (broken Template removal) |
| `docker-compose.yml` | Modified | B (infra rewrite) **+** A-adjacent (MailHog for notifications) |

### 2.2 Untracked, new

| Path | Files | Logical group |
| --- | --- | --- |
| `backend/src/notifications/` | 9 files (module, service, processor, entity, dto, 4 hbs templates) | A (notifications feature) |
| `backend/src/templates/` | 5 files (module, service, controller, entity, dto) | C (**duplicate / parallel rewrite** of `backend/src/modules/templates/`, NOT wired in `app.module.ts`) |

### 2.3 Out-of-scope untracked (not backend / runtime, for awareness only)

The following untracked sets are visible in `git status` but are explicitly **out of scope** for this review and **must not** be touched by backend isolation actions:

- Root context drafts: `AGENT_RULES.md`, `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md`, `MASTER_CONTEXT.md`
- OSCTL tree: `ops/osctl/**`, `ops/state/**`, `ops/rituals/**`, `ops/simulations/**`, `ops/README.md`, `ops/__init__.py`, `ops/__pycache__/**`

These are governed by OSCTL / governance authority, not by this review.

---

## 3. `backend/src/app.module.ts` Change Summary

Diff vs `HEAD`:

- **Added** `import { NotificationsModule } from './notifications/notifications.module';`
- **Added** `import { Notification } from './notifications/notification.entity';`
- **Added** `Notification` to the `TypeOrmModule.forRootAsync` `entities: [...]` list.
- **Added** `NotificationsModule` to the `imports: [...]` block (between `AuditModule` and `PublishModule`).
- **Removed** `import { Template } from './modules/templates/template.entity';`
- **Untouched** `import { TemplatesModule } from './modules/templates/templates.module';` (still imports from `./modules/templates/...`, **not** from the new untracked `./templates/...`).

### 3.1 CRITICAL — Probable compile break (Group D)

The current on-disk `app.module.ts` still references the symbol `Template` on the `entities` line:

```81:90:backend/src/app.module.ts
          entities: [
            User, Project, ProjectMember,
            Page, Template, ContentBlock,
            PublishJob, PublishJobLog,
            AuditLog,
            Subscription,
            OnboardingSession,
            Organization, OrganizationMember,
            Notification,
          ],
```

…but its import was deleted by the same patch. Unless this file is recompiled and `Template` was intended to come from somewhere else, this is a **TypeScript build break** as currently staged on disk.

This must be repaired by the human **before** any commit, regardless of which group it lands in.

---

## 4. `docker-compose.yml` Change Summary

This is **not an additive change** — it is a near-total rewrite of the dev-compose surface.

| Concern | Old (HEAD) | New (working tree) | Logical relation |
| --- | --- | --- | --- |
| `backend` service | Present (build, port 3001) | **Removed entirely** | B — unrelated to notifications |
| `frontend` service | Present (build, port 3000) | **Removed entirely** | B — unrelated to notifications |
| Postgres service name | `db` | Renamed to `postgres` | B — infra rename |
| Postgres image | `postgres:15-alpine` | Bumped to `postgres:16-alpine` | B — major version bump |
| Postgres credentials | `postgres / postgres / sitepilot` | Changed to `sitepilot / sitepilot123 / sitepilot` | B — credential rotation |
| Postgres healthcheck | `pg_isready -U postgres`, 5s | `pg_isready -U sitepilot -d sitepilot`, 10s | B — follows credential change |
| Redis | Present, no healthcheck | Healthcheck added | B — infra hardening |
| `adminer` | Absent | **Added** (port 8080) | B — dev tooling |
| `mailhog` | Absent | **Added** (ports 1025/8025) | A-adjacent — required by `NotificationsModule` SMTP defaults |

### 4.1 Coupling note

Only the **MailHog block** is logically coupled to the notifications feature (Group A). Everything else in this diff is a local dev-environment refactor (Group B) with implications well outside notifications: container topology change, Postgres major upgrade, credential change, and removal of the application services from compose.

### 4.2 Hard rule — docker-compose.yml is **not** an OSCTL artifact

`docker-compose.yml` is a **runtime / infrastructure** file. Per strict-mode constraints (no infrastructure authority, no runtime orchestration), **`docker-compose.yml` MUST NOT be included in any OSCTL commit, OSCTL ledger event, OSCTL projection, or LR-1 application step**. It belongs to the backend/runtime track and must be isolated *out of* the OSCTL workspace before LR-1 can proceed.

---

## 5. Untracked Backend Trees

### 5.1 `backend/src/notifications/` (Group A — coherent feature)

```
backend/src/notifications/
├── dto/queue-notification.dto.ts
├── email-templates/
│   ├── org-invite.hbs
│   ├── password-reset.hbs
│   ├── publish-done.hbs
│   └── publish-failed.hbs
├── notification.entity.ts
├── notifications.module.ts
├── notifications.processor.ts
└── notifications.service.ts
```

Findings:

- `notifications.module.ts` is `@Global()`, registers `TypeOrmModule.forFeature([Notification])`, registers a Bull queue `notifications`, and wires `MailerModule` with a Handlebars adapter pointed at `./email-templates`.
- `notifications.service.ts` exposes `notifyPublishDone`, `notifyPublishFailed`, `notifyOrgInvite`, `notifyPasswordReset`, plus a generic `queueEmail`. SMTP defaults to `localhost:1025` (MailHog).
- `notifications.processor.ts` consumes the Bull queue, dispatches to Handlebars templates by `NotificationType`.
- `notification.entity.ts` defines a single `notifications` table with `NotificationType` and `NotificationStatus` enums.
- Four matching `.hbs` templates exist for every wired `NotificationType` (the fifth, `PAGE_COMMENT`, is declared in the enum but has **no template file**; this is a latent minor gap, not a blocker).

Verdict: **Internally coherent.** Together with the `app.module.ts` notifications wiring and the `docker-compose.yml` MailHog service, this is one well-scoped feature branch's worth of work.

### 5.2 `backend/src/templates/` (Group C — duplicate / parallel rewrite, NOT WIRED)

```
backend/src/templates/
├── dto/templates.dto.ts
├── template.entity.ts
├── templates.controller.ts
├── templates.module.ts
└── templates.service.ts
```

Findings:

- A **fully tracked** templates module already exists at `backend/src/modules/templates/` (module, service, controller, entity), and that is the path `app.module.ts` continues to import (`./modules/templates/templates.module`).
- The new untracked `backend/src/templates/` is **NOT referenced** from `app.module.ts` and is **NOT imported** by any current file in the modified tree.
- The two `Template` entities have **incompatible schemas**:
  - Tracked `modules/templates/template.entity.ts`: `projectId`-scoped, `structure` jsonb with `blocks/seoRules/requiredVars`, `tags[]`, category enum `home/business/power/seo_city/seasonal/b2b`, snake_case column names, soft-delete via `@DeleteDateColumn`.
  - Untracked `templates/template.entity.ts`: `organizationId`-scoped, `blocksSnapshot` jsonb array, `slug` + `usageCount`, category enum `landing/blog/portfolio/ecommerce/corporate/custom`.
- The untracked controller is mounted at `organizations/:orgId/templates` and uses `OrgMemberGuard`/`RolesGuard`/`OrgRole` — i.e. it presupposes the multi-tenant org model. The tracked module pre-dates that model.

Verdict: **Unrelated to the notifications feature.** This is an in-progress **rewrite** of the templates module into a new top-level location with a new schema, **left dangling**. Committing it as-is would create two competing TypeORM `@Entity('templates')` classes targeting the same DB table — a runtime hazard.

### 5.3 Modified `app.module.ts` Template-import removal (Group D)

The deletion of `import { Template } from './modules/templates/template.entity';` is logically independent of both the notifications feature and the parallel templates rewrite:

- It is **not** a "switch to the new untracked templates path" — no import of `./templates/...` was added.
- It is **not** a clean entity-registration cleanup — `Template` is still referenced on the entities line.

Treat it as an **accidental edit** until the human confirms intent.

---

## 6. Coherence Assessment Matrix

| Logical group | Files | Coherent in itself? | Coherent with the others? |
| --- | --- | --- | --- |
| **A. Notifications feature** | `backend/src/notifications/**`, `app.module.ts` (NotificationsModule + Notification import + entity registration), `docker-compose.yml` MailHog block | Yes | Partial overlap with B only via MailHog |
| **B. Dev-infra compose refactor** | Rest of `docker-compose.yml` (drop backend/frontend services, Postgres rename + 15→16 + creds, Adminer, Redis healthcheck) | Yes (as one infra change) | No — unrelated to notifications or templates |
| **C. Parallel templates rewrite** | `backend/src/templates/**` | No — orphaned, not wired, schema-conflicts with tracked module | No — unrelated to A and B |
| **D. Accidental Template-import deletion** | One line in `app.module.ts` | Broken — leaves an undefined symbol in `entities[]` | No — blocks compilation of A's wiring too |

**Conclusion:** Multiple unrelated feature/infra/refactor concerns are mixed in one working tree. The state is **not** a single backend feature branch.

---

## 7. Recommended Human Action

Recommended sequence for the human operator (no automation; this agent will NOT execute these):

### Step 0 — Repair the build break (Group D)

Decide before anything else:
- Either restore `import { Template } from './modules/templates/template.entity';` in `app.module.ts`, **or**
- Remove `Template` from the `entities: [...]` array on the same line.

Without this, no commit from Group A will build.

### Step 1 — Triage the parallel templates rewrite (Group C)

The duplicate `backend/src/templates/**` tree must be resolved before any commit, because committing it alongside Group A would introduce a second `@Entity('templates')` class. Options for the human (in preferred order):

1. **Move to its own feature branch** (`feature/templates-org-rewrite`) — preserve the work for later integration. This is the safest default.
2. **Stash with a label** (`templates-org-rewrite`) if the rewrite is not ready for a branch yet.
3. **Discard** — *only with explicit human approval*, because this would lose new code. This review will not recommend discard.

### Step 2 — Commit the notifications feature (Group A) on a feature branch

After Steps 0 and 1, the remaining backend changes that belong together are:
- `backend/src/notifications/**` (new)
- `backend/src/app.module.ts` (notifications wiring only, with Group D repaired)
- `docker-compose.yml` — **MailHog block only**

But `docker-compose.yml` cannot be cleanly split inside a single commit while everything else in Group B is still in it. Two sub-options:

- **A.i (clean):** Stash all `docker-compose.yml` changes, commit Group A backend files on a feature branch, then re-apply MailHog as a separate commit on the same branch.
- **A.ii (pragmatic):** Commit Group A backend files on a feature branch first with `docker-compose.yml` left unstaged; treat the MailHog dependency as documentation in the PR description.

### Step 3 — Commit the dev-infra compose refactor (Group B) separately

The remaining `docker-compose.yml` changes (Postgres rename/bump, credential change, removal of backend/frontend services, Adminer, Redis healthcheck) should go in **their own commit** on a **separate branch**, e.g. `chore/dev-compose-refactor`. This commit must be reviewed for:

- Whether removing the `backend` and `frontend` services from compose is intentional (it changes how developers run the stack locally).
- Whether the Postgres credential change requires synchronized `.env` updates.
- Whether the Postgres 15→16 bump requires a data migration step.

This is **not an OSCTL concern** and **must not be commingled with OSCTL changes**.

---

## 8. Suggested Commands for Human Review (DO NOT EXECUTE FROM THIS AGENT)

The following commands are listed **only** for the human operator to run manually. This agent will not stage, commit, stash, branch, push, merge, or discard anything.

### 8.1 Inspect (read-only, safe)

```bash
git status --short
git diff --stat
git diff -- backend/src/app.module.ts
git diff -- docker-compose.yml

# Confirm the untracked templates tree is not referenced anywhere yet.
git grep -n "from '\./templates/" -- backend/src
git grep -n "from '\./templates'" -- backend/src

# Confirm notifications wiring path.
git grep -n "notifications" -- backend/src/app.module.ts
```

### 8.2 Isolate the parallel templates rewrite (Group C) — choose ONE

**Option C-1: move to a dedicated branch (recommended)**

```bash
# From main, with all current changes still in the working tree:
git checkout -b feature/templates-org-rewrite
git add backend/src/templates/
git commit -m "wip: parallel org-scoped templates rewrite (not wired)"
git checkout main
# The branch now owns the untracked tree; main is cleaner.
```

**Option C-2: stash with a label**

```bash
git stash push -u -m "templates-org-rewrite" -- backend/src/templates/
```

**Option C-3: discard — REQUIRES EXPLICIT HUMAN APPROVAL**

> Not recommended by this review. Loss of new code. Only proceed if the human has confirmed the rewrite is obsolete:
>
> ```bash
> # DESTRUCTIVE — requires explicit human approval.
> # rm -r backend/src/templates/
> ```

### 8.3 Commit the notifications feature (Group A) on its own branch

```bash
# After Step 0 (build-break repair) and Step 1 (Group C isolated):
git checkout -b feature/notifications
# Stage only Group A backend files:
git add backend/src/notifications/
git add backend/src/app.module.ts
git commit -m "feat(notifications): queued email notifications via Bull + Handlebars"
```

If keeping MailHog with this branch (sub-option A.i):

```bash
# Manually re-introduce ONLY the mailhog service block in docker-compose.yml,
# then:
git add -p docker-compose.yml   # accept ONLY the mailhog hunk
git commit -m "chore(compose): add mailhog for notifications dev"
```

### 8.4 Commit the dev-infra compose refactor (Group B) separately

```bash
git checkout -b chore/dev-compose-refactor
git add docker-compose.yml
git commit -m "chore(compose): postgres 15→16, credential rotation, drop app services, add adminer"
```

### 8.5 OSCTL workspace check (read-only)

After Groups A, B, C, and D are isolated, the OSCTL operator may then verify:

```bash
git status --short -- ops/osctl/
git diff --stat -- ops/osctl/
# Expected: zero modifications to tracked backend / runtime files appearing in the
# same change-set as any OSCTL artifact.
```

This is informational only. **This review does not authorize OSCTL commits.**

---

## 9. Hard Warnings

1. **`docker-compose.yml` MUST NOT enter any OSCTL commit.** It is a runtime/infrastructure artifact. Its presence in an OSCTL ledger event, projection, or LR-1 step would violate the OSCTL trust boundary.
2. **`backend/src/templates/**` MUST NOT be committed alongside the existing `backend/src/modules/templates/**`** without human review. The two define a conflicting `@Entity('templates')` mapping and would corrupt TypeORM metadata at runtime.
3. **`backend/src/app.module.ts` is currently in a probable non-compiling state** (`Template` referenced without import). No commit of Group A may proceed until this is repaired.
4. **No automatic stash, discard, branch, commit, or push** is performed or implied by this report. Every command in §8 is a manual operator action.

---

## 10. OSCTL LR-1 Status

**OSCTL LR-1 remains BLOCKED.**

Reasons (all four must be cleared by the human, in order):

1. Backend runtime workspace is **mixed** — four logical groups entangled (A/B/C/D).
2. `backend/src/app.module.ts` is in a **likely non-compiling** state.
3. `docker-compose.yml` carries **non-OSCTL infra changes** that must be isolated to a non-OSCTL branch before any LR-1 ledger event is emitted.
4. `backend/src/templates/**` is an **un-wired parallel rewrite** that must be branched/stashed before the working tree can be considered isolated.

Once the four groups are isolated per §7 and the working tree contains only OSCTL artifacts (or is clean), OSCTL LR-1 may be re-evaluated by the OSCTL operator. This agent has **no authority** to declare LR-1 ready.

---

## 11. Strict-Mode Compliance Summary

| Constraint | Status |
| --- | --- |
| READ-ONLY REVIEW ONLY | Honored. Only inspection tools used. |
| NO deploy | Honored. |
| NO Railway | Honored. |
| NO Cloudflare | Honored. |
| NO CI mutation | Honored. |
| NO `package.json` changes | Honored. Not touched. |
| NO commits | Honored. No `git commit` issued. |
| NO `git push` | Honored. |
| NO merge | Honored. |
| NO staging | Honored. No `git add` issued. |
| NO OSCTL edits | Honored. No existing OSCTL artifact modified. |
| NO governance edits | Honored. |
| NO runtime orchestration | Honored. |
| NO infrastructure authority | Honored. |
| NO production mutations | Honored. |
| Edit backend files | NOT performed. |
| Edit `docker-compose.yml` | NOT performed. |
| Edit OSCTL docs | NOT performed. |
| Stash automatically | NOT performed. |
| Discard automatically | NOT performed. |
| Create exactly one report at `ops/osctl/audit/BACKEND_RUNTIME_ISOLATION_REVIEW.md` | Performed (this file, the only write of the session). |

---

*End of report — Backend Runtime Isolation Review Agent.*
