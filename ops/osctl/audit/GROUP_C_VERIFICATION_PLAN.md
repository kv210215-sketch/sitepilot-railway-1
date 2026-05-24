# OSCTL Group C Verification Plan

**Date:** 2026-05-24  
**Agent:** OSCTL Workspace Anchoring Agent  
**Mode:** STRICT — verification choreography only  
**Repository:** `D:\Projects\SitePilot\sitepilot-railway`  
**Branch:** `osctl/governance-application`  
**Prerequisite:** Group A + Group B staged and verified (**102 paths** in index)  
**Authority of this document:** Human verification guidance only — does not authorize commits, LR-1, LR-2, or repository mutation.

**Group C scope (approved):**

- `ops/state/**` — **excluding** `ops/state/ledger/**` and `ops/state/projections/**` until post-LR-2
- `ops/rituals/**`
- `ops/simulations/**`
- Root context files (`AGENT_RULES.md`, `MASTER_CONTEXT.md`, `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md`)
- `ops/osctl/audit/**`
- `ops/README.md`

**Reference:** `SAFE_PATH_LEVEL_STAGING_PLAN.md` §4–§8, `GROUP_B_VERIFICATION_PLAN.md`, `HUMAN_SIGNOFF_PACKAGE.md` §4 (H1–H7).

---

# 1. Exact allowed Group C paths

**Total: 91 paths** (8 state templates/checklists + 8 rituals + 5 simulations + 4 root context + 65 audit + 1 ops README).

Execute as **sub-groups C1–C6** — separate index review per sub-group recommended.

## 1.1 C1 — `ops/state/**` allowed (8 files; ledger/projections excluded)

```text
ops/state/README.md
ops/state/GOVERNANCE.md
ops/state/CURRENT_STATUS.template.md
ops/state/DEPLOYMENT_STATE.template.md
ops/state/INCIDENT_LOG.template.md
ops/state/RELEASE_CHECKLIST.md
ops/state/ROLLBACK_CHECKLIST.md
ops/state/STATE_TRANSITIONS.md
```

## 1.2 C2 — `ops/rituals/**` (8 files)

```text
ops/rituals/DAILY_OPERATIONS.md
ops/rituals/DEPLOY_RITUAL.md
ops/rituals/HANDOFF_PROTOCOL.md
ops/rituals/INCIDENT_TRIAGE.md
ops/rituals/PRODUCTION_GO_NO_GO.md
ops/rituals/ROLLBACK_RITUAL.md
ops/rituals/STAGING_VALIDATION.md
ops/rituals/WEEKLY_RECONCILIATION.md
```

## 1.3 C3 — `ops/simulations/**` (5 files)

```text
ops/simulations/FAILED_PRODUCTION_DEPLOY.md
ops/simulations/HANDOFF_SIMULATION.md
ops/simulations/ROLLBACK_SIMULATION.md
ops/simulations/STAGING_DEPLOY_SIMULATION.md
ops/simulations/UNRECORDED_DEPLOY_DRIFT.md
```

## 1.4 C4 — Root context (4 files; H3 banners applied)

```text
AGENT_RULES.md
MASTER_CONTEXT.md
CURRENT_STATUS.md
DEPLOYMENT_STATE.md
```

## 1.5 C5 — Ops navigation (1 file)

```text
ops/README.md
```

**Pre-stage requirement:** Human must update stale content (currently claims `ledger/` “not created yet”) to reflect H7 dual-plane model before staging.

## 1.6 C6 — `ops/osctl/audit/**` (65 files)

Audit layer staged **last** so observations describe Groups A–B–C prep state. Includes this plan and all prior audit reports (backend isolation, governance resolution, Group A/B plans, signoff package, etc.).

**Approved path-level staging commands (human only — not executed by this plan):**

