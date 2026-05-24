# OSCTL Safe Path-Level Staging Plan

**Date:** 2026-05-24  
**Agent:** OSCTL Workspace Anchoring Agent  
**Mode:** STRICT — staging choreography only  
**Repository:** `D:\Projects\SitePilot\sitepilot-railway`  
**Branch:** `osctl/governance-application`  
**Authority of this document:** Human staging guidance only — **non-authoritative**. Does not authorize commits, LR-1, LR-2, or any repository mutation.

**Evidence basis:** `git status --short`, tree inspection of `ops/**` (~200 files), root context files (H3 banners applied), `CANONICAL_GOVERNANCE_MAP.md`, `WORKSPACE_ANCHORING_PLAN.md`, `HUMAN_SIGNOFF_PACKAGE.md` §4 (H1–H7 approved), `paths.py` / `render.py` defaults, ledger/projection path inventory.

**Workspace precondition (confirmed):** Pre-flight complete; `osctl/governance-application` branch active; `ops/__pycache__/` absent; no tracked modifications; no staged changes.

**Governance topology (frozen — not rediscovered here):**

| Plane | Role |
|-------|------|
| `ops/osctl/` | Governance kernel, frozen spec, deterministic code, validation fixtures |
| `ops/state/` | Operational truth plane — **H1 ledger**, **H2 projections** |

---

# 1. Exact staging order

Execute **one group at a time**. After each group, run the pre-commit check in §10 before any commit decision (commits are out of scope for this plan).

| Order | Group | Domain | Commit when ready |
|-------|-------|--------|-------------------|
| **1** | **Group A** | Package markers + frozen governance spec docs | Optional single commit — docs only |
| **2** | **Group B** | Kernel code + validation + snapshots + example fixtures | Optional single commit — trust layer code + proof |
| **3** | **Group C** | Operational plane (ledger + templates; **not projections**) + adjacent ops + root context + audit | Split across commits per §8 |
| **—** | **Separate-review-only** | Projections, duplicate ledger, LR-2 targets, stale README | **Do not stage in Groups A–C** |
| **—** | **Post-LR-2 gate** | `ops/state/projections/*.md` after verify exit 0 | After LR-2 + regenerate (human gate) |

**Hard rule:** Complete Group A → verify index → Group B → verify index → Group C sub-steps in §8 order. Never combine groups in one `git add` sweep.

---

# 2. Stage Group A

**Purpose:** Lowest-risk anchor — Python import path + frozen governance specification. No executable kernel, no ledger, no projections, no audit observations.

**Includes:**

| Path | Role |
|------|------|
| `ops/__init__.py` | Package marker |
| `ops/osctl/__init__.py` | OSCTL package marker |
| **Canonical 15** (see list below) | Frozen governance kernel |
| `ops/osctl/NON_GOALS.md` | Negative-scope companion |
| `ops/osctl/README.md` | Navigation entrypoint (no authority) |
| `ops/osctl/ARCHITECTURE_DECISIONS.md` | ADR log (scoped supplement) |
| History-tier root docs | `SPEC_REFERENCE.md`, `IMPLEMENTATION_NOTES.md`, `ARCHITECTURE_FREEZE_CHECKLIST.md`, `CI_INTEGRATION_PLAN.md` |

**Canonical 15 files:**

1. `ops/osctl/ARCHITECTURE_FREEZE.md`
2. `ops/osctl/FREEZE_v1.md`
3. `ops/osctl/EVENT_SCHEMA.md`
4. `ops/osctl/STATE_MACHINE.md`
5. `ops/osctl/LEDGER_MODEL.md`
6. `ops/osctl/PROJECTION_RULES.md`
7. `ops/osctl/REPLAY_GUARANTEES.md`
8. `ops/osctl/VERIFY_MODEL.md`
9. `ops/osctl/SERIALIZATION_RULES.md`
10. `ops/osctl/ROLLBACK_POLICY.md`
11. `ops/osctl/DRIFT_DETECTION.md`
12. `ops/osctl/GOVERNANCE.md`
13. `ops/osctl/BOUNDARIES.md`
14. `ops/osctl/HUMAN_BOUNDARIES.md`
15. `ops/osctl/TRUST_MODEL.md`

