# BACKEND CLEANUP DECISION PLAN

**Mode:** READ-ONLY PLANNING
**Authority:** Human-final
**Scope:** Backend / runtime workspace only (no governance, no infra, no deploy)
**Repository:** `D:\Projects\SitePilot\sitepilot-railway`
**Branch (HEAD):** `main` @ `ca6f1e56` — "fix docker compose and production config"
**OSCTL kernel:** FROZEN — no governance expansion proposed in this document.

---

## 1. EXECUTIVE VERDICT

**NOT SAFE** — to merge, stage, or commit anything in the current working tree as-is.

**SAFE WITH HUMAN CHOICES** — to isolate the working tree into separated branches once the human confirms intent for each group below.

Justification (verified, not inferred):

1. `backend/src/app.module.ts` is in a **provably broken state**. The diff removes the `Template` import but the symbol `Template` is still referenced in the TypeORM `entities[]` array at line 82. This is a guaranteed `TS2304: Cannot find name 'Template'`.
2. `backend/src/templates/**` (untracked) and `backend/src/modules/templates/**` (tracked) **both declare `@Entity('templates')`** with **incompatible schemas**. Duplicate table/entity risk is confirmed.
3. The notifications module references runtime dependencies — `@nestjs/bull`, `@nestjs-modules/mailer`, `bull`, and `handlebars` — that are **not present in `backend/package.json`** (verified: zero matches). The feature is incomplete and non-buildable.
4. The `docker-compose.yml` working-tree diff **fuses multiple unrelated infra concerns** into one dirty file. It must not be staged as a single unit and must never enter OSCTL governance commits.

These are independent failure modes. All must be resolved in the backend/runtime workspace **before** OSCTL LR-1 can be unblocked.

---

## 2. GROUP CLASSIFICATION

### Group A — Notifications feature

| Aspect | Finding |
|---|---|
| Location | `backend/src/notifications/**` (9 untracked files) |
| Files | `notification.entity.ts`, `notifications.module.ts`, `notifications.service.ts`, `notifications.processor.ts`, `dto/queue-notification.dto.ts`, 4× `email-templates/*.hbs` |
| Wiring in `app.module.ts` | `NotificationsModule` imported and registered; `Notification` entity registered in `entities[]` |
| Runtime dependencies | Bull queue (`@nestjs/bull`), Mailer (`@nestjs-modules/mailer`), Handlebars adapter, `bull` |
| Dependency status in `backend/package.json` | **MISSING — verified zero matches for all four** |
| External infra needed | Redis (present), SMTP (MailHog added in compose diff) |
| Self-containment | Module is `@Global()` and otherwise stands alone |
| Classification | **Coherent feature intent, but incomplete and non-buildable in current state** |

### Group B — `docker-compose.yml` refactor

The single working-tree diff fuses **five separate intents**:

| Sub-change | Type | Risk |
|---|---|---|
| Service `db` renamed to `postgres` | Topology rename | Breaks any `depends_on: db` consumer |
| Postgres image `15-alpine` → `16-alpine` | **Major version bump** | Existing `pgdata` volume from PG15 will not start under PG16 without `pg_upgrade` |
| Credentials `postgres/postgres` → `sitepilot/sitepilot123` | Auth change | Existing pgdata volume rejects new credentials; backend `.env` must be coordinated |
| `backend` and `frontend` services **removed entirely** | Topology removal | `docker compose up` no longer brings up the application end-to-end |
| Adminer added; Redis healthcheck added; MailHog added | Dev-tooling additions | Low risk individually, but mixed with infra-breaking changes |
| Classification | **Heterogeneous. Multiple unrelated infra concerns fused into one dirty file. Must be split before any commit.** |

### Group C — Parallel templates rewrite

| Aspect | Tracked path | Untracked path |
|---|---|---|
| Location | `backend/src/modules/templates/` | `backend/src/templates/` |
| `@Entity` decorator | `@Entity('templates')` | `@Entity('templates')` — **same physical table** |
| `TemplateCategory` enum values | `HOME, BUSINESS, POWER, SEO_CITY, SEASONAL, B2B` | `LANDING, BLOG, PORTFOLIO, ECOMMERCE, CORPORATE, CUSTOM` |
| Identity column | `projectId` | `organizationId` |
| Payload column | `structure` (typed jsonb) | `blocksSnapshot` (jsonb array) |
| `app.module.ts` imports `TemplatesModule` from | **`./modules/templates/templates.module` (tracked)** | not imported anywhere |
| External consumers | `backend/src/modules/pages/pages.service.ts` line 18 imports `TemplatesService` from tracked module | none |
| Classification | **Tracked module is load-bearing. Untracked rewrite is dormant but dangerous: both declare `@Entity('templates')` with incompatible schemas/enums. Duplicate table/entity risk confirmed.** |