```powershell
# C1 — state templates/checklists (no ledger, no projections)
git add -- ops/state/README.md
git add -- ops/state/GOVERNANCE.md
git add -- ops/state/CURRENT_STATUS.template.md
git add -- ops/state/DEPLOYMENT_STATE.template.md
git add -- ops/state/INCIDENT_LOG.template.md
git add -- ops/state/RELEASE_CHECKLIST.md
git add -- ops/state/ROLLBACK_CHECKLIST.md
git add -- ops/state/STATE_TRANSITIONS.md

# C2 — rituals
git add -- ops/rituals/DAILY_OPERATIONS.md
git add -- ops/rituals/DEPLOY_RITUAL.md
git add -- ops/rituals/HANDOFF_PROTOCOL.md
git add -- ops/rituals/INCIDENT_TRIAGE.md
git add -- ops/rituals/PRODUCTION_GO_NO_GO.md
git add -- ops/rituals/ROLLBACK_RITUAL.md
git add -- ops/rituals/STAGING_VALIDATION.md
git add -- ops/rituals/WEEKLY_RECONCILIATION.md

# C3 — simulations
git add -- ops/simulations/FAILED_PRODUCTION_DEPLOY.md
git add -- ops/simulations/HANDOFF_SIMULATION.md
git add -- ops/simulations/ROLLBACK_SIMULATION.md
git add -- ops/simulations/STAGING_DEPLOY_SIMULATION.md
git add -- ops/simulations/UNRECORDED_DEPLOY_DRIFT.md

# C4 — root context
git add -- AGENT_RULES.md
git add -- MASTER_CONTEXT.md
git add -- CURRENT_STATUS.md
git add -- DEPLOYMENT_STATE.md

# C5 — ops navigation (after human README fix)
git add -- ops/README.md

# C6 — audit layer (last)
git add -- ops/osctl/audit
```

**Combined index expectation after Group A + B + C:** **193 staged paths** (102 + 91).

**Post-LR-2 gate only (NOT Group C):**

```text
ops/state/ledger/events.jsonl
ops/state/projections/CURRENT_STATUS.md
ops/state/projections/DEPLOYMENT_STATE.md
```

---

# 2. Exact forbidden Group C paths

## 2.1 Mass-staging patterns (forbidden commands)

```text
git add .
git add ops/
git add -A
git add -- ops/state
```

(`git add -- ops/state` would include excluded `ledger/` and `projections/`.)

## 2.2 Excluded operational truth (post-LR-2 gate only)

```text
ops/state/ledger/events.jsonl
ops/state/ledger/**
ops/state/projections/CURRENT_STATUS.md
ops/state/projections/DEPLOYMENT_STATE.md
ops/state/projections/**
```

## 2.3 Kernel duplicate surfaces (forbidden in Group C)

```text
ops/osctl/ledger/**
ops/osctl/projections/**
ops/osctl/examples/**/projections/**
```

## 2.4 Runtime / product (forbidden always)

```text
backend/**
docker-compose.yml
.github/**
.env
**/.claude/settings*.json
**/__pycache__/**
**/*.pyc
**/*.pyo
```

## 2.5 Already staged — do not re-stage blindly

Groups A and B paths remain in index. Group C adds **only** the 91 paths in §1. Forbidden: unstaging or restaging Groups A/B without human intent.

---

# 3. Operational-plane risks

| Risk | Path / condition | Mitigation |
|------|------------------|------------|
| **Dual governance claims** | `ops/state/GOVERNANCE.md` vs staged `ops/osctl/GOVERNANCE.md` | Stage C1 `GOVERNANCE.md` in **separate commit** from Group A kernel governance |
| **False operational authority** | Root `CURRENT_STATUS.md` / `DEPLOYMENT_STATE.md` without banners | H3 banners applied — verify banners present before C4 stage |
| **Ledger staged prematurely** | `ops/state/ledger/events.jsonl` | **Excluded from Group C** — post-LR-2 only; paths.py still defaults to `ops/osctl/ledger/` |
| **Projection drift encoded in git** | `ops/state/projections/*.md` hash ≠ kernel output | **Excluded from Group C** — stage only after LR-2 + verify exit 0 |
| **Stale ops navigation** | `ops/README.md` claims ledger “not created yet” | Human edit required before C5 stage |
| **Template vs truth confusion** | `ops/state/*.template.md` | Templates are human-operated; not ledger-derived truth |
| **Adjacent playbook overreach** | `ops/rituals/**`, `ops/simulations/**` | Operator guidance only — no trust-layer authority |

