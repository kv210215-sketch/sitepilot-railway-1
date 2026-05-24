# Human Sign-Off Package

**Date:** 2026-05-24  
**Agent:** OSCTL Human Sign-Off Preparation Agent  
**Mode:** STRICT — read-only synthesis; single deliverable file  
**Repository:** `D:\Projects\SitePilot\sitepilot-railway`  
**Branch observed:** `fix/app-module-template-compile`  
**Authority of this document:** H1–H7 human sign-off recorded 2026-05-24 (Andriy Yuzich). Does not amend freeze, authorize staging, or execute LR-1 until LR-1 gate approved in §4.

**Evidence basis (closed chain — no further discovery):**

- `WORKSPACE_BLOCKER_CLASSIFICATION.md`
- `CANONICAL_GOVERNANCE_RESOLUTION.md`
- `HUMAN_GOVERNANCE_DECISION_MATRIX.md`

**Core principles:** SINGLE SOURCE OF TRUTH · DETERMINISTIC REPLAY · FROZEN GOVERNANCE KERNEL · HUMAN AUTHORITY FINAL

---

# 1. Executive Governance State

The OSCTL **trust kernel is sound**: append-only ledger semantics, pure replay/fold/render, verify layers, and validation (19/19 PASS at freeze) are implemented and frozen. Governance **topology is fragmented** — not because kernel semantics are wrong, but because **authority paths and read surfaces are unresolved**.

| Dimension | Verified state |
|-----------|----------------|
| Backend compile | **Clean** (`npx tsc --noEmit` exit 0) |
| Governance kernel (15-file set) | **Stable** — named in `CANONICAL_GOVERNANCE_MAP.md` §2 |
| Dual ledger | **Exists** — byte-identical today (SHA-256: `96F80F46257653E2962BEC9D939DDFEB5474ECB215E7F4325BC330C3EE2EC8B8`) |
| Projection divergence | **`CURRENT_STATUS` hash-mismatch** despite identical ledgers |
| Code vs freeze path declaration | **Conflict** — `paths.py` → `ops/osctl/`; `ARCHITECTURE_FREEZE` F-001/F-002 → `ops/state/` |
| Root context authority | **Unresolved** — four untracked root MDs compete with ledger-derived truth |
| Workspace | **Mixed** — modified `docker-compose.yml`, untracked `ops/**` (~197 files), root context on backend branch |
| **LR-1** | **BLOCKED** — pending H1–H7 human authority |

**Checkpoint purpose:** This package is the **final human governance checkpoint before canonical stabilization**. Agents may prepare artifacts; humans must approve every binding choice below.

---

# 2. Mandatory Human Decisions

Each decision requires explicit human sign-off. Recommended options reflect the closed governance chain; they are **not final until recorded in §4**.

---

## H1 — Canonical Ledger Authority

**Question:** Which physical path is the **sole append target** for production-class ledger events?

### Recommended Option

**Option A (Option L):** `ops/state/ledger/events.jsonl`

- Aligns with `ARCHITECTURE_FREEZE` F-001, `LEDGER_MODEL.md`, `GOVERNANCE.md`
- Operational truth plane separated from kernel package tree
- LR-2 updates `paths.py` only; no freeze bump required

### Alternative Options

| Option | Path | Summary |
|--------|------|---------|
| **B (Option O)** | `ops/osctl/ledger/events.jsonl` | Keeps ledger adjacent to kernel; requires F-001/F-002 amendment + freeze bump to `osctl-freeze/1.5.1` |
| **C (Dual ledger)** | Both paths as co-equal | **Reject** — violates ADR-001, P-001, P-003 |

### Consequences

| If A | If B | If C |
|------|------|------|
| Single append target; `ops/osctl/ledger/` demoted to validation fixture after LR-2 | Single path after `ops/state/ledger/` removed/archived; higher doc churn | Next append to one path only → irreconcilable replay inputs |
| Stage **one** ledger in anchor commit | Must not stage both ledgers | Anchor commit encodes two authorities — unreconcilable |

### Risks

| If A | If B | If C |
|------|------|------|
| Low — agents may append to wrong path until LR-2 completes | Medium — fixture/live confusion inside kernel tree | **Critical** — drift guaranteed on first divergent append |

### Determinism Impact

