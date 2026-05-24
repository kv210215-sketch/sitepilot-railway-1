# OSCTL Workspace Anchoring Plan

**Date:** 2026-05-24  
**Agent:** OSCTL Workspace Anchoring Agent  
**Mode:** STRICT — planning and classification only  
**Repository:** `D:\Projects\SitePilot\sitepilot-railway`  
**Branch observed:** `fix/app-module-template-compile`  
**HEAD:** `ca6f1e5` — `fix docker compose and production config`  
**Authority of this document:** Observation and staging guidance only — **non-authoritative**. Does not amend freeze, authorize commits, execute LR-1/LR-2, or bind the human operator.

**Evidence basis:** `git status --short --untracked-files=all`, `git diff --name-only`, `git ls-files -- ops`, tree inspection of `ops/**`, root context files (`AGENT_RULES.md`, `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md`, `MASTER_CONTEXT.md`), `CANONICAL_GOVERNANCE_MAP.md`, `HUMAN_SIGNOFF_PACKAGE.md` §4–§7, `H3_NORMALIZATION_REPORT.md`, `WORKSPACE_BLOCKER_CLASSIFICATION.md`, `SAFE_STAGE_SEQUENCE.md`, `HUMAN_COMMIT_SEQUENCE.md`, `DOCKER_COMPOSE_ISOLATION_FINAL.md`, byte/hash comparison of ledger and projection paths, `ops/osctl/core/ledger/paths.py`.

**Governance context:** H1–H7 approved 2026-05-24 (Andriy Yuzich). H3 root-context normalization complete. Docker-compose isolation complete (working tree clean). Governance topology frozen — this plan does **not** discover new topology.

---

# 1. Current workspace state

| Property | Value |
|----------|-------|
| Branch | `fix/app-module-template-compile` (backend compile-fix track) |
| HEAD | `ca6f1e5` |
| Tracked modifications | **None** (`git diff --name-only` empty) |
| Staged changes | **None** |
| Tracked `ops/**` paths | **None** (`git ls-files -- ops` empty) |
| Untracked summary (`git status --short`) | 4 root MD files + entire `ops/` tree |
| Expanded untracked file count under `ops/` | **203 files** |
| `docker-compose.yml` | **Clean** — no working-tree modification (isolation complete) |
| Backend dirty trees | **Isolated** (prior session stashes; not re-litigated) |
| H1–H7 human approval | **Approved** 2026-05-24 |
| H3 root banners/pointers | **Applied** |
| LR-1 explicit approval (§4 separate gate) | **Not granted** |
| LR-2 path alignment | **Pending** |
| OSCTL git anchoring | **Not started** — entire trust layer untracked |

**Workspace verdict:** Runtime surface is isolated enough for OSCTL-only anchoring **preparation**, but the repository remains on a **backend branch** with **zero git-tracked OSCTL material**. Anchoring has not begun. LR-1 and LR-2 remain forbidden for agents.

**Dual-plane model (H7, frozen):**

```text
ops/osctl/  → governance kernel, frozen spec, deterministic code, validation fixtures
ops/state/  → operational truth plane (live ledger + generated projections)
```

**Known code/doc path mismatch (LR-2 scope, not resolved here):**

| Surface | H1/H2 approved authority | Current kernel default (`paths.py`, `render.py`) |
|---------|---------------------------|--------------------------------------------------|
| Ledger | `ops/state/ledger/events.jsonl` | `ops/osctl/ledger/events.jsonl` |
| Projections | `ops/state/projections/CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` (undecorated) | `ops/osctl/projections/*.generated.md` |

Ledger bytes are **identical** today (SHA256 `96F80F46257653E2962BEC9D939DDFEB5474ECB215E7F4325BC330C3EE2EC8B8`). Projection bytes **diverge** (`ops/osctl/projections/CURRENT_STATUS.generated.md` ≠ `ops/state/projections/CURRENT_STATUS.md`). Staging both projection surfaces as co-equal truth is forbidden under H2/H4.

---

# 2. Remaining untracked paths

## 2.1 Root context (4 files)

| Path | Status | H3 disposition |
|------|--------|----------------|
| `AGENT_RULES.md` | Untracked | Verify-first banner applied; points to `ops/state/projections/` |
| `CURRENT_STATUS.md` | Untracked | NON-CANONICAL / LEGACY banner applied |
| `DEPLOYMENT_STATE.md` | Untracked | NON-CANONICAL / LEGACY banner applied |
| `MASTER_CONTEXT.md` | Untracked | Backend operational context; not OSCTL governance kernel |

