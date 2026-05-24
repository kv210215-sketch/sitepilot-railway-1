# Backend Workspace Isolation Plan

**Date:** 2026-05-24  
**Agent:** Backend Workspace Isolation Planning Agent  
**Mode:** READ-ONLY PLANNING ONLY  
**Repository:** `D:\Projects\SitePilot\sitepilot-railway`  
**Current branch:** `fix/app-module-template-compile` (HEAD: `ca6f1e5 fix docker compose and production config`)  
**Authority:** Advisory only. Human operator has final authority over all isolation actions.

---

## 1. Executive Verdict

### **READY WITH HUMAN DECISIONS**

The workspace is **fully mappable** and **isolatable**. Every dirty path belongs to a known logical group with a defined branch target. No additional discovery is required before a human begins separation.

Human decisions still required for:

- Branch vs stash per group (branches recommended for notifications and templates rewrite).
- Whether root context files (`AGENT_RULES.md`, etc.) anchor with OSCTL or remain local drafts.
- Whether `fix/app-module-template-compile` is kept, merged, or abandoned after compile baseline is restored.
- Explicit approval before any discard or destructive restore.

**OSCTL LR-1 status:** **BLOCKED** (unchanged).

---

## 2. Current Mixed Workspace Map

### 2.1 Summary table

| Classification | Paths | Git state | Load-bearing? | Isolation target |
|---|---|---|---|---|
| **OSCTL governance** | `ops/**` (~191 files: `ops/osctl/**`, `ops/state/**`, `ops/rituals/**`, `ops/simulations/**`) | Untracked | Yes — frozen kernel | `osctl/governance-application` |
| **Backend runtime (tracked, dirty)** | `backend/src/app.module.ts` | Modified | Yes — wires incomplete notifications | `fix/backend-compile-clean` or `feature/notifications` |
| **Docker-compose (tracked, dirty)** | `docker-compose.yml` | Modified | Runtime infra only | `chore/dev-compose-refactor` |
| **Notifications feature** | `backend/src/notifications/**` (9 files) | Untracked | No — incomplete, unwired deps | `feature/notifications` |
| **Abandoned templates rewrite** | `backend/src/templates/**` (5 files) | Untracked | No — not wired, schema collision | `experiment/templates-v2-rewrite` |
| **Root context files** | `AGENT_RULES.md`, `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md`, `MASTER_CONTEXT.md` | Untracked | Draft / agent context | Human classify → OSCTL or local-only |
| **Canonical templates (clean)** | `backend/src/modules/templates/**` | Tracked, clean | **Yes** — wired, migrations-aligned | Stay on `main` baseline |

### 2.2 OSCTL files (must not mix with backend/runtime commits)

```
ops/README.md
ops/__init__.py
ops/osctl/**          # core, validation, snapshots, ledger, examples, audit
ops/state/**
ops/rituals/**
ops/simulations/**
```

No `__pycache__` entries visible in current `git status`. Re-check before any OSCTL staging per `PYCACHE_AND_ARTIFACT_POLICY.md`.

### 2.3 Backend runtime files (must exit workspace before LR-1)

**Modified tracked:**

| File | Change summary |
|---|---|
| `backend/src/app.module.ts` | Adds `NotificationsModule`, `Notification` entity import, entity registration, module import. **Does not** touch canonical `TemplatesModule` (`./modules/templates/`). Template import **already present** at line 39 — prior Group D compile-break report was a **false positive**. |
| `docker-compose.yml` | Near-total dev-infra rewrite: removes `backend`/`frontend` services; renames `db`→`postgres`; PG15→PG16; credential rotation; adds Redis healthcheck, Adminer, MailHog. |

**Untracked runtime trees:**

| Path | Files | Problem |
|---|---|---|
| `backend/src/notifications/` | module, service, processor, entity, dto, 4× `.hbs` | Imports `@nestjs/bull`, `@nestjs-modules/mailer`, `bull`, handlebars — **none present in `backend/package.json`** |
| `backend/src/templates/` | module, service, controller, entity, dto | Broken relative imports (`../auth/...`, `../organizations/...`); duplicate `@Entity('templates')`; schema incompatible with tracked module and migrations |

### 2.4 Canonical template system (do not isolate — this is the baseline)

