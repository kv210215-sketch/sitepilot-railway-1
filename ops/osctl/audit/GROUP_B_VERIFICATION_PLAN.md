# OSCTL Group B Verification Plan

**Date:** 2026-05-24  
**Agent:** OSCTL Workspace Anchoring Agent  
**Mode:** STRICT — verification choreography only  
**Repository:** `D:\Projects\SitePilot\sitepilot-railway`  
**Branch:** `osctl/governance-application`  
**Prerequisite:** Group A staged and verified (24 paths — package markers + governance spec docs)  
**Authority of this document:** Human verification guidance only — does not authorize staging, commits, LR-1, LR-2, or repository mutation.

**Group B scope (approved):** `ops/osctl/core/**`, `ops/osctl/validation/**`, `ops/osctl/snapshots/**`, example fixtures only (excluding generated projection artifacts).

**Reference:** `SAFE_PATH_LEVEL_STAGING_PLAN.md` §3–§4, §7, §9–§10.

---

# 1. Exact Group B allowed paths

**Total: 76 paths** (19 core + 21 validation + 18 snapshots + 18 example fixtures).

## 1.1 `ops/osctl/core/**` (19 files)

```text
ops/osctl/core/__init__.py
ops/osctl/core/__main__.py
ops/osctl/core/README.md
ops/osctl/core/cli/__init__.py
ops/osctl/core/cli/main.py
ops/osctl/core/ledger/__init__.py
ops/osctl/core/ledger/paths.py
ops/osctl/core/ledger/store.py
ops/osctl/core/projection/__init__.py
ops/osctl/core/projection/fold.py
ops/osctl/core/projection/render.py
ops/osctl/core/replay/__init__.py
ops/osctl/core/replay/engine.py
ops/osctl/core/schema/__init__.py
ops/osctl/core/schema/events.py
ops/osctl/core/schema/serialize.py
ops/osctl/core/schema/transitions.py
ops/osctl/core/verify/__init__.py
ops/osctl/core/verify/engine.py
```

## 1.2 `ops/osctl/validation/**` (21 files)

```text
ops/osctl/validation/README.md
ops/osctl/validation/run_validation.py
ops/osctl/validation/VALIDATION_REPORT.md
ops/osctl/validation/VALIDATION_SUMMARY.md
ops/osctl/validation/VALIDATION_MATRIX.md
ops/osctl/validation/DETERMINISM_REPORT.md
ops/osctl/validation/HASH_REGISTRY.md
ops/osctl/validation/REPLAY_TESTS.md
ops/osctl/validation/FAILURE_CASES.md
ops/osctl/validation/TRUST_MODEL.md
ops/osctl/validation/WHAT REMAINS MANUAL.md
ops/osctl/validation/scenarios/clean-deploy-chain/event-01.json
ops/osctl/validation/scenarios/clean-deploy-chain/event-02.json
ops/osctl/validation/scenarios/clean-deploy-chain/events.jsonl
ops/osctl/validation/scenarios/environment-mismatch/events.jsonl
ops/osctl/validation/scenarios/invalid-transition/events.jsonl
ops/osctl/validation/scenarios/malformed-event/event-invalid.json
ops/osctl/validation/scenarios/projection-mismatch/README.md
ops/osctl/validation/scenarios/reconcile-flow/events.jsonl
ops/osctl/validation/scenarios/rollback-chain/events.jsonl
ops/osctl/validation/scenarios/rollback-target-missing/events.jsonl
```

## 1.3 `ops/osctl/snapshots/**` (18 files)