## 2.2 `ops/` tree (203 files, fully untracked)

| Subtree | Approx. role | File count (indicative) |
|---------|--------------|-------------------------|
| `ops/__init__.py` | Python package marker | 1 |
| `ops/README.md` | Ops navigation ( **stale** — claims ledger "not created yet") | 1 |
| `ops/osctl/*.md` | Frozen spec + governance (15 canonical + supplements + history) | ~20 |
| `ops/osctl/core/**` | Deterministic kernel (cli, ledger, projection, replay, schema, verify) | ~18 |
| `ops/osctl/validation/**` | Executable proof + evidence + scenarios | ~20 |
| `ops/osctl/snapshots/**` | Snapshot layer spec, scripts, fixtures | ~20 |
| `ops/osctl/examples/**` | Rehearsal fixtures (includes 12 example projection artifacts) | ~35 |
| `ops/osctl/audit/**` | Dated observations (includes this plan) | ~60 |
| `ops/osctl/ledger/events.jsonl` | Kernel-default ledger copy (byte-identical to `ops/state/ledger/` today) | 1 |
| `ops/osctl/projections/*.generated.md` | Kernel-default generated projections | 2 |
| `ops/rituals/**` | Operator playbooks | 8 |
| `ops/simulations/**` | Training narratives | 5 |
| `ops/state/**` | Operational plane: templates, checklists, ledger, projections, adjacent governance | ~14 |

## 2.3 Present but must not enter anchor commits

| Path | Reason |
|------|--------|
| `ops/__pycache__/` | Python bytecode cache — exists on disk; **never stage** |
| `ops/osctl/examples/**/projections/*.generated.md` | Rehearsal outputs only (12 files) |

## 2.4 Explicitly out of OSCTL anchoring scope (not untracked blockers in current status)

| Path class | Notes |
|------------|-------|
| `backend/**` | Product code — isolated via prior stashes |
| `docker-compose.yml` | Clean; must never appear in OSCTL commit |
| `.github/**`, deploy configs, secrets | Runtime/deploy track |

---

# 3. Canonical governance candidates

Per `CANONICAL_GOVERNANCE_MAP.md` §2 — the **15-file canonical set** (stage as a reviewed unit; not blind mass add):

| # | File | Tier |
|---|------|------|
| C-1 | `ops/osctl/ARCHITECTURE_FREEZE.md` | Spec |
| C-2 | `ops/osctl/FREEZE_v1.md` | Spec |
| C-3 | `ops/osctl/EVENT_SCHEMA.md` | Spec |
| C-4 | `ops/osctl/STATE_MACHINE.md` | Spec |
| C-5 | `ops/osctl/LEDGER_MODEL.md` | Spec |
| C-6 | `ops/osctl/PROJECTION_RULES.md` | Spec |
| C-7 | `ops/osctl/REPLAY_GUARANTEES.md` | Spec |
| C-8 | `ops/osctl/VERIFY_MODEL.md` | Spec |
| C-9 | `ops/osctl/SERIALIZATION_RULES.md` | Spec |
| C-10 | `ops/osctl/ROLLBACK_POLICY.md` | Spec |
| C-11 | `ops/osctl/DRIFT_DETECTION.md` | Spec |
| C-12 | `ops/osctl/GOVERNANCE.md` | Governance |
| C-13 | `ops/osctl/BOUNDARIES.md` | Governance |
| C-14 | `ops/osctl/HUMAN_BOUNDARIES.md` | Governance |
| C-15 | `ops/osctl/TRUST_MODEL.md` | Governance |

**Negative-scope companion (stage with canonical set):**

- `ops/osctl/NON_GOALS.md`

**Navigation entrypoint (no authority, stage with governance docs):**

- `ops/osctl/README.md`

**Scoped supplements (allowed, not promoted — stage after canonical 15 reviewed):**

- `ops/osctl/snapshots/SNAPSHOT_*.md`, `STATE_MACHINE_BOUNDARIES.md`, `AGENT_AUTHORITY_MAP.md`, `CAPABILITY_MATRIX.md`, `FUTURE_RISKS.md`
- `ops/osctl/ARCHITECTURE_DECISIONS.md`

**Deterministic kernel (implementation of canonical contracts — separate commit domain from docs):**

- `ops/osctl/core/**`
- `ops/osctl/__init__.py`