**Explicitly excluded from Group A:** `ops/osctl/core/**`, `ops/osctl/validation/**`, `ops/osctl/snapshots/**`, `ops/osctl/examples/**`, `ops/osctl/audit/**`, `ops/osctl/ledger/**`, `ops/osctl/projections/**`, all of `ops/state/**`, root context files.

---

# 3. Stage Group B

**Purpose:** Deterministic trust layer — code, executable validation, snapshot layer, rehearsal **inputs** only. Pre-LR-2 code defaults remain as-is.

**Includes:**

| Path | Role |
|------|------|
| `ops/osctl/core/**` | Frozen Python kernel (cli, ledger, projection, replay, schema, verify) |
| `ops/osctl/validation/**` | `run_validation.py`, scenarios, evidence MDs |
| `ops/osctl/snapshots/**` | Snapshot spec, scripts, JSON fixtures |
| `ops/osctl/examples/**` | Fixture JSON, READMEs, `events.jsonl`, `run_rehearsals.py` — **excluding all `projections/` subdirs** |

**Explicitly excluded from Group B:**

- `ops/osctl/ledger/events.jsonl` — duplicate path; H1 authority is `ops/state/ledger/`
- `ops/osctl/projections/*.generated.md` — kernel-default output; not H2 live authority
- `ops/osctl/examples/**/projections/*.generated.md` — 12 rehearsal artifacts
- `ops/osctl/audit/**` — observations last (Group C)
- All operational plane and root context

---

# 4. Stage Group C

**Purpose:** Operational and adjacent layers + human context + audit observations. Split into **sub-groups C1–C5** (separate index reviews; separate commits recommended).

| Sub-group | Paths | Notes |
|-----------|-------|-------|
| **C1 — Operational ledger + templates** | `ops/state/ledger/events.jsonl`, `ops/state/*.template.md`, `ops/state/RELEASE_CHECKLIST.md`, `ops/state/ROLLBACK_CHECKLIST.md`, `ops/state/STATE_TRANSITIONS.md`, `ops/state/README.md` | H1 ledger; **no projections** |
| **C2 — Adjacent playbooks** | `ops/rituals/**`, `ops/simulations/**` | Operator guidance only |
| **C3 — Adjacent governance** | `ops/state/GOVERNANCE.md` | **Never same commit as** `ops/osctl/GOVERNANCE.md` |
| **C4 — Ops navigation** | `ops/README.md` | **Human must fix stale content first** (claims ledger "not created yet") |
| **C5 — Root context (bannered)** | `AGENT_RULES.md`, `MASTER_CONTEXT.md`, `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` | Legacy pointers; not ledger truth |
| **C6 — Audit layer (last)** | `ops/osctl/audit/**` | Includes this plan; describes final prep state |

**Explicitly excluded from Group C (until post-LR-2 gate):**

- `ops/state/projections/CURRENT_STATUS.md`
- `ops/state/projections/DEPLOYMENT_STATE.md`

---

# 5. Separate-review-only paths

Stage only after explicit human review and **never** in the same index as their conflicting pair.

| Path | Review focus | When |
|------|--------------|------|
| `ops/state/projections/CURRENT_STATUS.md` | Hash ≠ kernel output today; must match post-verify | **Post-LR-2 gate only** |
| `ops/state/projections/DEPLOYMENT_STATE.md` | Same | **Post-LR-2 gate only** |
| `ops/osctl/ledger/events.jsonl` | Byte-duplicate of H1 ledger; demote to fixture after LR-2 | **Do not stage** during Groups A–C |
| `ops/osctl/projections/CURRENT_STATUS.generated.md` | Pre-LR-2 kernel-default output | **Do not stage** as live authority |
| `ops/osctl/projections/DEPLOYMENT_STATE.generated.md` | Same | **Do not stage** as live authority |
| `ops/osctl/core/ledger/paths.py` | LR-2 target — H1 path alignment | LR-2 human gate |
| `ops/osctl/core/projection/render.py` | LR-2 target — H2 filename/path alignment | LR-2 human gate |
| `ops/osctl/core/cli/main.py` | CLI vocabulary cleanup (LR-2 adjacent) | LR-2 human gate |
| `ops/osctl/validation/HASH_REGISTRY.md` | May reflect pre-LR-2 paths | Review before stage; append-only after path lock |
| `ops/README.md` | Stale navigation | Edit before C4 stage |
| `ops/state/GOVERNANCE.md` | Adjacent vs kernel governance | C3 only; isolated commit |