### Group D — Compile/runtime break in `app.module.ts`

Verified from `git diff`:

```
-import { Template } from './modules/templates/template.entity';
+import { Notification } from './notifications/notification.entity';
```

The `Template` import was removed and replaced one-for-one by the `Notification` import. However, `entities[]` (line 82) **still contains** `Template`:

```80:89:backend/src/app.module.ts
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

Classification: **Confirmed compile break — not "probable".** TypeScript will emit `TS2304: Cannot find name 'Template'`.

---

## 3. HUMAN DECISION RECOMMENDATIONS

| Group | Recommendation | Rationale |
|---|---|---|
| **A — Notifications** | **ISOLATE BRANCH** → `feature/notifications` | Coherent feature; needs dependency commit + tests; do not lose work |
| **B — docker-compose** | **ISOLATE BRANCH** → `chore/dev-compose-refactor`; **INVESTIGATE FURTHER** before committing risky sub-changes (PG16 bump, creds, service removal). **DISCARD ONLY WITH EXPLICIT APPROVAL** for infra-breaking hunks if intent is unclear. | Five unrelated decisions packed into one diff |
| **C — Templates rewrite (untracked)** | **STASH** or **ISOLATE BRANCH** → `experiment/templates-v2-rewrite`. **DO NOT** allow co-existence with tracked module on same branch. | Same `@Entity('templates')` collision; pages.service.ts depends on tracked module |
| **C — Templates module (tracked)** | **KEEP** untouched | Load-bearing dependency for `pages.service.ts` |
| **D — `app.module.ts` compile break** | **ISOLATE BRANCH** → `fix/app-module-template-compile`; **INVESTIGATE FURTHER** then choose smallest repair (restore import) vs intentional removal (requires pages refactor). **DO NOT** mix with notifications branch. | Accidental one-line deletion blocks entire build |

No group is recommended for unconditional **discard**. No group is recommended for blind **keep** of the current dirty working tree.

---

## 4. BRANCH STRATEGY

Recommended branch separation, in priority order. (Suggestions only — human executes.)

```
main (frozen — do not push current dirty tree)
│
├── fix/app-module-template-compile     ← URGENT: smallest, unblock build
│       restores Template import OR cleanly removes Template from entities[]
│
├── feature/notifications                ← Group A
│       backend/src/notifications/**
│       requires dependency additions (separate human decision)
│       base: fix/app-module-template-compile
│
├── chore/dev-compose-refactor           ← Group B
│       split into safe subset (Adminer, Redis healthcheck, MailHog)
│       vs risky subset (postgres rename, PG16, creds, service removal)
│
└── experiment/templates-v2-rewrite      ← Group C
        backend/src/templates/** only
        must not coexist with tracked module on same branch
```

Constraints:

- **No branch may contain `ops/osctl/**` changes alongside backend or compose changes.**
- **`fix/app-module-template-compile` must be resolved first** before notifications or templates branches proceed.
- **`experiment/*` branches must not auto-merge** and must not be referenced from OSCTL-governed deploy events.

---

## 5. COMPILE-RISK ANALYSIS

### 5.1 The exact failure

| Item | Detail |
|---|---|
| File | `backend/src/app.module.ts` |
| Symbol | `Template` |
| Import | removed by working-tree diff |
| Usage | still present in `entities[]` line 82 |
| Expected output | `TS2304: Cannot find name 'Template'.` |
| Runtime consequence | even if silenced, `pages.service.ts` uses `TemplatesService` → `Repository<Template>` and would fail at injection |

### 5.2 Cross-module reach

`backend/src/modules/pages/pages.service.ts`:

- Line 18: `import { TemplatesService } from '../templates/templates.service';`
- Line 68: constructor-injected `TemplatesService`
- Line 317: `async generateFromTemplate(...)`

The templates module is **not optional**. Removing it from `app.module.ts` breaks `pages` at module-load time.

### 5.3 Safest human repair options (decreasing safety)

1. **Smallest revert (RECOMMENDED).** Restore exactly:
   ```typescript
   import { Template } from './modules/templates/template.entity';
   ```
   Single-line fix. Notifications wiring remains. Build returns to known-good shape.

2. **Intentional removal (LARGER).** Remove `Template` from `entities[]`, remove `TemplatesModule` from `imports[]`, refactor `pages.service.ts`. This is feature deletion — requires explicit human approval.

3. **Replacement with rewrite (NOT RECOMMENDED for cleanup pass).** Switch imports to `./templates/`. Requires Group C decisions, schema migration, and pages.service.ts updates. Out of scope for unblock-the-build.

Option (1) is the only repair that requires no other group decision to be settled first.

---

## 6. TYPEORM / SCHEMA RISK ANALYSIS

### 6.1 Duplicate entity on same table name

- **Tracked:** `backend/src/modules/templates/template.entity.ts` → `@Entity('templates')`
- **Untracked:** `backend/src/templates/template.entity.ts` → `@Entity('templates')`

If both classes load into the same TypeORM `DataSource`:

- Metadata conflict at `DataSource.initialize()`.
- With `synchronize: true` (enabled via `cfg.get<boolean>('db.sync')`), TypeORM may issue destructive `ALTER TABLE` based on whichever metadata processes last.
- Column sets are **not subsets** — no safe automatic migration.

**Schema collision probability: HIGH** if both modules are ever wired simultaneously.

### 6.2 Column-level incompatibility

| Concern | Tracked | Untracked |
|---|---|---|
| Naming convention | snake_case via `@Column({ name: ... })` | camelCase, no explicit names |
| Identity FK | `project_id` | `organizationId` |
| Payload | `structure jsonb` (typed object) | `blocksSnapshot jsonb` (array) |
| Active flag | `is_active boolean` | absent |
| Tags | `text[]` | absent |
| Category | string varchar | typed Postgres enum |

**Migration ambiguity:** no clean forward-only migration between the two schemas.

### 6.3 Parallel templates implementation risk

- Untracked rewrite must **not** declare `@Entity('templates')` while tracked module is active.
- If revived on `experiment/templates-v2-rewrite`, entity should be renamed to `@Entity('templates_v2')` or gated behind a proper TypeORM migration (no `synchronize` reliance).
- No part of the rewrite should be staged on `main` or any branch with `synchronize: true` against a shared database.

---

## 7. DOCKER-COMPOSE ISOLATION ANALYSIS

### 7.1 Per-line attribution

| Compose change | Attributable to | Belongs on branch |
|---|---|---|
| `db` → `postgres` (service rename) | Infra refactor | `chore/dev-compose-refactor` (risky subset) |
| `postgres:15-alpine` → `postgres:16-alpine` | Infra refactor | `chore/dev-compose-refactor` (risky subset) |
| `POSTGRES_USER/PASSWORD/DB` rotated | Infra refactor | `chore/dev-compose-refactor` (risky subset) |
| `pg_isready` healthcheck retargeted | Follows rename | `chore/dev-compose-refactor` (risky subset) |
| `backend:` service block removed | Topology change | `chore/dev-compose-refactor` (risky subset) |
| `frontend:` service block removed | Topology change | `chore/dev-compose-refactor` (risky subset) |
| Redis `container_name`, `restart`, healthcheck | Dev-tooling polish | `chore/dev-compose-refactor` (safe subset) |
| `adminer` service added | Dev tooling | `chore/dev-compose-refactor` (safe subset) |
| `mailhog` service added | Notifications dependency | `feature/notifications` or safe compose subset |

### 7.2 What MUST NEVER enter OSCTL commits

- The entire `docker-compose.yml` file is **runtime infrastructure**, not governance.
- No commit touching `docker-compose.yml` may also touch `ops/osctl/**`.
- No OSCTL ledger event may reference compose contents directly.
- PG15 → PG16 bump, credential rotation, and service removals are **runtime authority** decisions; OSCTL must remain agnostic.

---

## 8. OSCTL IMPACT

Confirmed:

- **OSCTL LR-1 remains BLOCKED.** Blocker unchanged: mixed backend/runtime workspace with confirmed compile break, untracked feature additions, untracked parallel module, and heterogeneous compose diff.
- **Backend/runtime state must be isolated first.** Until working tree is split per §4, OSCTL has no clean baseline to anchor against.
- **`docker-compose.yml` MUST NEVER enter governance commits.** Runtime authority, not governance authority.
- **`backend/**` MUST NEVER enter trust-layer commits.** OSCTL kernel (`ops/osctl/**`) and backend code are commit-disjoint.
- **No governance expansion proposed.** OSCTL kernel remains frozen.

---

## 9. HUMAN COMMAND SUGGESTIONS

> Suggestions only. Do not execute from this document. None are destructive when reviewed first.

### 9.1 Git review commands

```powershell
git status -s
git diff --stat
git diff backend/src/app.module.ts
git diff docker-compose.yml
git ls-files --others --exclude-standard backend/
```

### 9.2 Branch creation suggestions

```powershell
git switch -c fix/app-module-template-compile
# human restores Template import, verifies build, does NOT commit yet

git switch main
git switch -c feature/notifications
# carry only backend/src/notifications/** + dependency updates

git switch main
git switch -c chore/dev-compose-refactor
# split compose diff into safe vs risky hunks before any commit

git switch main
git switch -c experiment/templates-v2-rewrite
# carry only backend/src/templates/**
```

### 9.3 Stash suggestions (alternative to branch isolation)

```powershell
git stash push -u -m "templates-v2-rewrite (untracked)" -- backend/src/templates
git stash push -u -m "notifications-feature (untracked)" -- backend/src/notifications
git stash push -m "compose-mixed-refactor" -- docker-compose.yml
```

Branches are safer than stashes for non-trivial features.

### 9.4 Compile inspection suggestions

```powershell
cd backend
npx tsc --noEmit
npm ls @nestjs/bull @nestjs-modules/mailer bull handlebars 2>&1
```

Expect: `TS2304` for `Template`; missing packages for notifications deps.

### 9.5 Workspace cleanup suggestions

```powershell
git ls-files --others --exclude-standard | rg "^backend/"
git ls-files --others --exclude-standard | rg "^ops/osctl/"
git diff --name-only | rg -v "^ops/"
```

Separates backend/runtime surface from OSCTL surface before any branch carries files.

### 9.6 OSCTL isolation preparation suggestions

```powershell
git diff --name-only | rg "^ops/osctl/"
git ls-files --others --exclude-standard | rg "^ops/osctl/"
```

OSCTL untracked surface is a separate planning track. Must not be co-staged with backend or compose changes.

---

## 10. FINAL SAFEST NEXT STEP

**Single safest next human action:**

1. **Create branch** `fix/app-module-template-compile`
2. **Restore exactly one line** in `backend/src/app.module.ts`:
   ```typescript
   import { Template } from './modules/templates/template.entity';
   ```
3. **Run compile check:**
   ```powershell
   cd backend
   npx tsc --noEmit
   ```
4. **DO NOT commit yet**
5. **DO NOT touch notifications or templates rewrite yet**
6. **DO NOT start LR-1 yet**

Rationale: smallest possible change on its own branch restores a known-good build baseline. Unblocks every subsequent decision in §3 without entangling Groups A, B, or C.

---

## OUTPUT SUMMARY

- **Backend cleanup verdict:** NOT SAFE to commit current working tree; SAFE WITH HUMAN CHOICES to isolate into §4 branch set after §10 single-line repair.
- **Group classification:**
  - A (Notifications) → incomplete, missing deps → `feature/notifications`
  - B (Compose) → fused infra concerns → `chore/dev-compose-refactor` (split safe/risky)
  - C (Templates rewrite) → entity collision with tracked module → `experiment/templates-v2-rewrite`
  - D (app.module.ts) → confirmed TS2304 → `fix/app-module-template-compile`
- **Safest human decision:** restore deleted `Template` import on `fix/app-module-template-compile`, run `npx tsc --noEmit`, do not commit, do not touch other groups, do not start LR-1.
- **OSCTL LR-1 status:** **BLOCKED**, unchanged. Unblocks only after §4 branch isolation and clean `main`.
- **Remaining blockers:**
  - Compile break in `app.module.ts` (highest priority)
  - Missing notification runtime dependencies in `backend/package.json`
  - Entity-name collision between tracked and untracked templates modules
  - Heterogeneous `docker-compose.yml` diff requiring split
  - Untracked OSCTL audit surface (separate track; not addressed here)

---

## STRICT-MODE COMPLIANCE SUMMARY

| Constraint | Status |
|---|---|
| READ-ONLY PLANNING ONLY | OK — only this document created/updated |
| NO deploy / Railway / Cloudflare | OK |
| NO CI mutation | OK |
| NO `package.json` changes | OK — inspected read-only |
| NO commits / push / merge / stage | OK |
| NO stash / discard automatically | OK — suggestions only in §9 |
| NO backend edits | OK — inspected read-only |
| NO `docker-compose.yml` edits | OK — diff inspected read-only |
| NO OSCTL kernel edits | OK — only this audit artifact under `ops/osctl/audit/` per explicit instruction |
| NO governance edits | OK — kernel untouched |
| NO runtime orchestration | OK |
| NO infrastructure authority | OK |
| NO production mutations | OK |
| Only allowed action #10 (one planning report) | OK |

---

## CORE PRINCIPLES (ECHOED)

- **VERIFY before ACT.** Every claim grounded in verified `git diff` or file read.
- **SIMPLIFY before EXPAND.** Recommended first action is a one-line revert, not a refactor.
- **HUMAN AUTHORITY FINAL.** Every group ends in a human decision; no automatic resolution.
- **OSCTL governance kernel remains FROZEN.** No kernel change proposed.