**Validation proof (evidence, not policy):**

- `ops/osctl/validation/run_validation.py`
- `ops/osctl/validation/scenarios/**`

---

# 4. Operational-only files

These belong to the **operational plane** (`ops/state/`, rituals, simulations) — not OSCTL governance kernel authority. Stage on the operational track per H7; never merge commit domain with kernel spec changes.

| Path | Role | Staging note |
|------|------|
| `ops/state/ledger/events.jsonl` | **H1 canonical live ledger** | Stage as operational truth; do **not** also stage `ops/osctl/ledger/events.jsonl` as co-equal |
| `ops/state/projections/CURRENT_STATUS.md` | **H2 canonical projection** | Stage only after verify confirms generated-only; hash currently differs from kernel-default output |
| `ops/state/projections/DEPLOYMENT_STATE.md` | **H2 canonical projection** | Same as above |
| `ops/state/*.template.md` | Human-operated templates | Stage separately from ledger/projections |
| `ops/state/RELEASE_CHECKLIST.md`, `ROLLBACK_CHECKLIST.md`, `STATE_TRANSITIONS.md` | Operator checklists | Adjacent ops |
| `ops/state/INCIDENT_LOG.template.md` | Template | Adjacent ops |
| `ops/state/README.md` | Ops/state navigation | Review for stale claims before staging |
| `ops/state/GOVERNANCE.md` | **Adjacent operational governance** | Must not be staged in same commit as `ops/osctl/GOVERNANCE.md` without explicit human review |
| `ops/rituals/**` | Deploy/handoff/incident playbooks | Operational-only |
| `ops/simulations/**` | Failure-scenario training | Operational-only |
| Root `AGENT_RULES.md` | Agent discipline | Operational/adjacent — not canonical 15 |
| Root `MASTER_CONTEXT.md` | Backend architecture context | Operational/adjacent |
| Root `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` | Legacy bannered pointers | Operational/adjacent — not truth |

**Package markers:**

- `ops/__init__.py` — required for `python -m ops.osctl.core`

---

# 5. Generated/artifact files

| Path | Classification | Staging rule (H4) |
|------|----------------|-------------------|
| `ops/osctl/projections/CURRENT_STATUS.generated.md` | Kernel-default regenerable output | Do **not** stage as live authority after H2; retain as pre-LR-2 fixture or regenerate post-LR-2 only |
| `ops/osctl/projections/DEPLOYMENT_STATE.generated.md` | Kernel-default regenerable output | Same |
| `ops/osctl/examples/**/projections/*.generated.md` (12 files) | Rehearsal artifacts | **Never stage** |
| `ops/osctl/validation/VALIDATION_REPORT.md` | Regenerable evidence | Re-run `run_validation.py` before commit; evidence not policy |
| `ops/osctl/validation/VALIDATION_SUMMARY.md` | Regenerable evidence | Same |
| `ops/osctl/validation/HASH_REGISTRY.md` | Fingerprint record | Append-only after path lock; may be stale pre-LR-2 |
| `ops/osctl/validation/DETERMINISM_REPORT.md` | Regenerable evidence | Same |
| `ops/osctl/validation/scenarios/**/events.jsonl` | Fixture inputs | Stage as validation fixtures |
| `ops/osctl/ledger/events.jsonl` | Duplicate of H1 ledger (today) | **Demote to fixture** after LR-2; do not stage alongside `ops/state/ledger/events.jsonl` |
| `ops/__pycache__/` | Bytecode cache | **Never stage** |

---

# 6. Never-stage files

Per H6 Option A (`HUMAN_SIGNOFF_PACKAGE.md` §4 H6) and `PYCACHE_AND_ARTIFACT_POLICY.md`:

| Path / pattern | Reason |
|----------------|--------|
| `git add .` | Mixed workspace; encodes dual authority |
| `git add ops/` / `git add -A` | Mass staging — ~203 files; artifacts and duplicates |
| `docker-compose.yml` | Runtime — wrong track on OSCTL branch |
| `backend/**` | Product code |
| `__pycache__/`, `*.pyc`, `*.pyo` | Non-deterministic bytecode (`ops/__pycache__/` **exists on disk**) |
| `ops/osctl/examples/**/projections/*.generated.md` | Rehearsal artifacts only |
| `ops/osctl/ledger/events.jsonl` **when** `ops/state/ledger/events.jsonl` is staged | Dual ledger authority (H1 violation) |
| `ops/osctl/projections/*.generated.md` **when** `ops/state/projections/*.md` staged as co-equal truth | Dual projection authority (H2 violation) |
| Root status MDs without H3 banners | False authority — **banners now applied**; still stage on separate track |
| Unreviewed manual projection copies | Drift risk — `ops/state/projections/CURRENT_STATUS.md` hash ≠ kernel output |
| `.env`, secrets, tokens, `.claude/settings*.json` | Security / local IDE |
| `ops/osctl/archive/**` (if created pre-H5) | Archive policy not yet executed |