| If A | If B | If C |
|------|------|------|
| **Low** — one write path; verify gates drift | **Low** once single path enforced | **Critical** — split-brain undermines all verify guarantees |

### Replay Impact

| If A | If B | If C |
|------|------|------|
| **Positive** — replay input unambiguous; `FREEZE_v1` fixture demoted to validation-only | **Positive** after path collapse; validation fingerprint stays aligned with default | **Catastrophic** — two replay inputs diverge |

### Agent Coordination Impact

| If A | If B | If C |
|------|------|------|
| **Low** after LR-2 — CLI default matches freeze declaration | **Medium** — root docs and `ops/state/README.md` still describe state tree as operational home until rewritten | **Critical** — agents read/write arbitrary path |

---

## H2 — Projection Authority Model

**Question:** How are projections produced, named, stored, and trusted?

### Recommended Option

**Option A:** Generated-only at `ops/state/projections/` with undecorated names (`CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md`)

- Matches `PROJECTION_RULES.md` output paths
- LR-2 aligns `render.py` to drop `.generated.md` suffix for operational plane
- Projections always derived; `verify` compares on-disk bytes to replay fingerprint (I-011)

### Alternative Options

| Option | Summary |
|--------|---------|
| **B** | Generated-only at `ops/osctl/projections/*.generated.md` — matches `FREEZE_v1` snapshot and current `render.py`; requires amending `PROJECTION_RULES.md` or treating snapshot as authoritative |
| **C (Dual-mode)** | Manual mirror + generated — **Reject** — violates I-003; `CURRENT_STATUS` already hash-divergent |

### Consequences

| If A | If B | If C |
|------|------|------|
| Human reads verified projections after `replay` + `verify`; no manual deploy-fact edits | Operators look inside kernel tree for live status | Humans edit convenience copies; deploy facts become untrustworthy |
| Stage projections **only after** regenerate + verify pass | Stage `.generated.md` with ledger fixture; exclude manual state copies | High risk of staging stale manual copy as truth |

### Risks

| If A | If B | If C |
|------|------|------|
| Medium — filename alignment + CLI vocabulary cleanup in LR-2 | Medium — suffix helps but conflicts with freeze F-002 naming | **Critical** — verify may pass one surface while agents read another |

### Determinism Impact

| If A | If B | If C |
|------|------|------|
| **Low** — pure fold/render; verify catches manual edits | **Low** with verify | **High** — dual surfaces guarantee drift |

### Replay Impact

| If A | If B | If C |
|------|------|------|
| **Positive** — projections always derived from ledger | **Positive** if single surface enforced | **Negative** — already diverging (`CURRENT_STATUS` hash mismatch with identical ledger) |

### Agent Coordination Impact

| If A | If B | If C |
|------|------|------|
| **Low** after banners and `AGENT_RULES.md` update to require verify-first reads | **Medium** — path inside kernel tree awkward for ops | **Critical** — `AGENT_RULES.md` L8 directs agents to root manual files first |

---

## H3 — Root Context Authority Model

**Question:** What role do root MDs (`CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md`, `MASTER_CONTEXT.md`, `AGENT_RULES.md`) play relative to OSCTL truth?

### Recommended Option

**Option A:** Banner + pointer (legacy non-authoritative)

| File | Disposition |
|------|-------------|
| `CURRENT_STATUS.md` | **LEGACY / NON-AUTHORITATIVE** banner → pointer to verified `ops/state/projections/` |
| `DEPLOYMENT_STATE.md` | Banner → pointer; env catalog optional as reference supplement |
| `MASTER_CONTEXT.md` | **CANON** trimmed — backend-only; no trust-kernel restatement |
| `AGENT_RULES.md` | **CANON** at root + verify-first cross-ref to `HUMAN_BOUNDARIES.md` |

### Alternative Options

| Option | Summary |
|--------|---------|
| **B** | Archive root status MDs; retain backend context only (`MASTER_CONTEXT.md` + `AGENT_RULES.md`) |
| **C (Status quo)** | Root remains agent read-first authority — **Reject** — violates P-004; root manual summaries override ledger-derived reconciled state |

### Consequences

| If A | If B | If C |
|------|------|------|
| Root files stageable in LR-1 **only after** banners applied | Clean — no competing human summaries; operators lose quick root-level status | Staging root `CURRENT_STATUS.md` without banner **encodes false authority** in git |
| Separate commit domain from OSCTL kernel | Archive commit separate from OSCTL anchor | Deploy decisions based on pre-OSCTL docs |

