# Template System Import Path Audit

**Agent:** Template System Import Path Audit Agent  
**Repository:** `D:\Projects\SitePilot\sitepilot-railway`  
**Date:** 2026-05-24  
**Mode:** READ-ONLY (strict) — no files modified except this report  
**Scope:** `backend/src/templates/**` vs `backend/src/modules/templates/**`

---

## 1. Executive Verdict

**ABANDONED REWRITE DETECTED**

| Dimension | Assessment |
|-----------|------------|
| Runtime wiring | **Stable on one path** — only `backend/src/modules/templates/**` is imported by `AppModule` and `PagesModule`. |
| Workspace / build | **Mixed and blocked** — untracked `backend/src/templates/**` is compiled by `tsc` / `nest build` and fails; `backend/src/notifications/**` is a separate compile blocker (missing npm deps). |
| Schema alignment | **Unsafe if rewrite is wired** — rewrite entity/service assume columns and tables that do not match the checked-in migration for `templates` or the current pages/content model. |

**Canonical template system (runtime):** `backend/src/modules/templates/**`  
**Abandoned / incomplete rewrite:** `backend/src/templates/**` (untracked, unwired, broken imports)  
**Collision risk if both wired:** **HIGH** (duplicate `@Entity('templates')`, incompatible schemas, duplicate `TemplatesModule` / `TemplatesService` class names)  
**Collision risk at current wiring:** **LOW at runtime** (rewrite not in Nest graph); **MEDIUM at build** (TypeScript still typechecks `src/templates/**`).

---

## 2. Template System Map

### 2.1 `backend/src/modules/templates/**` (tracked — load-bearing)

| Artifact | Path | Role |
|----------|------|------|
| Module | `templates.module.ts` | `TypeOrmModule.forFeature([Template])`, exports `TemplatesService` |
| Controller | `templates.controller.ts` | `GET /templates`, `GET /templates/:id` (JWT via `../auth/guards`) |
| Service | `templates.service.ts` | CRUD list/find, `buildBlocks()`, Solomiya seed on `onModuleInit` |
| Entity | `template.entity.ts` | `@Entity('templates')` — `projectId`, `structure` (jsonb), `tags[]`, soft delete |
| DTOs | *(none)* | Query params only (`projectId` on list) |

**Module wiring**

- `app.module.ts` → `import { TemplatesModule } from './modules/templates/templates.module'`
- `app.module.ts` → `entities: [..., Template from './modules/templates/template.entity', ...]`
- `pages.module.ts` → `import { TemplatesModule } from '../templates/templates.module'` (resolves to **this** tree, not `src/templates`)

**Dependency usage**

- `pages.service.ts` → `TemplatesService` from `../templates/templates.service` (same tree)
- Uses **`findById()`** and **`buildBlocks()`** (generate / bulk-generate flows)
- Does **not** use org-scoped CRUD, `applyToPage`, or `blocksSnapshot`

**Git:** All four files **tracked** (`git ls-files`).

---

### 2.2 `backend/src/templates/**` (untracked — parallel rewrite)

| Artifact | Path | Role |
|----------|------|------|
| Module | `templates.module.ts` | Same Nest shape; **not imported** by `app.module.ts` or any tracked module |
| Controller | `templates.controller.ts` | Org-scoped REST: `organizations/:orgId/templates` (+ apply / refresh-snapshot) |
| Service | `templates.service.ts` | Org CRUD, `applyToPage`, raw SQL against `blocks` table |
| Entity | `template.entity.ts` | `@Entity('templates')` — `organizationId`, `slug`, `blocksSnapshot` (jsonb array) |
| DTOs | `dto/templates.dto.ts` | `CreateTemplateDto`, `UpdateTemplateDto`, `ApplyTemplateDto` |

**Module wiring**

- **No runtime imports** from `app.module.ts`, `pages.module.ts`, or any other tracked file.
- Would register a second `TemplatesModule` / `TemplatesService` / `TemplatesController` if added to `AppModule` without renaming.