---

# 7. Safe anchoring sequence

Human operator executes. Agents **must not** stage or commit. Order preserves domain separation and replay safety.

| Step | Action | Prerequisite | Outcome |
|------|--------|--------------|---------|
| **Step 1** | **Pre-flight verify** — run `git status --short`, `git diff --name-only`, confirm `docker-compose.yml` clean, confirm no `backend/**` dirty paths, confirm `ops/__pycache__/` not staged | Immediate | Workspace confirmed OSCTL-prep eligible |
| **Step 2** | **Create OSCTL-only branch** — e.g. `git checkout -b osctl/governance-application` from `ca6f1e5` | Step 1 | Backend branch preserved; OSCTL work isolated |
| **Step 3** | **Remove pycache from disk** (optional hygiene) — delete `ops/__pycache__/` before any staging | Step 2 | Eliminates accidental bytecode staging |
| **Step 4** | **Stage package foundation** — `ops/__init__.py`, `ops/osctl/__init__.py` | Step 3 | Import path stable |
| **Step 5** | **Stage canonical governance docs** — 15-file set + `NON_GOALS.md` + `ops/osctl/README.md` | Step 4 | Governance kernel documented in git |
| **Step 6** | **Stage scoped supplements** — `ops/osctl/snapshots/*.md` (spec only), `ops/osctl/ARCHITECTURE_DECISIONS.md` | Step 5 | Snapshot/ADR layer documented |
| **Step 7** | **Stage deterministic kernel** — `ops/osctl/core/**`, `ops/osctl/core/README.md` | Step 5 | Trust code anchored (pre-LR-2 defaults) |
| **Step 8** | **Stage validation layer** — `ops/osctl/validation/` **excluding** regenerating during staging; review evidence MDs as proof | Step 7 | Executable proof in tree |
| **Step 9** | **Stage snapshot scripts + fixtures** — `ops/osctl/snapshots/` (scripts, examples JSON, `__init__.py`) | Step 8 | Phase 3 layer anchored |
| **Step 10** | **Stage examples (fixtures only)** — `ops/osctl/examples/**` **excluding** `examples/**/projections/*.generated.md` | Step 8 | Rehearsal inputs without artifact pollution |
| **Step 11** | **Stage operational plane** — `ops/state/ledger/events.jsonl`, templates, checklists, `ops/state/README.md`; **defer** `ops/state/projections/*.md` until post-verify | Step 7 | H1 ledger anchored; H2 projections gated |
| **Step 12** | **Stage adjacent ops** — `ops/rituals/**`, `ops/simulations/**` | Step 11 | Playbooks separated from kernel |
| **Step 13** | **Review and stage `ops/state/GOVERNANCE.md`** — separate commit from `ops/osctl/GOVERNANCE.md` | Step 12 | Adjacent governance not merged with kernel |
| **Step 14** | **Update and stage `ops/README.md`** — fix stale "ledger not created yet" claim | Step 11 | Navigation matches H7 dual-plane |
| **Step 15** | **Stage root context (bannered)** — `AGENT_RULES.md`, `MASTER_CONTEXT.md`, `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` on **separate commit** from OSCTL kernel | Steps 5–12 | Root pointers anchored without authority escalation |
| **Step 16** | **Stage audit layer last** — `ops/osctl/audit/**` (includes this plan) | Steps 5–15 reflect final prep state | Observations describe anchored workspace |
| **Step 17** | **LR-2 (human-approved, separate gate)** — align `paths.py`, `render.py`, CLI vocabulary to H1/H2 | Steps 5–10 staged | Code defaults match operational plane |
| **Step 18** | **Regenerate + verify** — `python -m ops.osctl.core replay`, `python -m ops.osctl.core verify`, `python ops/osctl/validation/run_validation.py` (exit 0) | Step 17 | Projections match ledger; drift eliminated |
| **Step 19** | **Stage verified projections** — `ops/state/projections/CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` only after Step 18 pass | Step 18 | H2 truth plane git-consistent |
| **Step 20** | **Record explicit LR-1 approval** — `HUMAN_SIGNOFF_PACKAGE.md` §4 LR-1 gate | Step 19 | Human authorization for docs-only entrypoint |
| **Step 21** | **Execute LR-1** — Round 3 §6 actions 1–8 per `GOVERNANCE_OPERATIONALIZATION_VERDICT.md` | Step 20 | **Human only** — agents forbidden |