| Property | Value |
|---|---|
| Path | `backend/src/modules/templates/**` |
| Git | Tracked, unmodified |
| Wired in | `app.module.ts` line 26 (`TemplatesModule`), line 39 (`Template` entity), line 83 (`entities[]`) |
| Consumer | `backend/src/modules/pages/pages.service.ts` imports `TemplatesService` from `../templates/templates.service` |
| Migrations | snake_case columns (`project_id`, `structure`, `is_active`, etc.) |

### 2.5 Abandoned templates rewrite (must isolate out)

| Property | Value |
|---|---|
| Path | `backend/src/templates/**` |
| Git | Untracked |
| Wired in | **Not** referenced in `app.module.ts` |
| Entity | `@Entity('templates')` — **collides** with canonical entity |
| Schema | camelCase, `organizationId`, `blocksSnapshot`, typed enum category — **does not match migrations** |
| Compile | 5× TS2307 unresolved import errors in `templates.controller.ts` |

### 2.6 Notifications feature (must isolate out)

| Property | Value |
|---|---|
| Path | `backend/src/notifications/**` |
| Git | Untracked |
| Wired in | `app.module.ts` dirty diff registers module + entity |
| Missing deps | `@nestjs/bull`, `@nestjs-modules/mailer`, `bull`, `handlebars` (confirmed absent from `package.json`) |
| Compile | 8× TS2307 missing module declaration errors |
| Compose coupling | MailHog block in `docker-compose.yml` diff supports local SMTP for this feature |

### 2.7 Docker-compose changes (must never enter OSCTL commits)

| Change | Group | Risk |
|---|---|---|
| Remove `backend` / `frontend` services | Infra refactor | High — dev topology change |
| `db` → `postgres`, PG15 → PG16 | Infra refactor | High — major version bump |
| Credential rotation | Infra refactor | High — breaks existing local DB volumes |
| Redis healthcheck, Adminer | Dev tooling | Low |
| MailHog | Notifications-adjacent | Medium — logically coupled to Group A |

**Hard rule:** `docker-compose.yml` is runtime infrastructure. It must **never** appear in an OSCTL commit, ledger event, or LR-1 step.

### 2.8 Root context files

| File | Likely role |
|---|---|
| `AGENT_RULES.md` | Agent operating constraints |
| `CURRENT_STATUS.md` | Operational status draft (may duplicate `ops/state/projections/`) |
| `DEPLOYMENT_STATE.md` | Deployment state draft |
| `MASTER_CONTEXT.md` | Governance context draft |

Human must decide: anchor with OSCTL (`osctl/governance-application`) or exclude from all commits.

---

## 3. Isolation Strategy

Safest human separation order. **Do not reorder** without explicit rationale.

### Step 1 — Protect current state

Before any move, stash, branch switch, or restore:

1. Run full status review (commands in §6).
2. Record current branch name: `fix/app-module-template-compile`.
3. Confirm no staged files (`git diff --cached` should be empty).
4. Do **not** delete, discard, or force-clean anything.

### Step 2 — Isolate compile blockers

Goal: restore a compilable tracked baseline on a dedicated branch.

**Known state (2026-05-24):**

- `Template` import in `app.module.ts` is **already present** — no repair needed.
- Compile still fails (13 errors) because:
  - Untracked `backend/src/notifications/**` is compiled by `tsc` regardless of wiring.
  - Untracked `backend/src/templates/**` is compiled by `tsc` regardless of wiring.
  - `app.module.ts` wires `NotificationsModule` against missing npm packages.

**Human action:**

1. Move untracked compile-blocker trees off the working tree first (Step 3–4 below, or stash-with-untracked).
2. Revert `backend/src/app.module.ts` to `HEAD` (removes notifications wiring; preserves canonical Template wiring already in HEAD).
3. Verify `npx tsc --noEmit` exits 0 from `backend/`.

### Step 3 — Isolate notifications

Target branch: `feature/notifications`

Carry:

- `backend/src/notifications/**` (all 9 untracked files)
- Notifications-related hunks from `backend/src/app.module.ts`
- MailHog service block from `docker-compose.yml` (optional split)
- Future: `package.json` dependency additions (human, separate commit — **not in this plan**)

Do **not** merge until deps installed and compile passes on that branch alone.