**Git:** Entire tree **untracked** (`??` in git status).

---

## 3. Canonical System Analysis

| Question | Answer |
|----------|--------|
| Which system is load-bearing? | **`backend/src/modules/templates/**`** |
| Which does `pages.service.ts` reference? | **`../templates/...` under `modules/`** — i.e. `modules/templates`, not `src/templates` |
| Which is wired into runtime? | **`modules/templates`** via `AppModule` + `PagesModule` |
| Which appears incomplete? | **`src/templates`** — broken imports, no Nest wiring, schema/SQL mismatch with repo migrations |

**Evidence — runtime entrypoints**

```26:26:backend/src/app.module.ts
import { TemplatesModule } from './modules/templates/templates.module';
```

```39:39:backend/src/app.module.ts
import { Template } from './modules/templates/template.entity';
```

```15:15:backend/src/modules/pages/pages.module.ts
import { TemplatesModule } from '../templates/templates.module';
```

```18:18:backend/src/modules/pages/pages.service.ts
import { TemplatesService } from '../templates/templates.service';
```

**Evidence — pages dependency on load-bearing API**

- `pages.service.ts` calls `this.templatesService.findById()` and `this.templatesService.buildBlocks()` (lines ~327, 330, 478, 488).
- Those methods exist **only** on `modules/templates/templates.service.ts`, not on `src/templates/templates.service.ts` (which exposes `findOne`, `applyToPage`, etc.).

**False positive cleared:** `app.module.ts` **does** import `TemplatesModule` from `./modules/templates/...`; prior “missing import” concern does not apply to the tracked module path.

---

## 4. Import Failure Analysis

### 4.1 `src/templates/templates.controller.ts`

Broken relative imports (verified via `npx tsc --noEmit`):

| Import in rewrite | Resolved path | Exists? |
|-------------------|---------------|---------|
| `../auth/guards/jwt-auth.guard` | `src/auth/guards/jwt-auth.guard` | **No** — auth lives under `src/modules/auth/`; guards are consolidated in `guards.ts` |
| `../auth/guards/org-member.guard` | `src/auth/guards/org-member.guard` | **No** — no `OrgMemberGuard` in repo |
| `../auth/guards/roles.guard` | `src/auth/guards/roles.guard` | **No** — `RolesGuard` is at `src/modules/common/guards/roles.guard.ts` |
| `../auth/decorators/roles.decorator` | `src/auth/decorators/...` | **No** |
| `../auth/decorators/current-user.decorator` | `src/auth/decorators/...` | **No** |
| `../organizations/enums/org-role.enum` | `src/organizations/enums/...` | **No** — org types are under `src/modules/organizations/`; `OrgRole` is on `organization-member.entity` |

### 4.2 Likely causes

1. **Path layout mismatch** — rewrite authored as if `auth/` and `organizations/` sit beside `templates/` under `src/`, but this repo nests them under `src/modules/`.
2. **Guard model mismatch** — rewrite expects per-file guards (`jwt-auth.guard`, `org-member.guard`); runtime uses `modules/auth/guards.ts` + `ProjectAccessGuard` / `PageAccessGuard` patterns elsewhere.
3. **Incomplete port** — controller/service/DTO/entity copied before import paths and infra were aligned.

### 4.3 Abandoned-rewrite signal

Yes. The rewrite is **not referenced**, **untracked**, **fails typecheck**, and targets **APIs and tables** (`blocks`, `organization_id` on pages, `slug` on templates) that are **not** defined in the current migration-backed schema for this codebase.

---

## 5. TypeORM Entity Analysis

### 5.1 Duplicate `@Entity('templates')`