```text
ops/osctl/snapshots/AGENT_AUTHORITY_MAP.md
ops/osctl/snapshots/CAPABILITY_MATRIX.md
ops/osctl/snapshots/FUTURE_RISKS.md
ops/osctl/snapshots/PHASE3_FINAL_REVIEW.md
ops/osctl/snapshots/SNAPSHOT_ARCHITECTURE.md
ops/osctl/snapshots/SNAPSHOT_FAILURE_MODES.md
ops/osctl/snapshots/SNAPSHOT_FORMAT.md
ops/osctl/snapshots/SNAPSHOT_RETENTION.md
ops/osctl/snapshots/SNAPSHOT_SECURITY.md
ops/osctl/snapshots/SNAPSHOT_TRUST_BOUNDARIES.md
ops/osctl/snapshots/STATE_MACHINE_BOUNDARIES.md
ops/osctl/snapshots/examples/REPLAY_RECONSTRUCTION.md
ops/osctl/snapshots/examples/corrupted-snapshot.json
ops/osctl/snapshots/examples/stale-snapshot.json
ops/osctl/snapshots/examples/valid-snapshot.json
ops/osctl/snapshots/scripts/compare_snapshot.py
ops/osctl/snapshots/scripts/snapshot_metadata.py
ops/osctl/snapshots/scripts/verify_snapshot.py
```

## 1.4 Example fixtures only (18 files)

```text
ops/osctl/examples/README.md
ops/osctl/examples/REHEARSAL_SUMMARY.md
ops/osctl/examples/run_rehearsals.py
ops/osctl/examples/deploy-event.json
ops/osctl/examples/reconcile-event.json
ops/osctl/examples/rollback-event.json
ops/osctl/examples/drift_detection/README.md
ops/osctl/examples/drift_detection/events.jsonl
ops/osctl/examples/operator_handoff/README.md
ops/osctl/examples/operator_handoff/events.jsonl
ops/osctl/examples/reconcile_flow/README.md
ops/osctl/examples/reconcile_flow/events.jsonl
ops/osctl/examples/rollback_rehearsal/README.md
ops/osctl/examples/rollback_rehearsal/events.jsonl
ops/osctl/examples/staging_deploy_failure/README.md
ops/osctl/examples/staging_deploy_failure/events.jsonl
ops/osctl/examples/staging_deploy_success/README.md
ops/osctl/examples/staging_deploy_success/events.jsonl
```

**Approved staging commands (human only — not executed by this plan):**

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

**Combined index expectation after Group A + B:** **100 staged paths** (24 Group A + 76 Group B).

---

# 2. Exact forbidden Group B paths

These paths must **not** appear in the index after Group B staging.

## 2.1 Mass-staging patterns (forbidden commands)

```text
git add .
git add ops/
git add -A
git add -- ops/osctl/examples
```

(`git add -- ops/osctl/examples` would include all 12 projection artifacts.)

## 2.2 Out-of-scope trees (Group C or later)

```text
ops/state/**
ops/rituals/**
ops/simulations/**
ops/README.md
ops/osctl/audit/**
AGENT_RULES.md
MASTER_CONTEXT.md
CURRENT_STATUS.md
DEPLOYMENT_STATE.md
backend/**
docker-compose.yml
```

## 2.3 Ledger and projection surfaces (forbidden in Group B)

```text
ops/osctl/ledger/events.jsonl
ops/osctl/projections/CURRENT_STATUS.generated.md
ops/osctl/projections/DEPLOYMENT_STATE.generated.md
```

## 2.4 Example generated projection artifacts (forbidden in Group B)

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

## 2.5 Bytecode and secrets (forbidden always)

```text
**/__pycache__/**
**/*.pyc
**/*.pyo
.env
**/.claude/settings*.json
```

---

# 3. Generated artifact exclusions

| Class | Paths | Group B rule |
|-------|-------|--------------|
| Example rehearsal outputs | 12 `examples/**/projections/*.generated.md` | **Never in index** |
| Kernel-default projections | `ops/osctl/projections/*.generated.md` | **Never in index** |
| Live operational projections | `ops/state/projections/*.md` | **Group C / post-LR-2 gate** — not Group B |
| Validation evidence MDs | `VALIDATION_REPORT.md`, `VALIDATION_SUMMARY.md`, `DETERMINISM_REPORT.md`, `HASH_REGISTRY.md` | **Allowed in Group B** as reviewed proof only — do not regenerate during staging |
| Validation scenario fixtures | `validation/scenarios/**` | **Allowed** — fixture inputs, not live ledger |