**Do not execute Steps 17–21 until Steps 1–16 complete and human approves each gate.**

**Do not skip Step 2** — anchoring on `fix/app-module-template-compile` mixes OSCTL history with backend compile-fix lineage.

---

# 8. Path-level staging strategy

## 8.1 Paths that may be staged first (lowest collision risk)

1. `ops/__init__.py`, `ops/osctl/__init__.py`
2. Canonical 15 + `NON_GOALS.md` + `ops/osctl/README.md`
3. `ops/osctl/core/**` (frozen kernel, pre-LR-2)
4. `ops/osctl/validation/run_validation.py` + `ops/osctl/validation/scenarios/**` + `ops/osctl/validation/README.md`
5. `ops/osctl/snapshots/**` (excluding any deploy hooks — none present)
6. `ops/osctl/examples/*.json`, `ops/osctl/examples/*/README.md`, `ops/osctl/examples/*/events.jsonl`, `ops/osctl/examples/run_rehearsals.py` — **not** example projections

## 8.2 Paths that must never be staged together

| Group A | Group B | Reason |
|---------|---------|--------|
| `ops/state/ledger/events.jsonl` | `ops/osctl/ledger/events.jsonl` | H1 single ledger authority |
| `ops/state/projections/*.md` | `ops/osctl/projections/*.generated.md` | H2 single projection authority |
| Any `ops/osctl/**` | `docker-compose.yml` | Runtime/governance mixing |
| Any `ops/**` | `backend/**` | Product/OSCTL mixing |
| `ops/osctl/GOVERNANCE.md` | `ops/state/GOVERNANCE.md` | Dual governance claims in one commit |
| OSCTL kernel docs | `ops/osctl/audit/**` | Observations must describe final boundary — audit last |
| Validation evidence MDs | Regenerated during staging by agent | Evidence must match reviewed tree |
| Example fixtures | `examples/**/projections/*.generated.md` | Fixtures vs artifacts |

## 8.3 Paths requiring separate review (separate commits recommended)

| Path | Review focus |
|------|--------------|
| `ops/osctl/core/ledger/paths.py` | LR-2 target — must align to `ops/state/ledger/` |
| `ops/osctl/core/projection/render.py` | LR-2 target — undecorated filenames under `ops/state/projections/` |
| `ops/state/projections/CURRENT_STATUS.md` | Hash mismatch vs kernel output — verify before stage |
| `ops/state/GOVERNANCE.md` | Adjacent vs kernel governance — cross-reference only |
| `ops/README.md` | Stale content — update before stage |
| `MASTER_CONTEXT.md` | Backend context trim — no OSCTL trust restatement |
| `ops/osctl/validation/HASH_REGISTRY.md` | May reflect pre-LR-2 paths |
| `ops/osctl/audit/**` (~60 files) | Commit last; includes backend isolation reports unrelated to kernel authority |
| History-tier docs (`SPEC_REFERENCE.md`, `IMPLEMENTATION_NOTES.md`, `ARCHITECTURE_FREEZE_CHECKLIST.md`, `CI_INTEGRATION_PLAN.md`) | Stage with awareness of H5 deferred archive |

## 8.4 Suggested commit domains (maps to `HUMAN_COMMIT_SEQUENCE.md`)

| Commit domain | Primary paths |
|---------------|---------------|
| Governance entrypoints | Canonical 15, README, root context (if in LR-1 scope) |
| Kernel + validation | `ops/osctl/core/**`, `ops/osctl/validation/**` |
| Operational plane | `ops/state/ledger/`, templates, checklists |
| Adjacent ops | `ops/rituals/`, `ops/simulations/`, updated `ops/README.md` |
| LR-2 reconciliation | `paths.py`, `render.py`, freeze-bump docs if required |
| Verified projections | `ops/state/projections/` post-verify only |
| Audit layer | `ops/osctl/audit/**` last |

---

# 9. Replay safety assessment