---

# 4. Root-context risks

| File | Risk | Verification before C4 stage |
|------|------|------------------------------|
| `AGENT_RULES.md` | Agents skip verify-first discipline | Confirm pointer to `ops/state/projections/` + `python -m ops.osctl.core verify` |
| `MASTER_CONTEXT.md` | Restates OSCTL trust claims | Confirm backend-only context; cites kernel docs by reference |
| `CURRENT_STATUS.md` | Competes with ledger-derived status | Confirm NON-CANONICAL / LEGACY banner + pointer to `ops/state/projections/CURRENT_STATUS.md` |
| `DEPLOYMENT_STATE.md` | Env catalog mistaken for ledger truth | Confirm banner + pointer to `ops/state/projections/DEPLOYMENT_STATE.md` |

**Forbidden:** Staging root context in the same commit as `ops/state/projections/**` or `ops/state/ledger/**`.

**Forbidden:** Staging root context before Groups A and B are in index (agents need kernel paths to exist in git for pointer validity).

---

# 5. Audit-layer staging rules

| Rule | Requirement |
|------|-------------|
| **C6 is last** | Audit files describe final anchoring prep — stage after C1–C5 |
| **Observations only** | Audit MDs never override canonical 15-file kernel |
| **No authority escalation** | Staging audit does not grant LR-1/LR-2 approval |
| **Backend isolation reports** | `BACKEND_*`, `TEMPLATE_SYSTEM_AUDIT.md` — evidence only; not OSCTL kernel |
| **Planning artifacts** | This plan, `GROUP_B_VERIFICATION_PLAN.md`, `SAFE_PATH_LEVEL_STAGING_PLAN.md` — choreography records |
| **Signoff package** | `HUMAN_SIGNOFF_PACKAGE.md` — LR-1 gate still **not granted** after audit stage |
| **Path command** | Use `git add -- ops/osctl/audit` only — never `git add ops/` |
| **Mixed commit** | Do not combine C6 with `backend/**`, runtime, or ledger/projection paths |

---

# 6. Exact verification commands

Run from repository root **after** human completes Group C staging. Read-only — no commits or file edits.

## 6.1 Pre-verification workspace check

```powershell
cd D:\Projects\SitePilot\sitepilot-railway
git branch --show-current
git diff --name-only
```

**Pass:** branch is `osctl/governance-application`; no unintended tracked working-tree modifications.

## 6.2 Excluded operational-truth scan

```powershell
git diff --cached --name-only | Select-String -Pattern "ops/state/ledger/|ops/state/projections/"
```

**Pass:** no output.

## 6.3 Kernel duplicate scan

```powershell
git diff --cached --name-only | Select-String -Pattern "ops/osctl/ledger/|ops/osctl/projections/|examples/.+/projections/"
```

**Pass:** no output.

## 6.4 Group C forbidden overlap scan

```powershell
git diff --cached --name-only | Select-String -Pattern "backend/|docker-compose|__pycache__|\.pyc$|\.pyo$"
```

**Pass:** no output.

## 6.5 Group C allowlist count