**Rule:** Staging validation reports records prior proof; it does not assert new policy. Re-run validation after LR-2 before any trust commit.

---

# 4. Replay-sensitive files

Files in Group B that affect replay, verify, or default I/O paths. Staging is allowed; **behavior review** is required before commit.

| Path | Sensitivity |
|------|-------------|
| `ops/osctl/core/replay/engine.py` | Replay determinism implementation |
| `ops/osctl/core/schema/serialize.py` | Canonical byte serialization |
| `ops/osctl/core/schema/events.py` | Closed event enum |
| `ops/osctl/core/schema/transitions.py` | State machine transitions |
| `ops/osctl/core/projection/fold.py` | Fold from events to state |
| `ops/osctl/core/projection/render.py` | Projection render — **LR-2 target** (H2 paths) |
| `ops/osctl/core/ledger/store.py` | Append-only store |
| `ops/osctl/core/ledger/paths.py` | Default ledger/projection paths — **LR-2 target** (H1 paths) |
| `ops/osctl/core/verify/engine.py` | Verify layers |
| `ops/osctl/core/cli/main.py` | CLI entry — **LR-2 adjacent** (vocabulary) |
| `ops/osctl/validation/run_validation.py` | Executable proof runner |
| `ops/osctl/validation/scenarios/**` | Negative/positive replay fixtures |
| `ops/osctl/examples/*/events.jsonl` | Rehearsal ledger fixtures (isolated per scenario) |

**Note:** Group B staging does **not** mutate ledger or projection bytes on disk. Replay risk arises if forbidden ledger/projection paths enter the index or if operators append using pre-LR-2 `paths.py` defaults.

---

# 5. Separate-review-only files

Allowed in Group B index but require **explicit human review** before any Group B commit.

| Path | Review focus |
|------|--------------|
| `ops/osctl/core/ledger/paths.py` | Defaults to `ops/osctl/ledger/` — misaligned with H1 (`ops/state/ledger/`) until LR-2 |
| `ops/osctl/core/projection/render.py` | Writes `*.generated.md` under kernel tree — misaligned with H2 until LR-2 |
| `ops/osctl/core/cli/main.py` | CLI subcommand vocabulary |
| `ops/osctl/validation/HASH_REGISTRY.md` | Fingerprints may reflect pre-LR-2 paths |
| `ops/osctl/validation/VALIDATION_REPORT.md` | Evidence timestamp vs current tree |
| `ops/osctl/validation/VALIDATION_SUMMARY.md` | Same |
| `ops/osctl/validation/DETERMINISM_REPORT.md` | Same |
| `ops/osctl/snapshots/scripts/verify_snapshot.py` | Snapshot verify — no deploy hooks |

**LR-2 is a separate human gate.** This plan does not authorize LR-2 execution.

---

# 6. Exact verification commands

Run from repository root **after** human completes Group B staging. **Read-only** — no staging, commits, or file edits.

## 6.1 Pre-verification workspace check

```powershell
cd D:\Projects\SitePilot\sitepilot-railway
git branch --show-current
git diff --name-only
```

**Pass:** branch is `osctl/governance-application`; working tree has no unintended tracked modifications.

## 6.2 Forbidden-path scan (Group B)

```powershell
git diff --cached --name-only | Select-String -Pattern "projections|ops/osctl/ledger|ops/state|ops/rituals|ops/simulations|ops/osctl/audit|AGENT_RULES|MASTER_CONTEXT|CURRENT_STATUS|DEPLOYMENT_STATE|^ops/README"
```

**Pass:** no output.

## 6.3 Narrow forbidden scan (ledger + projections only)

```powershell
git diff --cached --name-only | Select-String -Pattern "projections|ops/osctl/ledger"
```

**Pass:** no output.

## 6.4 Group B path allowlist count