| Dimension | Status | Notes |
|-----------|--------|-------|
| Core replay engine determinism | **Sound** | `ops/osctl/core/replay/` unchanged; validation scenarios exist |
| Ledger immutability (I-001) | **At risk if dual-staged** | Bytes identical today; staging both paths encodes split-brain in git history |
| Projection determinism (I-003) | **Violated on disk** | `ops/state/projections/CURRENT_STATUS.md` ≠ `ops/osctl/projections/CURRENT_STATUS.generated.md` |
| Kernel default paths | **Misaligned with H1/H2** | `paths.py` → `ops/osctl/ledger/`; `render.py` → `*.generated.md` under `ops/osctl/projections/` |
| Replay affect of docker-compose | **None** | Compose not referenced by replay/validation |
| Replay affect of anchoring plan | **Neutral if staged correctly** | Git tracking alone does not mutate ledger |
| Post-anchor operator risk | **High without LR-2** | Operators/agents following code defaults append/replay against wrong plane |
| Validation re-run on candidate | **Not performed** | Required before any trust commit |
| Example projection artifacts | **Low risk if excluded** | 12 files — staging would not affect live replay but pollutes authority |

**Replay safety verdict:** **CONDITIONAL PASS** — kernel replay is deterministic, but anchoring commits are **unsafe for operational truth** until:

1. Only `ops/state/ledger/events.jsonl` is staged as live ledger (H1),
2. LR-2 aligns code defaults,
3. Regenerate + verify exit 0,
4. Only verified `ops/state/projections/*.md` staged as live projections (H2).

Anchoring governance docs and kernel code **without** operational projections is replay-safe. Anchoring **both** ledger paths or **both** projection surfaces is **replay-unsafe**.

---

# 10. Remaining LR-1 blockers

**LR-1 status: BLOCKED** (anchoring plan only — LR-1 execution not authorized)

LR-1 definition: Round 3 §6 actions 1–8 as docs-only governance entrypoint commit (`GOVERNANCE_OPERATIONALIZATION_VERDICT.md`).

| Gate | Status |
|------|--------|
| H1–H7 human approval | ✓ Approved 2026-05-24 |
| H3 root context banners/pointers | ✓ Applied |
| `docker-compose.yml` isolated | ✓ Clean working tree |
| H4 + H6 staging rules finalized | ✓ Approved (path-level allowlist) |
| Canonical authority frozen (H1 + H2 + H7) | ✓ Approved |
| **`ops/**` git-anchored** | ✗ **203 files untracked** |
| **OSCTL-only branch created** | ✗ Still on `fix/app-module-template-compile` |
| **`ops/README.md` stale content corrected** | ✗ Pending human edit |
| **Projection drift resolved** | ✗ `ops/state/projections/CURRENT_STATUS.md` hash mismatch |
| **LR-2 path alignment** (`paths.py`, `render.py`, CLI vocabulary) | ✗ Pending |
| **Regenerate + verify exit 0** on commit candidate | ✗ Not run |
| **Explicit human LR-1 approval** (`HUMAN_SIGNOFF_PACKAGE.md` §4 LR-1 gate) | ✗ Not granted |
| Round 3 §6 actions beyond initial anchoring (archive moves, freeze headers) | ✗ Deferred per H5 |

**H3 unblocked:** root context disposition gate — previously pending, now applied.

**Primary blockers for LR-1 (ordered):**

1. Create OSCTL-only branch (Step 2).
2. Path-level git anchoring of `ops/**` per §7–§8 (Steps 4–16).
3. LR-2 code alignment with H1/H2 (Step 17).
4. Regenerate, verify, validation exit 0 (Step 18).
5. Explicit human LR-1 approval recorded (Step 20).

**Agent forbidden actions (unchanged):** LR-1 execution, LR-2 execution, `git add .`, mass staging, ledger/projection edits, governance mutation, commits.

---

## Strict-mode compliance

| Constraint | Complied |
|------------|----------|
| Read-only inspection + single plan file | ✓ |
| No commits / staging / git add | ✓ |
| No LR-1 / LR-2 execution | ✓ |
| No ledger / projection / replay edits | ✓ |
| No runtime / backend / infrastructure mutations | ✓ |
| No new governance topology discovery | ✓ |
| H1–H7 frozen topology respected | ✓ |

---

**Workspace anchoring plan complete.** Human operator owns branch creation, path-level staging, LR-2 approval, validation re-run, LR-1 approval gate, and all commits.