### Risks

| If A | If B | If C |
|------|------|------|
| Medium until `AGENT_RULES.md` updated — today L8 says "Read first" root status without verify gate | Low after reference updates — risk during transition if old paths cached | **Critical** — two parallel operational narratives |

### Determinism Impact

| If A | If B | If C |
|------|------|------|
| **Low** if agents obey verify-first after banner pass | **Low** | **High** — human/manual vs machine/replay divergence |

### Replay Impact

| If A | If B | If C |
|------|------|------|
| **Positive** — no root file participates in replay input | **Positive** — clean; no competing human summaries | **Negative** — agents act on stale manual facts; replay output ignored |

### Agent Coordination Impact

| If A | If B | If C |
|------|------|------|
| **Medium** until read order updated; then **Low** | **Low** after reference updates | **Critical** — current `AGENT_RULES.md` behavior |

---

## H4 — Generated Artifact Policy

**Question:** Which generated bytes may be committed, regenerated, or excluded from git?

### Recommended Option

**Option A:** Strict generated-only taxonomy

| Class | Policy |
|-------|--------|
| Canonical data | Ledger + operational projections (after H1/H2 resolved) |
| Kernel fixtures | Validation/examples under explicit `--ledger` flags |
| Evidence | Validation reports — regenerate before commit |
| Never-stage | `__pycache__`, example projections, duplicates, secrets, local IDE config |

### Alternative Options

| Option | Summary |
|--------|---------|
| **B** | Commit all generated artifacts under `ops/osctl/` including `.generated.md` and validation reports — easier blind add; higher fixture/live collision risk |
| **C (Mixed)** | Manual projections + some generated — **Reject** — violates I-003; encodes current drift |

### Consequences

| If A | If B | If C |
|------|------|------|
| Operator runs `replay` + `verify` before trusting projection bytes | Extra commit churn on every validation run | Verify passes on one copy; humans edit another |
| Path-level review; exclude duplicate ledger after H1 | Stale evidence files accumulate | **Dangerous** — stages drift already observed on `CURRENT_STATUS` |

### Risks

| If A | If B | If C |
|------|------|------|
| Low with explicit never-stage list | Medium — agents may treat validation reports as policy | **Critical** |

### Determinism Impact

| If A | If B | If C |
|------|------|------|
| **Low** — `HASH_REGISTRY.md` updated only after path lock | **Medium** — committed hash registry may not match post-LR-2 paths | **High** |

### Replay Impact

| If A | If B | If C |
|------|------|------|
| **Positive** — only canonical ledger + projections participate in verify | **Neutral** — fingerprints must match regeneration or verify fails on clone | **Negative** — verify and human trust diverge |

### Agent Coordination Impact

| If A | If B | If C |
|------|------|------|
| **Low** with explicit never-stage list | **Medium** | **Critical** |

---

## H5 — Archive Boundary Policy

**Question:** When and how do non-canonical governance files leave the active surface?

### Recommended Option

**Option A:** Archive after LR-1 through LR-4 per `ARCHIVE_RECOMMENDATIONS.md`

- Initial anchor preserves full audit trail
- Archive moves reduce entropy after human applies reductions
- Commit 3 in `HUMAN_COMMIT_SEQUENCE.md` — separate archive commit after prerequisites
- SUPERSEDED banners required before draft moves

### Alternative Options

| Option | Summary |
|--------|---------|
| **B** | Archive before initial git anchor — smaller first commit; risk of archiving files still referenced by unstaged canonical set |
| **C** | Never archive; retain all audit files on active surface — violates Round 4 reduction intent; `audit/` exceeds entropy ceiling (57+ files) |

### Consequences

| If A | If B | If C |
|------|------|------|
| Active surface shrinks after LR-1–LR-4; git history retains all bytes | Cleaner first impression; may lose contextual audit files needed for decisions | Large first commit; mixes observations with canonical rules |
| Archive excluded from active navigation via `archive/README.md` | Ordering violations vs "after hygiene applied" gates | Unbounded audit growth |

### Risks

| If A | If B | If C |
|------|------|------|
| **Low** | **Medium** — premature archive hides decision evidence | **High** — audit files resemble binding governance |

### Determinism Impact