```powershell
$exampleFixtures = @(
  'ops/osctl/examples/README.md',
  'ops/osctl/examples/REHEARSAL_SUMMARY.md',
  'ops/osctl/examples/run_rehearsals.py',
  'ops/osctl/examples/deploy-event.json',
  'ops/osctl/examples/reconcile-event.json',
  'ops/osctl/examples/rollback-event.json',
  'ops/osctl/examples/drift_detection/README.md',
  'ops/osctl/examples/drift_detection/events.jsonl',
  'ops/osctl/examples/operator_handoff/README.md',
  'ops/osctl/examples/operator_handoff/events.jsonl',
  'ops/osctl/examples/reconcile_flow/README.md',
  'ops/osctl/examples/reconcile_flow/events.jsonl',
  'ops/osctl/examples/rollback_rehearsal/README.md',
  'ops/osctl/examples/rollback_rehearsal/events.jsonl',
  'ops/osctl/examples/staging_deploy_failure/README.md',
  'ops/osctl/examples/staging_deploy_failure/events.jsonl',
  'ops/osctl/examples/staging_deploy_success/README.md',
  'ops/osctl/examples/staging_deploy_success/events.jsonl'
)
$staged = git diff --cached --name-only
$groupB = $staged | Where-Object {
  $p = $_
  ($p.StartsWith('ops/osctl/core/')) -or
  ($p.StartsWith('ops/osctl/validation/')) -or
  ($p.StartsWith('ops/osctl/snapshots/')) -or
  ($p -in $exampleFixtures)
}
$groupB.Count
$staged | Where-Object { $_ -notin $groupB -and $_ -notlike 'ops/osctl/*.md' -and $_ -ne 'ops/__init__.py' -and $_ -ne 'ops/osctl/__init__.py' }
```

**Pass:** `$groupB.Count` is **76**; the final pipeline emits only Group A paths (24 governance spec files + 2 package markers), or is empty.

## 6.5 Bytecode scan (index)

```powershell
git diff --cached --name-only | Select-String -Pattern "__pycache__|\.pyc$|\.pyo$"
```

**Pass:** no output.

---

# 7. Exact index inspection commands

```powershell
git diff --cached --name-status
git diff --cached --stat
git diff --cached --name-only
git ls-files --stage -- ops/osctl/core
git ls-files --stage -- ops/osctl/validation
git ls-files --stage -- ops/osctl/snapshots
git ls-files --stage -- ops/osctl/examples
```

**Expected inspection results:**

| Check | Expected |
|-------|----------|
| `ops/osctl/core` staged files | 19 |
| `ops/osctl/validation` staged files | 21 |
| `ops/osctl/snapshots` staged files | 18 |
| `ops/osctl/examples` staged files | 18 (zero under `projections/`) |
| `ops/osctl/examples` under `projections/` | **0** |
| `ops/osctl/ledger/` in index | **0** |
| `ops/osctl/projections/` in index | **0** |

---

# 8. Exact rollback commands

Use if forbidden paths enter the index or Group B must be fully unstaged.

## 8.1 Unstage forbidden projection/ledger paths only

```powershell
git restore --staged -- ops/osctl/examples/drift_detection/projections/
git restore --staged -- ops/osctl/examples/operator_handoff/projections/
git restore --staged -- ops/osctl/examples/reconcile_flow/projections/
git restore --staged -- ops/osctl/examples/rollback_rehearsal/projections/
git restore --staged -- ops/osctl/examples/staging_deploy_failure/projections/
git restore --staged -- ops/osctl/examples/staging_deploy_success/projections/
git restore --staged -- ops/osctl/ledger/
git restore --staged -- ops/osctl/projections/
```

## 8.2 Unstage entire Group B (preserve Group A)