---

# 6. Never-stage paths

| Path / pattern | Reason |
|----------------|--------|
| `git add .` | Mass staging forbidden (H6) |
| `git add ops/` | ~200 files; artifacts + duplicates |
| `git add -A` | Mass staging forbidden |
| `docker-compose.yml` | Runtime — wrong track |
| `backend/**` | Product code |
| `__pycache__/`, `*.pyc`, `*.pyo` | Non-deterministic bytecode |
| `ops/osctl/examples/**/projections/*.generated.md` (12 files) | Rehearsal artifacts only |
| `ops/osctl/ledger/events.jsonl` **with** `ops/state/ledger/events.jsonl` | Dual ledger authority (H1) |
| `ops/osctl/projections/*.generated.md` **with** `ops/state/projections/*.md` | Dual projection authority (H2) |
| `.env`, secrets, tokens, `.claude/settings*.json` | Security / local IDE |
| Unverified `ops/state/projections/*.md` | Drift risk |

---

# 7. Generated artifact exclusions

**Never stage (rehearsal / fixture output):**

```text
ops/osctl/examples/drift_detection/projections/CURRENT_STATUS.generated.md
ops/osctl/examples/drift_detection/projections/DEPLOYMENT_STATE.generated.md
ops/osctl/examples/operator_handoff/projections/CURRENT_STATUS.generated.md
ops/osctl/examples/operator_handoff/projections/DEPLOYMENT_STATE.generated.md
ops/osctl/examples/reconcile_flow/projections/CURRENT_STATUS.generated.md
ops/osctl/examples/reconcile_flow/projections/DEPLOYMENT_STATE.generated.md
ops/osctl/examples/rollback_rehearsal/projections/CURRENT_STATUS.generated.md
ops/osctl/examples/rollback_rehearsal/projections/DEPLOYMENT_STATE.generated.md
ops/osctl/examples/staging_deploy_failure/projections/CURRENT_STATUS.generated.md
ops/osctl/examples/staging_deploy_failure/projections/DEPLOYMENT_STATE.generated.md
ops/osctl/examples/staging_deploy_success/projections/CURRENT_STATUS.generated.md
ops/osctl/examples/staging_deploy_success/projections/DEPLOYMENT_STATE.generated.md
```

**Do not stage as live authority (kernel-default / pre-LR-2):**

```text
ops/osctl/projections/CURRENT_STATUS.generated.md
ops/osctl/projections/DEPLOYMENT_STATE.generated.md
```

**Regenerable evidence (stage in Group B only as reviewed proof — not policy):**

```text
ops/osctl/validation/VALIDATION_REPORT.md
ops/osctl/validation/VALIDATION_SUMMARY.md
ops/osctl/validation/DETERMINISM_REPORT.md
ops/osctl/validation/HASH_REGISTRY.md
```

**Rule:** Do not regenerate validation reports during staging. Stage the on-disk evidence as proof of a prior run; re-run after LR-2 before any trust commit.

---

# 8. Root context staging rules

All four root files have **H3 banners applied**. They are **not** ledger truth.

| File | Rule |
|------|------|
| `AGENT_RULES.md` | Stage in **C5** only; separate commit from OSCTL kernel docs; verify-first pointer to `ops/state/projections/` |
| `MASTER_CONTEXT.md` | Stage in **C5** only; backend operational context; must not restate OSCTL trust claims |
| `CURRENT_STATUS.md` | Stage in **C5** only; legacy bannered pointer — canonical truth is `ops/state/projections/CURRENT_STATUS.md` |
| `DEPLOYMENT_STATE.md` | Stage in **C5** only; legacy bannered pointer — env catalog is reference, not ledger truth |

**Forbidden:**

- Staging root status MDs in the same commit as `ops/state/projections/*.md`
- Staging root context in Group A or B
- Staging root context before Groups A and B are indexed (audit must reflect kernel presence)

---

# 9. Replay safety rules