```powershell
$stateAllowed = @(
  'ops/state/README.md',
  'ops/state/GOVERNANCE.md',
  'ops/state/CURRENT_STATUS.template.md',
  'ops/state/DEPLOYMENT_STATE.template.md',
  'ops/state/INCIDENT_LOG.template.md',
  'ops/state/RELEASE_CHECKLIST.md',
  'ops/state/ROLLBACK_CHECKLIST.md',
  'ops/state/STATE_TRANSITIONS.md'
)
$rituals = git diff --cached --name-only | Where-Object { $_.StartsWith('ops/rituals/') }
$simulations = git diff --cached --name-only | Where-Object { $_.StartsWith('ops/simulations/') }
$root = @('AGENT_RULES.md','MASTER_CONTEXT.md','CURRENT_STATUS.md','DEPLOYMENT_STATE.md')
$audit = git diff --cached --name-only | Where-Object { $_.StartsWith('ops/osctl/audit/') }
$staged = git diff --cached --name-only
$groupC = $staged | Where-Object {
  $p = $_
  ($p -in $stateAllowed) -or
  ($p.StartsWith('ops/rituals/')) -or
  ($p.StartsWith('ops/simulations/')) -or
  ($p -in $root) -or
  ($p -eq 'ops/README.md') -or
  ($p.StartsWith('ops/osctl/audit/'))
}
$groupC.Count
$rituals.Count
$simulations.Count
$audit.Count
```

**Pass:** `$groupC.Count` is **91**; rituals **8**; simulations **5**; audit **65**.

## 6.6 Full index count (A + B + C)

```powershell
(git diff --cached --name-only).Count
```

**Pass:** **193** total staged paths.

---

# 7. Exact index inspection commands

```powershell
git diff --cached --name-status
git diff --cached --stat
git diff --cached --name-only
git ls-files --stage -- ops/state
git ls-files --stage -- ops/rituals
git ls-files --stage -- ops/simulations
git ls-files --stage -- ops/osctl/audit
git ls-files --stage -- AGENT_RULES.md MASTER_CONTEXT.md CURRENT_STATUS.md DEPLOYMENT_STATE.md
git ls-files --stage -- ops/README.md
```

**Expected inspection results:**

| Check | Expected |
|-------|----------|
| `ops/state` staged (allowed subset) | **8** |
| `ops/state/ledger/` in index | **0** |
| `ops/state/projections/` in index | **0** |
| `ops/rituals` staged | **8** |
| `ops/simulations` staged | **5** |
| Root context staged | **4** |
| `ops/README.md` staged | **1** (after human fix) |
| `ops/osctl/audit` staged | **65** |
| Total index | **193** |

**Boundary-safe ledger/projection check (avoids `LEDGER_MODEL.md` false positive):**

```powershell
git diff --cached --name-only | Select-String -Pattern "ops/state/ledger/|ops/state/projections/|ops/osctl/ledger/|ops/osctl/projections/|/projections/"
```

**Pass:** no output.

---

# 8. Exact rollback commands

## 8.1 Unstage excluded operational-truth paths only

```powershell
git restore --staged -- ops/state/ledger/
git restore --staged -- ops/state/projections/
git restore --staged -- ops/osctl/ledger/
git restore --staged -- ops/osctl/projections/
```

## 8.2 Unstage entire Group C (preserve Groups A + B)

```powershell
git restore --staged -- ops/state/README.md
git restore --staged -- ops/state/GOVERNANCE.md
git restore --staged -- ops/state/CURRENT_STATUS.template.md
git restore --staged -- ops/state/DEPLOYMENT_STATE.template.md
git restore --staged -- ops/state/INCIDENT_LOG.template.md
git restore --staged -- ops/state/RELEASE_CHECKLIST.md
git restore --staged -- ops/state/ROLLBACK_CHECKLIST.md
git restore --staged -- ops/state/STATE_TRANSITIONS.md
git restore --staged -- ops/rituals
git restore --staged -- ops/simulations
git restore --staged -- AGENT_RULES.md
git restore --staged -- MASTER_CONTEXT.md
git restore --staged -- CURRENT_STATUS.md
git restore --staged -- DEPLOYMENT_STATE.md
git restore --staged -- ops/README.md
git restore --staged -- ops/osctl/audit
```

## 8.3 Unstage Group C sub-group only (examples)