| Field / concern | `modules/templates/template.entity.ts` | `src/templates/template.entity.ts` |
|-----------------|----------------------------------------|-------------------------------------|
| Table name | `templates` | `templates` |
| Scope key | `projectId` | `organizationId` |
| Payload | `structure` (blocks + seoRules + requiredVars) | `blocksSnapshot` (array) |
| Category | `string` column + enum in TS (`home`, `business`, …) | PG `enum` (`landing`, `blog`, …) |
| Slug | — | `slug` (required) |
| `is_active` | yes | — |
| `tags` | `text[]` | — |
| Column naming | snake_case explicit (`project_id`, …) | camelCase implicit |

### 5.2 Migration alignment (`1714000000000-InitialSchema.ts`)

The migration `templates` table matches **modules/templates** entity:

- `project_id`, `structure` jsonb, `tags[]`, `is_active`, `is_global`, snake_case timestamps, soft `deleted_at`.

It does **not** define `organization_id`, `slug`, or `blocks_snapshot`.

### 5.3 Collision risks

| Risk | If only `modules/templates` wired (today) | If rewrite also registered |
|------|---------------------------------------------|------------------------------|
| TypeORM metadata duplicate entity name | None | **HIGH** — two classes map to `templates` |
| `synchronize: true` schema drift | Low | **HIGH** — competing column sets |
| Repository `@InjectRepository(Template)` | Single class | **Ambiguous** — two `Template` symbols |
| Nest duplicate providers | None | **HIGH** — two `TemplatesService` unless aliased |

### 5.4 Rewrite service vs database

`src/templates/templates.service.ts` queries table **`blocks`** with `organization_id`. Repo migrations define **`content_blocks`**, not `blocks`. Pages are **project-scoped** (`page.entity.ts`), not `organization_id`-scoped. Applying this rewrite without new migrations would fail at runtime even if imports were fixed.

---

## 6. Runtime Safety Analysis

| Scenario | Safe today? | Notes |
|----------|-------------|-------|
| Both Nest modules loaded | **No risk currently** | Only `modules/templates/TemplatesModule` is imported |
| Accidental dual import in `AppModule` | **Would be unsafe** | Same class names (`TemplatesModule`, `TemplatesService`) |
| Entity metadata collision | **No runtime collision now** | Only `modules/templates/Template` in `TypeOrmModule.forRoot` entities |
| Build includes rewrite tree | **Unsafe for CI/local build** | `tsconfig.json` / `tsconfig.build.json` do not exclude `src/templates/**` |
| Parallel HTTP routes | **No** | Rewrite controller never registered |

**Conclusion:** Runtime is **single-system** today. Build workspace is **dual-system** because TypeScript compiles the orphan rewrite.

---

## 7. Cleanup Safety Analysis (recommendations only — not executed)

| Candidate | Path | Recommendation |
|-----------|------|----------------|
| **Canonical source of truth** | `backend/src/modules/templates/**` | **Preserve** — wired, tracked, migration-aligned, used by `pages.service.ts` |
| **Archive / isolate candidate** | `backend/src/templates/**` | **Isolate** (stash or feature branch) — do not merge into main until imports, guards, entity, and migrations are redesigned |
| **Rewrite candidate** | `src/templates` org/slug/blocksSnapshot model | **Defer** — requires new migrations, `blocks` table or adapter to `content`/`content_blocks`, and guard path fixes |
| **Do not delete yet** | Both | Keep rewrite recoverable until human chooses archive vs continue |

**Safest human strategy (ordered):**

1. **Isolate compile blockers** — stash or branch `src/templates/**` and `src/notifications/**` so `nest build` reflects only the load-bearing tree (human choice: exclude vs stash; agent did not execute).
2. **Preserve** `modules/templates` as the only wired module.
3. **Do not** add `src/templates/Template` to `app.module.ts` entities alongside the existing entity.
4. **Do not** merge rewrite in the same commit as backend/runtime fixes.
5. If continuing rewrite later: new migration branch, rename module (`OrgTemplatesModule`) to avoid Nest symbol collision, fix imports to `modules/auth` and `modules/organizations`.

---

## 8. Human Decision Options