### Step 4 — Isolate templates rewrite

Target branch: `experiment/templates-v2-rewrite`

Carry:

- `backend/src/templates/**` (all 5 untracked files)

Do **not** wire into `app.module.ts`. Do **not** commit `@Entity('templates')` while canonical module is active. If revived, rename entity table or gate behind migration.

### Step 5 — Isolate docker-compose changes

Target branch: `chore/dev-compose-refactor`

Carry:

- Full `docker-compose.yml` diff

Consider splitting into:

- **Safe subset:** Redis healthcheck, Adminer
- **Risky subset:** PG16 bump, credential change, service removals, MailHog

Never combine with OSCTL or notifications feature in one commit.

### Step 6 — Verify clean backend compile

After Steps 2–5 remove runtime dirty state from the isolation baseline branch:

```powershell
Set-Location backend
npx tsc --noEmit
```

**Pass criteria:** exit code 0; zero errors from `src/notifications/**` or `src/templates/**`.

### Step 7 — Verify OSCTL-only surface

On the branch intended for LR-1 (`osctl/governance-application`), working tree should show:

- Only `ops/**` untracked/modified paths (plus human-approved root context files)
- **Zero** modified `backend/**` paths
- **Zero** modified `docker-compose.yml`
- **Zero** untracked `backend/src/notifications/**` or `backend/src/templates/**`

Verification:

```powershell
git status -s
git diff --name-only
git ls-files --others --exclude-standard
```

### Step 8 — Reconsider LR-1

Only after §7 OSCTL LR-1 Readiness Rules (§7 below) are all satisfied **and** human explicitly approves.

---

## 4. Human Branch Strategy

Recommended branch set. Create from a clean `main` (or current HEAD after runtime isolation).

| Branch | Purpose | Carries |
|---|---|---|
| `fix/backend-compile-clean` | Restore compilable tracked baseline | Reverted `app.module.ts`; no untracked runtime trees |
| `feature/notifications` | Notifications feature WIP | `backend/src/notifications/**`, app.module wiring, deps, MailHog compose block |
| `experiment/templates-v2-rewrite` | Parallel templates experiment | `backend/src/templates/**` only |
| `chore/dev-compose-refactor` | Local dev infra changes | `docker-compose.yml` diff (split safe/risky) |
| `osctl/governance-application` | OSCTL LR-1 and governance anchoring | `ops/**`, approved root context files only |

**Current branch note:** Operator is already on `fix/app-module-template-compile`. Options:

- **Rename** to `fix/backend-compile-clean` once baseline verified, or
- **Abandon** after work is captured on target branches, or
- **Keep** as the compile-fix branch if that name still matches intent.

No agent authority to rename, merge, or delete branches.

---

## 5. Decision Matrix

For each dirty group — human chooses one primary action.

| Group | Keep on current branch | Move to branch | Stash | Discard (explicit approval only) | Investigate further |
|---|---|---|---|---|---|
| **Notifications** (`backend/src/notifications/**` + app.module wiring) | ✗ — blocks compile-clean | ✓ **Recommended** → `feature/notifications` | ○ Acceptable short-term (`git stash push -u`) | ✗ — would lose WIP | ✗ — fully mapped |
| **Templates rewrite** (`backend/src/templates/**`) | ✗ — blocks compile-clean | ✓ **Recommended** → `experiment/templates-v2-rewrite` | ○ Acceptable short-term | ✗ — would lose experiment | ✗ — fully mapped |
| **Docker-compose** | ✗ — blocks OSCTL surface | ✓ **Recommended** → `chore/dev-compose-refactor` | ○ Acceptable for quick OSCTL prep | ✗ — unless human confirms diff unwanted | ○ Split safe vs risky hunks first |
| **app.module.ts** (notifications wiring only) | ✗ on compile-clean branch | ✓ Split: revert on compile-clean; carry wiring to `feature/notifications` | ○ With notifications group | ✗ | ✗ |
| **OSCTL governance** (`ops/**`) | ✗ — must not mix with runtime | ✓ **Recommended** → `osctl/governance-application` | ✗ — large surface, stash risk | ✗ | ○ Review ledger for sensitive refs before track |
| **Root context files** | ○ If local-only drafts | ○ If anchoring with OSCTL | ○ Temporary | ○ Only if confirmed duplicate/stray | ✓ **Human classify first** |