**None** — archive docs are not replay inputs (all options).

### Replay Impact

**None** — archive docs are not replay inputs (all options).

### Agent Coordination Impact

| If A | If B | If C |
|------|------|------|
| **Low** | **Medium** | **High** — navigation noise; duplicate trust claims |

---

## H6 — Never-Stage Policy

**Question:** Which paths are permanently forbidden from blind or mass staging?

### Recommended Option

**Option A:** Path-level allowlist staging (strict)

- Follow `SAFE_STAGE_SEQUENCE.md`, `HUMAN_COMMIT_SEQUENCE.md`, `PYCACHE_AND_ARTIFACT_POLICY.md` literally
- Enforce domain separation: OSCTL, backend, runtime, local IDE never mixed in one commit

**Never-stage inventory (applies regardless of option chosen):**

| Path / pattern | Reason |
|----------------|--------|
| `git add .` | Mixed workspace |
| `docker-compose.yml` | Runtime — wrong track on OSCTL branch |
| `backend/**` (except intentional backend branch) | Product code — not OSCTL |
| `__pycache__/`, `*.pyc`, `*.pyo` | Non-deterministic bytecode |
| `ops/osctl/examples/**/projections/*.generated.md` | Rehearsal artifacts only |
| Second ledger path (after H1) | Dual authority |
| Root status MDs without H3 disposition | False authority |
| `.claude/settings*.json` | Local IDE config |
| `.env`, secrets, tokens | Security |
| Unreviewed manual projection copies | Drift (CURRENT_STATUS already mismatched) |

### Alternative Options

| Option | Summary |
|--------|---------|
| **B** | Broad `git add ops/` with exclusion list — faster but relies on human remembering exclusions; **197 files** — high collision probability |
| **C** | `git add .` (mass staging) — **Reject** — destroys trust boundary |

### Consequences

| If A | If B | If C |
|------|------|------|
| Slower staging; **correct** for trust boundary | One mistake poisons anchor commit | Irreversible confusion in git history without revert |
| Git history stays auditable per domain | May require revert commits | Mixes compose + ops + root context + duplicates |

### Risks

| If A | If B | If C |
|------|------|------|
| **Low** | **High** | **Critical** |

### Determinism Impact

| If A | If B | If C |
|------|------|------|
| **Low** | **Medium** | **Critical** |

### Replay Impact

| If A | If B | If C |
|------|------|------|
| **Positive** — prevents duplicate ledger or stale projection entering git history | **Negative** — risk of staging example projections, duplicate ledger, pycache | **Catastrophic** — may commit two ledgers and divergent projections as co-equal |

### Agent Coordination Impact

| If A | If B | If C |
|------|------|------|
| **Low** — explicit forbidden list | **High** — wrong files become "canonical" in git | **Critical** |

---

## H7 — Operational vs Canonical Separation

**Question:** How are `ops/osctl/` (rules + kernel) and `ops/state/` (live operational plane) bounded?

### Recommended Option

**Option A:** Dual-plane model (rules + kernel vs operational state)

| Plane | Path | Role |
|-------|------|------|
| Canonical governance | `ops/osctl/` 15-file spec + `core/**` + validation fixtures | Frozen rules + deterministic kernel |
| Operational state | `ops/state/` ledger + generated projections + templates/checklists | Live truth plane |
| Adjacent ops | `ops/rituals/`, `ops/simulations/` | Operator playbooks; no OSCTL authority |

### Alternative Options

| Option | Summary |
|--------|---------|
| **B** | Single-plane collapse into `ops/osctl/` only — live ledger and projections inside kernel tree (Option O for H1/H2) |
| **C** | Single-plane collapse into `ops/state/` only including moving kernel — **Reject** — major freeze violation; out of scope for LR-1 |

### Consequences

| If A | If B | If C |
|------|------|------|
| Clear mental model: **change rules** in canonical 15 (with freeze bump); **change truth** via ledger append only | Simpler path list; higher accidental fixture/live merge risk | Massive diff — indistinguishable from governance rewrite |
| Separate commit domains per `HUMAN_COMMIT_SEQUENCE.md` | Requires freeze amendments | Import paths, packaging, validation layout all change |

### Risks

| If A | If B | If C |
|------|------|------|
| **Low** after `ops/state/GOVERNANCE.md` cross-refs clarified | **Medium** — fixture vs live confusion | **Critical** — freeze violation |