| Rule | Requirement |
|------|-------------|
| **R-1 Single ledger** | Stage `ops/state/ledger/events.jsonl` only; never `ops/osctl/ledger/events.jsonl` in same anchoring pass |
| **R-2 Single projection authority** | Defer `ops/state/projections/*.md` until post-LR-2 verify exit 0; never stage `ops/osctl/projections/*.generated.md` as co-equal |
| **R-3 No replay mutation** | Staging must not edit ledger lines, projection content, or replay engine |
| **R-4 Kernel path awareness** | `paths.py` defaults to `ops/osctl/ledger/` today — operators must not append to live ledger until LR-2 |
| **R-5 Example isolation** | Example `projections/*.generated.md` files must not enter git index |
| **R-6 Verify before trust commit** | Before any commit touching operational truth: `python -m ops.osctl.core verify` and `python ops/osctl/validation/run_validation.py` exit 0 (post-LR-2) |
| **R-7 Index inspection** | After each group: `git diff --cached --name-status` must show no forbidden paths |

**Replay safety verdict for Groups A–C:** **SAFE** if R-1, R-2, R-5, R-7 are obeyed. Staging alone does not mutate ledger bytes. **Unsafe** if dual ledger or dual projection surfaces enter the index.

---

# 10. Exact human commands

**Run from repository root.** Replace nothing. Execute **one block at a time**, then run the check commands before proceeding.

## Pre-staging check (run before Group A)

```powershell
cd D:\Projects\SitePilot\sitepilot-railway
git branch --show-current
git status --short
git diff --name-only
git diff --cached --name-only
```

**Pass criteria:** branch is `osctl/governance-application`; no tracked modifications; index empty; no `ops/__pycache__/`.

---

## Group A — package + governance spec docs

```powershell
git add -- ops/__init__.py
git add -- ops/osctl/__init__.py
git add -- ops/osctl/ARCHITECTURE_FREEZE.md
git add -- ops/osctl/FREEZE_v1.md
git add -- ops/osctl/EVENT_SCHEMA.md
git add -- ops/osctl/STATE_MACHINE.md
git add -- ops/osctl/LEDGER_MODEL.md
git add -- ops/osctl/PROJECTION_RULES.md
git add -- ops/osctl/REPLAY_GUARANTEES.md
git add -- ops/osctl/VERIFY_MODEL.md
git add -- ops/osctl/SERIALIZATION_RULES.md
git add -- ops/osctl/ROLLBACK_POLICY.md
git add -- ops/osctl/DRIFT_DETECTION.md
git add -- ops/osctl/GOVERNANCE.md
git add -- ops/osctl/BOUNDARIES.md
git add -- ops/osctl/HUMAN_BOUNDARIES.md
git add -- ops/osctl/TRUST_MODEL.md
git add -- ops/osctl/NON_GOALS.md
git add -- ops/osctl/README.md
git add -- ops/osctl/ARCHITECTURE_DECISIONS.md
git add -- ops/osctl/SPEC_REFERENCE.md
git add -- ops/osctl/IMPLEMENTATION_NOTES.md
git add -- ops/osctl/ARCHITECTURE_FREEZE_CHECKLIST.md
git add -- ops/osctl/CI_INTEGRATION_PLAN.md
```

**Group A index check:**

```powershell
git diff --cached --name-status
git diff --cached --stat
```

---

## Group B — kernel + validation + snapshots + example fixtures

```powershell
git add -- ops/osctl/core
git add -- ops/osctl/validation
git add -- ops/osctl/snapshots
git add -- ops/osctl/examples/README.md
git add -- ops/osctl/examples/REHEARSAL_SUMMARY.md
git add -- ops/osctl/examples/run_rehearsals.py
git add -- ops/osctl/examples/deploy-event.json
git add -- ops/osctl/examples/reconcile-event.json
git add -- ops/osctl/examples/rollback-event.json
git add -- ops/osctl/examples/drift_detection/README.md
git add -- ops/osctl/examples/drift_detection/events.jsonl
git add -- ops/osctl/examples/operator_handoff/README.md
git add -- ops/osctl/examples/operator_handoff/events.jsonl
git add -- ops/osctl/examples/reconcile_flow/README.md
git add -- ops/osctl/examples/reconcile_flow/events.jsonl
git add -- ops/osctl/examples/rollback_rehearsal/README.md
git add -- ops/osctl/examples/rollback_rehearsal/events.jsonl
git add -- ops/osctl/examples/staging_deploy_failure/README.md
git add -- ops/osctl/examples/staging_deploy_failure/events.jsonl
git add -- ops/osctl/examples/staging_deploy_success/README.md
git add -- ops/osctl/examples/staging_deploy_success/events.jsonl
```