**Legend:** ✓ recommended · ○ viable alternative · ✗ not recommended

---

## 6. Safe Command Suggestions

> **Suggestions only. Do not execute from this document unless you are the human operator.**

### 6.1 Git status review

```powershell
Set-Location D:\Projects\SitePilot\sitepilot-railway
git status -s
git branch --show-current
git diff --stat
git diff backend/src/app.module.ts
git diff docker-compose.yml
git ls-files --others --exclude-standard backend/
git ls-files --others --exclude-standard ops/
git diff --cached
```

### 6.2 Branch creation (from clean baseline)

```powershell
# After runtime trees are off working tree and app.module reverted:
git switch -c fix/backend-compile-clean

git switch main   # or appropriate base
git switch -c feature/notifications

git switch main
git switch -c experiment/templates-v2-rewrite

git switch main
git switch -c chore/dev-compose-refactor

git switch main
git switch -c osctl/governance-application
```

### 6.3 Stash suggestions (alternative to branch — less safe for large features)

```powershell
git stash push -u -m "WIP: templates-v2-rewrite" -- backend/src/templates
git stash push -u -m "WIP: notifications-feature" -- backend/src/notifications
git stash push -m "WIP: compose-dev-refactor" -- docker-compose.yml
git stash push -m "WIP: app.module notifications wiring" -- backend/src/app.module.ts
```

List and restore:

```powershell
git stash list
git stash show -p stash@{0}   # inspect before pop
git stash pop stash@{0}       # human only, after review
```

### 6.4 Restore suggestions (explicit human approval required)

```powershell
# Revert tracked files to last commit — DESTRUCTIVE to uncommitted work
git restore backend/src/app.module.ts
git restore docker-compose.yml

# Restore single file from HEAD without touching untracked trees
git show HEAD:backend/src/app.module.ts
```

**Warning:** `git restore` on `app.module.ts` removes notifications wiring but does **not** remove untracked `notifications/` or `templates/` directories. Compile will still fail until those trees are stashed or branched off.

### 6.5 Compile verification

```powershell
Set-Location D:\Projects\SitePilot\sitepilot-railway\backend
npx tsc --noEmit
npm ls @nestjs/bull @nestjs-modules/mailer bull handlebars 2>&1
```

Expected on isolated compile-clean baseline: exit code 0.

Expected on current mixed workspace: exit code 2, 13 errors (8 notifications + 5 templates rewrite).

### 6.6 OSCTL isolation verification

```powershell
Set-Location D:\Projects\SitePilot\sitepilot-railway
git diff --name-only | Select-String -NotMatch "^ops/"
git ls-files --others --exclude-standard | Select-String -NotMatch "^ops/" | Select-String -NotMatch "^(AGENT_RULES|CURRENT_STATUS|DEPLOYMENT_STATE|MASTER_CONTEXT)"
python ops/osctl/validation/run_validation.py
Get-ChildItem -Recurse ops -Filter "__pycache__" -Directory
```

Pass criteria: no backend or compose paths in diff; validation script exits 0; no pycache directories under `ops/`.

---

## 7. OSCTL LR-1 Readiness Rules

LR-1 becomes **allowed for human consideration** only when **all** conditions are true:

| # | Condition | Current state |
|---|---|---|
| 1 | No modified tracked `backend/**` files | ✗ FAIL — `app.module.ts` dirty |
| 2 | No modified `docker-compose.yml` | ✗ FAIL — dirty |
| 3 | No untracked runtime trees under `backend/src/` (notifications, templates rewrite) | ✗ FAIL — both present |
| 4 | Working tree shows OSCTL-only changes (or fully clean) | ✗ FAIL — mixed |
| 5 | `python ops/osctl/validation/run_validation.py` passes | ○ Not verified this session — human must run |
| 6 | No `__pycache__` under `ops/` | ✓ PASS — none in status |
| 7 | Explicit human approval to begin LR-1 | ✗ Not granted |

**LR-1 status:** **BLOCKED** — conditions 1–4 fail; condition 7 not met.

---

## 8. What Not To Do

Explicit warnings for the human operator:

1. **Do not delete `backend/src/templates/` yet.** Preserve the experiment on `experiment/templates-v2-rewrite` until human schema review completes.
2. **Do not merge notifications work** until `@nestjs/bull`, `@nestjs-modules/mailer`, `bull`, and `handlebars` are installed and compile passes on `feature/notifications` alone.
3. **Do not commit `docker-compose.yml` alongside OSCTL files.** Runtime infra and governance authority must remain disjoint.
4. **Do not start LR-1 while backend dirty state remains.** Mixed workspace invalidates OSCTL trust boundary.
5. **Do not run Cloud/Deploy/Railway/Cloudflare actions** during isolation planning or OSCTL anchoring.
6. **Do not create new governance phases or expand the frozen OSCTL kernel.** LR-1 through LR-12 remain the execution set.
7. **Do not commit the abandoned templates rewrite** with `@Entity('templates')` while `backend/src/modules/templates/` is the active runtime module.
8. **Do not assume the Template import is missing** — verified present; reverting it would be a regression.
9. **Do not use `git clean -fd`** without explicit approval — would destroy untracked notifications and templates WIP.
10. **Do not stage backend and `ops/` in one commit** — violates trust boundary per `BOUNDARIES.md` and `BACKEND_RUNTIME_ISOLATION_REVIEW.md`.

---

## 9. Final Safest Human Next Step

**Single safest next action:**

> **Stash or branch off the two untracked compile-blocker trees (`backend/src/notifications/` and `backend/src/templates/`), then restore `backend/src/app.module.ts` to `HEAD`, then run `npx tsc --noEmit` from `backend/` to confirm exit code 0.**

Rationale:

- Template import repair is already done (false positive closed).
- Untracked `.ts` files under `src/` are included in `tsc` even when not imported — they must leave the working tree before compile can pass.
- Reverting `app.module.ts` removes notifications wiring against missing packages.
- This is the smallest reversible sequence that establishes a known-good compile baseline without deleting any WIP.
- Do **not** commit yet. Do **not** start LR-1. Do **not** touch OSCTL until backend surface is clean.

Suggested command sequence (human executes after review):

```powershell
Set-Location D:\Projects\SitePilot\sitepilot-railway
git stash push -u -m "isolate: templates-v2-rewrite" -- backend/src/templates
git stash push -u -m "isolate: notifications-feature" -- backend/src/notifications
git restore backend/src/app.module.ts
Set-Location backend
npx tsc --noEmit
```

If exit code 0: proceed to isolate `docker-compose.yml`, then prepare `osctl/governance-application`.

---

## 10. Output Summary

| Field | Value |
|---|---|
| **Workspace isolation verdict** | **READY WITH HUMAN DECISIONS** |
| **Safest human next step** | Stash/branch untracked `notifications/` + `templates/` → restore `app.module.ts` → verify `tsc --noEmit` |
| **OSCTL LR-1 status** | **BLOCKED** |
| **Remaining blockers** | (1) Untracked notifications tree + missing npm deps + app.module wiring · (2) Untracked templates rewrite + entity collision · (3) Dirty docker-compose.yml · (4) Mixed OSCTL + runtime in one workspace · (5) Root context files unclassified · (6) LR-1 validation not re-run this session |
| **False positive closed** | `Template` import in `app.module.ts` — not a compile blocker |
| **Canonical templates** | `backend/src/modules/templates/**` — tracked, wired, load-bearing |
| **Strict-mode compliance** | READ-ONLY — only this report created; no edits, commits, staging, deploy, or runtime mutations performed |

---

## Related Documents

- `ops/osctl/audit/BACKEND_RUNTIME_ISOLATION_REVIEW.md` — four-group triage (Group D superseded by compile repair report)
- `ops/osctl/audit/BACKEND_COMPILE_REPAIR_REPORT.md` — Template import false positive closure
- `ops/osctl/audit/BACKEND_CLEANUP_DECISION_PLAN.md` — branch targets and compose attribution
- `ops/osctl/audit/APPLICATION_STEP_B_WORKSPACE_ISOLATION.md` — Step B NO-GO verdict
- `ops/osctl/audit/WORKSPACE_ISOLATION_PLAN.md` — OSCTL-layer isolation (complementary)

---

*Human authority final. OSCTL governance kernel remains frozen. VERIFY before ACT. MAP before CLEANUP. PRESERVE before DELETE.*