| Option | Risk | When to choose |
|--------|------|----------------|
| **A. Preserve old system** (`modules/templates`) | Lowest | Default — matches production wiring and pages |
| **B. Archive new rewrite** (`src/templates` → branch/stash) | Low | Unblock compile/OSCTL isolation quickly |
| **C. Continue rewrite later** | Medium | Only with dedicated migration + guard refactor + table design |
| **D. Isolate experimental rewrite on branch** | Low | Keeps main tree load-bearing and reviewable |
| **E. Freeze current runtime** | Lowest | No template API changes until workspace clean |

**Not recommended now:** delete rewrite, merge rewrite into `AppModule`, or register both `Template` entities.

---

## 9. Final Safest Next Step

1. **DO NOT delete anything yet** — rewrite may contain intended org-template UX.
2. **DO NOT merge template rewrite** into main or into the same commit as notifications/docker/runtime work.
3. **Isolate compile blockers first** — `src/templates/**` (7 TS errors) and `src/notifications/**` (8 TS errors, missing `@nestjs/bull`, `@nestjs-modules/mailer`, `bull` in `package.json`).
4. **Preserve current load-bearing** `backend/src/modules/templates/**` — no import path changes in `app.module.ts` / `pages.module.ts` toward `src/templates`.
5. Re-run `npx tsc --noEmit` after isolation; expect zero errors from template rewrite only when `src/templates` is excluded or fixed.
6. Re-evaluate **OSCTL LR-1** only after backend/runtime workspace isolation per `ops/osctl/audit/BACKEND_RUNTIME_ISOLATION_REVIEW.md` (still **BLOCKED** while mixed dirty state remains).

---

## 10. Compile Error Inventory (verified 2026-05-24)

```
src/notifications/*     — 8 errors (missing @nestjs/bull, @nestjs-modules/mailer, bull)
src/templates/templates.controller.ts — 7 errors (broken ../auth/* and ../organizations/* paths)
src/modules/templates/* — 0 errors
```

`app.module.ts` — **0 template-related errors** (imports `./modules/templates/...` correctly).

---

## 11. OSCTL LR-1 Status

| Item | Status |
|------|--------|
| OSCTL governance kernel | **Frozen** (no changes made in this audit) |
| LR-1 (governance ledger application) | **BLOCKED** |
| Blocker relevant to this audit | Backend/runtime workspace **mixed**: untracked `src/templates/**`, untracked `src/notifications/**`, modified `app.module.ts`, `docker-compose.yml`, etc. |
| Template-specific LR-1 gate | **Do not commit** `src/templates/**` alongside tracked `modules/templates/**` without human schema review |

---

## 12. Strict-Mode Compliance Summary

| Rule | Complied |
|------|----------|
| Read-only audit | Yes |
| No file edits except this report | Yes |
| No deploy / Railway / Cloudflare | Yes |
| No backend source fixes | Yes |
| No git stage/commit/push/merge/stash | Yes |
| No docker-compose / package.json / OSCTL governance edits | Yes |
| No notifications implementation changes | Yes (inspected only) |
| Single deliverable: this file | Yes |

---

## Output Summary (required)

| Field | Value |
|-------|-------|
| **Template audit verdict** | **ABANDONED REWRITE DETECTED** |
| **Canonical template system** | `backend/src/modules/templates/**` |
| **Abandoned rewrite status** | `backend/src/templates/**` — untracked, unwired, import-broken, schema-mismatched |
| **Collision risk status** | **Runtime: LOW** (single wired entity) · **If merged: HIGH** · **Build: MEDIUM** (orphan tree typechecked) |
| **Safest human next step** | Isolate `src/templates` + notifications compile blockers; preserve `modules/templates`; do not delete or merge rewrite yet |
| **OSCTL LR-1 status** | **BLOCKED** (mixed workspace) |
| **Strict-mode compliance** | **PASS** |

---

*Human authority is final. VERIFY before ACT. MAP before CLEANUP. PRESERVE before DELETE.*