**Group B index check (must show zero projection/ledger forbidden paths):**

```powershell
git diff --cached --name-only | Select-String -Pattern "projections|ops/osctl/ledger"
```

**Expected:** no output. If any match appears, unstage before proceeding:

```powershell
git restore --staged -- ops/osctl/examples/*/projections/
git restore --staged -- ops/osctl/ledger/
git restore --staged -- ops/osctl/projections/
```

---

## Group C — operational + adjacent + root + audit (sub-groups)

### C1 — operational ledger + templates

```powershell
git add -- ops/state/ledger/events.jsonl
git add -- ops/state/CURRENT_STATUS.template.md
git add -- ops/state/DEPLOYMENT_STATE.template.md
git add -- ops/state/INCIDENT_LOG.template.md
git add -- ops/state/RELEASE_CHECKLIST.md
git add -- ops/state/ROLLBACK_CHECKLIST.md
git add -- ops/state/STATE_TRANSITIONS.md
git add -- ops/state/README.md
```

### C2 — rituals + simulations

```powershell
git add -- ops/rituals/DAILY_OPERATIONS.md
git add -- ops/rituals/DEPLOY_RITUAL.md
git add -- ops/rituals/HANDOFF_PROTOCOL.md
git add -- ops/rituals/INCIDENT_TRIAGE.md
git add -- ops/rituals/PRODUCTION_GO_NO_GO.md
git add -- ops/rituals/ROLLBACK_RITUAL.md
git add -- ops/rituals/STAGING_VALIDATION.md
git add -- ops/rituals/WEEKLY_RECONCILIATION.md
git add -- ops/simulations/FAILED_PRODUCTION_DEPLOY.md
git add -- ops/simulations/HANDOFF_SIMULATION.md
git add -- ops/simulations/ROLLBACK_SIMULATION.md
git add -- ops/simulations/STAGING_DEPLOY_SIMULATION.md
git add -- ops/simulations/UNRECORDED_DEPLOY_DRIFT.md
```

### C3 — adjacent governance (isolated commit recommended)

```powershell
git add -- ops/state/GOVERNANCE.md
```

### C4 — ops navigation (after human fixes stale README)

```powershell
git add -- ops/README.md
```

### C5 — root context (isolated commit recommended)

```powershell
git add -- AGENT_RULES.md
git add -- MASTER_CONTEXT.md
git add -- CURRENT_STATUS.md
git add -- DEPLOYMENT_STATE.md
```

### C6 — audit layer (last)

```powershell
git add -- ops/osctl/audit
```

**Group C index check:**

```powershell
git diff --cached --name-only | Select-String -Pattern "ops/state/projections|ops/osctl/ledger|ops/osctl/projections|examples/.+/projections"
```

**Expected:** no output.

---

## Post-LR-2 gate only — verified projections (NOT part of Groups A–C)

**Prerequisites:** LR-2 complete; `python -m ops.osctl.core replay`; `python -m ops.osctl.core verify`; `python ops/osctl/validation/run_validation.py` all exit 0.

```powershell
git add -- ops/state/projections/CURRENT_STATUS.md
git add -- ops/state/projections/DEPLOYMENT_STATE.md
```

---

## Final full index audit (before any commit decision)

```powershell
git status --short --untracked-files=all
git diff --cached --stat
git diff --cached --name-status
git ls-files --stage -- ops/osctl
git ls-files --stage -- ops/state
```

---

## Strict-mode compliance

| Constraint | Complied |
|------------|----------|
| Staging choreography only — no execution | ✓ |
| No commits / push / merge | ✓ |
| No LR-1 / LR-2 execution | ✓ |
| No ledger / projection / replay edits | ✓ |
| No mass staging commands in §10 | ✓ |
| H1–H7 frozen topology respected | ✓ |

---

**Safe path-level staging plan complete.** Human operator owns all `git add` execution, index review, LR-2 gate, verify re-run, and commits.