### Determinism Impact

| If A | If B | If C |
|------|------|------|
| **Low** | **Medium** | **High** during migration |

### Replay Impact

| If A | If B | If C |
|------|------|------|
| **Positive** — replay reads operational ledger; kernel code is pure function library | **Neutral** if paths unified; fixtures must not share directory with live append target | **Negative** — all paths change |

### Agent Coordination Impact

| If A | If B | If C |
|------|------|------|
| **Low** | **Medium** | **Critical** |

---

# 3. Recommended Governance Baseline

**This section presents the recommended baseline architecture ONLY. It does NOT finalize policy. Human sign-off required for every element.**

## Topology (Option L + dual-plane)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  CANONICAL GOVERNANCE (rules only) — ops/osctl/ 15-file kernel + README │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ defines contracts
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  DETERMINISTIC KERNEL — ops/osctl/core/**                               │
│  append · replay · verify · fold · render · serialize                   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ reads/writes (after LR-2: ops/state/)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  OPERATIONAL STATE (live truth plane) — ops/state/                      │
│  ledger/events.jsonl          ← sole append target (H1)                 │
│  projections/CURRENT_STATUS.md, DEPLOYMENT_STATE.md  ← generated only   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ human reads; agents read after verify
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ADJACENT OPS — ops/rituals · ops/simulations · templates/checklists    │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ separate from recorded truth
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ROOT CONTEXT — NOT ledger truth                                        │
│  MASTER_CONTEXT.md · AGENT_RULES.md · legacy status MDs (bannered)      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Recommended decision summary

| ID | Recommended |
|----|-------------|
| **H1** | `ops/state/ledger/events.jsonl` — demote `ops/osctl/ledger/` to fixture after LR-2 |
| **H2** | Generated-only at `ops/state/projections/` (undecorated names) |
| **H3** | Banner + pointer for root status MDs; trim `MASTER_CONTEXT.md`; verify-first in `AGENT_RULES.md` |
| **H4** | Strict generated-only artifact taxonomy |
| **H5** | Archive after LR-1–LR-4 per `ARCHIVE_RECOMMENDATIONS.md` |
| **H6** | Path-level allowlist staging only |
| **H7** | Dual-plane model — `ops/osctl/` rules+kernel; `ops/state/` live truth |

## Explicit non-recommendation

**Do not select Option C** for H1, H2, H3, H4, H6, or H7. Dual-authority and dual-mode paths are dangerous and already manifesting drift.

---

# 4. Explicit Human Approval Block

Record operator name, date, and chosen option (A/B/C) in operator log when signing.

## H1 — Canonical Ledger Authority

| APPROVED | REJECTED | DEFERRED |
|:--------:|:--------:|:--------:|
| [x] | [ ] | [ ] |

**If approved, chosen option:** A  
**Canonical ledger authority:** `ops/state/ledger/events.jsonl`  
**Operator:** Andriy Yuzich **Date:** 2026-05-24

## H2 — Projection Authority Model

| APPROVED | REJECTED | DEFERRED |
|:--------:|:--------:|:--------:|
| [x] | [ ] | [ ] |

**If approved, chosen option:** A  
**Projection authority:** generated-only under `ops/state/projections/`  
**Operator:** Andriy Yuzich **Date:** 2026-05-24

## H3 — Root Context Authority Model

| APPROVED | REJECTED | DEFERRED |
|:--------:|:--------:|:--------:|
| [x] | [ ] | [ ] |

**If approved, chosen option:** A  
**Disposition:** Root `CURRENT_STATUS.md` and `DEPLOYMENT_STATE.md` are legacy banner/pointer files, not authority. `MASTER_CONTEXT.md` remains operational/backend context, not OSCTL governance kernel.  
**Operator:** Andriy Yuzich **Date:** 2026-05-24

## H4 — Generated Artifact Policy

| APPROVED | REJECTED | DEFERRED |
|:--------:|:--------:|:--------:|
| [x] | [ ] | [ ] |

**If approved, chosen option:** A  
**Policy:** Strict generated artifact taxonomy.  
**Operator:** Andriy Yuzich **Date:** 2026-05-24

## H5 — Archive Boundary Policy

| APPROVED | REJECTED | DEFERRED |
|:--------:|:--------:|:--------:|
| [x] | [ ] | [ ] |

**If approved, chosen option:** A  
**Policy:** Archive actions deferred until after LR-1–LR-4.  
**Operator:** Andriy Yuzich **Date:** 2026-05-24

## H6 — Never-Stage Policy

| APPROVED | REJECTED | DEFERRED |
|:--------:|:--------:|:--------:|
| [x] | [ ] | [ ] |

**If approved, chosen option:** A  
**Policy:** Path-level allowlist staging only. No `git add .` and no mass staging.  
**Operator:** Andriy Yuzich **Date:** 2026-05-24

## H7 — Operational vs Canonical Separation

| APPROVED | REJECTED | DEFERRED |
|:--------:|:--------:|:--------:|
| [x] | [ ] | [ ] |

**If approved, chosen option:** A  
**Dual-plane separation:** `ops/osctl/` = governance kernel / rules / validation; `ops/state/` = operational state / live truth.  
**Operator:** Andriy Yuzich **Date:** 2026-05-24

## LR-1 Explicit Approval (separate gate — after Steps 1–11 in §6)

| APPROVED | REJECTED | DEFERRED |
|:--------:|:--------:|:--------:|
| [ ] | [ ] | [ ] |

**Operator:** _______________ **Date:** _______________

---

# 5. LR-1 Gate Status

**LR-1: BLOCKED**

LR-1 is defined as Round 3 §6 actions 1–8 as a docs-only governance entrypoint commit (`GOVERNANCE_OPERATIONALIZATION_VERDICT.md`).

## LR-1 CANNOT START until:

| Gate | Status |
|------|--------|
| **H1–H7 approved** (not deferred, not rejected without alternative resolution) | ✓ Approved 2026-05-24 (Andriy Yuzich; §4) |
| **`docker-compose.yml` isolated** (restore or stash; not in OSCTL workspace) | ✗ Modified |
| **Staging rules finalized** (H4 + H6 adopted; path-level allowlist defined) | ✓ Approved (H4 + H6 Option A; §4) |
| **Canonical authority frozen** (H1 + H2 + H7 path/plane decisions recorded) | ✓ Approved (H1 + H2 + H7 Option A; §4) |

## Additional readiness gates (must pass before LR-1 execution)

| Gate | Status |
|------|--------|
| Backend compile clean | ✓ Pass |
| Backend dirty trees isolated | ✓ Stashed |
| Root context disposition applied (H3 banners/archive) | ✗ Pending |
| `ops/**` git-anchored with human path-level review | ✗ Untracked (~197 files) |
| Workspace OSCTL-only branch created | ✗ Mixed on backend branch |
| LR-2 path alignment complete (`paths.py`, `render.py`) | ✗ Pending (post H1/H2) |
| Regenerate + verify exit 0 | ✗ Not run on candidate |
| Explicit human LR-1 approval recorded (§4) | ✗ Not granted |

**Dependency chain:**

```text
H1 + H2 + H7 (path/plane decisions)
  → H4 + H6 (what to stage / never stage)
    → docker-compose.yml isolated
      → H3 (root banners)
        → OSCTL-only branch + path-level staging
          → LR-2 (code alignment)
            → regenerate + verify + validation re-run
              → human LR-1 approval (§4)
                → LR-1 execution
                  → H5 archive (after LR-1–LR-4)
```

---

# 6. Post-Approval Sequence

Execute in order. **Do not skip steps. Do not parallelize authority decisions with mass staging.**

| Step | Action | Prerequisite |
|------|--------|--------------|
| **1** | Isolate runtime — `git restore docker-compose.yml` *or* `git stash push -m "local-dev compose rewrite" -- docker-compose.yml` | Immediate (pre-decision hygiene) |
| **2** | Record H1 sign-off — ledger authority path | §4 H1 approved |
| **3** | Record H2 sign-off — projection model | §4 H2 approved |
| **4** | Record H7 sign-off — dual-plane confirmation | §4 H7 approved |
| **5** | Record H4 + H6 sign-off — artifact + never-stage policies | §4 H4, H6 approved |
| **6** | Create OSCTL-only branch (e.g. `osctl/governance-application`) | Steps 1–5 |
| **7** | Apply H3 disposition — root banners or archive; update `AGENT_RULES.md` verify-first | §4 H3 approved |
| **8** | Stage with path-level `git add` per `HUMAN_COMMIT_SEQUENCE.md` Commit 1–2 scope | H1–H7 approved; never `git add .` |
| **9** | LR-2 (separate human approval) — align `paths.py` + `render.py` with H1/H2 | Step 8 staged |
| **10** | Regenerate and verify — `python -m ops.osctl.core replay` + `python -m ops.osctl.core verify` + `python ops/osctl/validation/run_validation.py` | LR-2 complete; exit 0 required |
| **11** | Record explicit LR-1 approval in §4 | Step 10 pass |
| **12** | Execute LR-1 — docs-only governance entrypoint commit (Round 3 §6 actions 1–8) | Step 11 |
| **13** | Record H5 sign-off; execute archive moves after LR-1–LR-4 prerequisites | LR-1 complete; §4 H5 approved |

**Do not execute Step 12 before Steps 1–11.**

---

# 7. Forbidden Actions

The following are **explicitly forbidden** before H1–H7 approval, workspace isolation, and LR-1 human approval:

| Forbidden action | Reason |
|------------------|--------|
| **`git add .`** | Mixed workspace; encodes dual authority |
| **Mass staging** (`git add ops/`, `git add -A`) | ~197 files; artifacts, duplicates, pycache risk |
| **Replay rewrites** (edit historical ledger lines) | Violates I-001 append-only |
| **Dual-authority preservation** (staging both ledger paths) | P-003 process violation; guaranteed divergence |
| **Manual projection editing** (staging unverified manual copies) | I-003; drift already present on `CURRENT_STATUS` |
| **Governance mutation during LR-1** (semantic changes to canonical 15 without freeze bump) | Violates frozen kernel |
| **Runtime/governance mixing** (including `docker-compose.yml` in OSCTL commit) | Trust boundary violation |
| **LR-1 before H1–H7 resolution + workspace isolation** | Trust boundary violation |
| **Staging root status MDs as truth without H3 banners** | P-004 conflict |
| **Staging `ops/osctl/examples/**/projections/*.generated.md`** | Rehearsal artifacts |
| **Staging `__pycache__` / `*.pyc`** | Non-deterministic |
| **Agent-initiated commit, push, merge, stash pop, deploy** | Human authority final |
| **Choosing Option C for H1, H2, or H3** | Dangerous paths |
| **New governance audit rounds without human charter** | `CANONICAL_GOVERNANCE_MAP.md` §10 stop-rule |
| **Automatic policy finalization by agents** | This package is preparation only |

---

## Appendix A — Verified Byte Evidence

| Path | SHA-256 | Notes |
|------|---------|-------|
| `ops/osctl/ledger/events.jsonl` | `96F80F46257653E2962BEC9D939DDFEB5474ECB215E7F4325BC330C3EE2EC8B8` | 5 events |
| `ops/state/ledger/events.jsonl` | `96F80F46257653E2962BEC9D939DDFEB5474ECB215E7F4325BC330C3EE2EC8B8` | Byte-identical |
| `ops/osctl/projections/CURRENT_STATUS.generated.md` | `8114B3DABCEB187210ED40639917B4F29C5137BA86AA81C3FAF8624C577E5839` | CLI default output |
| `ops/state/projections/CURRENT_STATUS.md` | `C3F3397CA1F03EAE1CF6489618E578E25B071E020EF0373C2D9C9B9C722BA528` | **Hash mismatch** |
| `ops/osctl/projections/DEPLOYMENT_STATE.generated.md` | `2C70A98E30A4700873B34F5EF91099238E61D8AA5C94DCAD73062A21C32C8724` | Match |
| `ops/state/projections/DEPLOYMENT_STATE.md` | `2C70A98E30A4700873B34F5EF91099238E61D8AA5C94DCAD73062A21C32C8724` | Byte-identical |

---

## Appendix B — Strict-Mode Compliance

| Constraint | Complied |
|------------|----------|
| Read-only synthesis (no additional governance discovery) | ✓ |
| Single output file created | ✓ |
| No commits / git mutations | ✓ |
| No deploy / backend / compose edits | ✓ |
| Recommendations labeled; human confirmation required | ✓ |
| No automatic policy finalization | ✓ |

---

**Sign-off package preparation complete.** Human operator owns all H1–H7 approvals (§4), workspace isolation (Step 1), LR-1 approval gate (§5), and post-approval sequence execution (§6).