```powershell
# C6 audit only
git restore --staged -- ops/osctl/audit

# C4 root context only
git restore --staged -- AGENT_RULES.md MASTER_CONTEXT.md CURRENT_STATUS.md DEPLOYMENT_STATE.md
```

## 8.4 Confirm rollback

```powershell
(git diff --cached --name-only).Count
git diff --cached --name-only | Select-String -Pattern "ops/state/|ops/rituals/|ops/simulations/|ops/osctl/audit/|^AGENT_RULES|^MASTER_CONTEXT|^CURRENT_STATUS|^DEPLOYMENT_STATE|^ops/README"
```

**Pass after full Group C rollback:** count returns **102**; second command returns no output.

---

# 9. Replay-boundary protection rules

| ID | Rule | Group C enforcement |
|----|------|---------------------|
| **RB-1** | No live ledger in index during Group C | `ops/state/ledger/**` excluded — post-LR-2 gate |
| **RB-2** | No live projections in index during Group C | `ops/state/projections/**` excluded — post-LR-2 gate |
| **RB-3** | No kernel duplicate ledger/projections | `ops/osctl/ledger/**`, `ops/osctl/projections/**` remain unstaged |
| **RB-4** | Root context is not replay input | Bannered MDs are pointers — verify-first against future projections |
| **RB-5** | Rituals/simulations are not replay fixtures | Adjacent ops — zero effect on `events.jsonl` |
| **RB-6** | Audit staging is non-mutating | Observations only — no ledger line edits |
| **RB-7** | Staging ≠ LR-2 | `paths.py` / `render.py` unchanged by Group C |
| **RB-8** | Index inspection uses path boundaries | Use §7 boundary-safe pattern — not bare `ledger` substring |

**Replay safety verdict for Group C (without ledger/projections):** **SAFE** — Group C adds no ledger bytes, no projection surfaces, and no replay engine changes to the index.

---

# 10. Post-Group-C readiness gates

Group C completion **does not** authorize commit, LR-1, or LR-2. Gates remaining:

| Gate | Status after Group C | Owner |
|------|----------------------|-------|
| Groups A + B + C index complete (193 paths) | Pending human Group C execution | Human |
| `ops/README.md` stale content corrected | Pending human edit before C5 | Human |
| **LR-2** — align `paths.py`, `render.py`, CLI to H1/H2 | **Not authorized** | Human |
| Regenerate + verify exit 0 | **Not run** | Human |
| Stage `ops/state/ledger/events.jsonl` | **Post-LR-2 gate** | Human |
| Stage `ops/state/projections/*.md` (verified) | **Post-LR-2 gate** | Human |
| Explicit **LR-1 approval** (`HUMAN_SIGNOFF_PACKAGE.md` §4) | **Not granted** | Human |
| **LR-1 execution** (Round 3 §6 actions 1–8) | **Blocked** | Human |
| **H5 archive** moves | After LR-1–LR-4 | Human |
| Trust commit(s) | After all gates pass | Human |

**Recommended post-Group-C human sequence (not executed by agents):**

```text
1. Verify Group C index (§6–§7)
2. Optional: split commits by C1–C6 sub-groups
3. LR-2 approval + path alignment
4. python -m ops.osctl.core replay
5. python -m ops.osctl.core verify
6. python ops/osctl/validation/run_validation.py
7. Stage post-LR-2 ledger + verified projections
8. Record LR-1 approval
9. Execute LR-1 (docs-only entrypoint commit)
```

---

## Strict-mode compliance

| Constraint | Complied |
|------------|----------|
| Verification choreography only | ✓ |
| No staging / commits / repository mutation | ✓ |
| No LR-1 / LR-2 / replay / ledger / projection edits | ✓ |
| No `git add .` / `git add ops/` / `git add -A` | ✓ |
| Ledger + projections excluded per approved scope | ✓ |

---

**Group C verification plan complete.** Human operator owns README fix, staging, verification, rollback, and all downstream gates.