```powershell
git restore --staged -- ops/osctl/core
git restore --staged -- ops/osctl/validation
git restore --staged -- ops/osctl/snapshots
git restore --staged -- ops/osctl/examples/README.md
git restore --staged -- ops/osctl/examples/REHEARSAL_SUMMARY.md
git restore --staged -- ops/osctl/examples/run_rehearsals.py
git restore --staged -- ops/osctl/examples/deploy-event.json
git restore --staged -- ops/osctl/examples/reconcile-event.json
git restore --staged -- ops/osctl/examples/rollback-event.json
git restore --staged -- ops/osctl/examples/drift_detection/README.md
git restore --staged -- ops/osctl/examples/drift_detection/events.jsonl
git restore --staged -- ops/osctl/examples/operator_handoff/README.md
git restore --staged -- ops/osctl/examples/operator_handoff/events.jsonl
git restore --staged -- ops/osctl/examples/reconcile_flow/README.md
git restore --staged -- ops/osctl/examples/reconcile_flow/events.jsonl
git restore --staged -- ops/osctl/examples/rollback_rehearsal/README.md
git restore --staged -- ops/osctl/examples/rollback_rehearsal/events.jsonl
git restore --staged -- ops/osctl/examples/staging_deploy_failure/README.md
git restore --staged -- ops/osctl/examples/staging_deploy_failure/events.jsonl
git restore --staged -- ops/osctl/examples/staging_deploy_success/README.md
git restore --staged -- ops/osctl/examples/staging_deploy_success/events.jsonl
```

## 8.3 Confirm rollback

```powershell
git diff --cached --name-only | Select-String -Pattern "ops/osctl/core|ops/osctl/validation|ops/osctl/snapshots|ops/osctl/examples"
```

**Pass after full Group B rollback:** no output (Group A paths remain staged).

---

# 9. Post-Group-B replay safety checks

Run **after** §6–§7 pass. These validate runtime behavior against the **working tree** (staging does not change file bytes). **Do not** treat as authorization to commit or execute LR-2.

## 9.1 Index replay-safety assertions

| # | Assertion | Command |
|---|-----------|---------|
| 1 | No live ledger in index | `git diff --cached --name-only \| Select-String "ops/osctl/ledger\|ops/state/ledger"` → empty |
| 2 | No projection surfaces in index | `git diff --cached --name-only \| Select-String "projections"` → empty |
| 3 | Core replay engine present in index | `git diff --cached --name-only \| Select-String "ops/osctl/core/replay/engine.py"` → one match |
| 4 | Serialize module present | `git diff --cached --name-only \| Select-String "ops/osctl/core/schema/serialize.py"` → one match |

## 9.2 Runtime validation (read-only execution — human operator)

```powershell
python -m ops.osctl.core replay
python -m ops.osctl.core verify
python ops/osctl/validation/run_validation.py
```

**Pass criteria:**

- All three commands exit **0**
- No ledger file modified (re-run `git diff --name-only` — still empty for tracked files)
- No projection files under `ops/state/projections/` modified by replay (pre-LR-2 defaults may still write under `ops/osctl/projections/` — document observation only; do not commit those outputs)

## 9.3 Post-run working-tree drift check

```powershell
git status --short ops/osctl/ledger/ ops/osctl/projections/ ops/state/ledger/ ops/state/projections/
```

**Pass for Group B verification:** untracked or modified status acceptable only if **not staged** and **not committed**; live ledger at `ops/state/ledger/events.jsonl` must not show unintended line edits.

## 9.4 Replay safety verdict

| Condition | Verdict |
|-----------|---------|
| §6 forbidden scans pass + §7 counts match + §9.1 assertions pass | **INDEX SAFE** for Group B |
| §9.2 all exit 0 + no unintended ledger mutation | **RUNTIME SAFE** for pre-LR-2 tree |
| Forbidden ledger/projection paths in index | **UNSAFE** — execute §8 rollback before proceeding to Group C |
| Validation fails | **BLOCK Group C** — fix tree or unstage Group B; do not commit |

**Explicit gates still required after Group B:** LR-2 path alignment, post-LR-2 verify, explicit LR-1 approval — none authorized by this document.

---

## Strict-mode compliance

| Constraint | Complied |
|------------|----------|
| Verification choreography only | ✓ |
| No staging / commits / repository mutation | ✓ |
| No LR-1 / LR-2 / replay / ledger / projection edits | ✓ |
| No `git add .` / `git add ops/` / `git add -A` in this plan | ✓ |
| Group B scope only — no Group C | ✓ |

---

**Group B verification plan complete.** Human operator owns staging, verification execution, rollback, and commit decisions.
