# Workspace Blocker Classification

**Date:** 2026-05-24  
**Agent:** Workspace Blocker Classification Agent  
**Mode:** STRICT — read-only classification; no staging, commits, or runtime mutations  
**Repository:** `D:\Projects\SitePilot\sitepilot-railway`  
**Branch observed:** `fix/app-module-template-compile`  
**Basis:** `git status --short`, `git diff docker-compose.yml`, tree inspection of `ops/**`, root context files, prior audit reports (`BACKEND_WORKSPACE_ISOLATION_EXECUTION_REPORT.md`, `CANONICAL_GOVERNANCE_MAP.md`, `GIT_TRACKING_STATUS.md`, `ARCHIVE_RECOMMENDATIONS.md`)

---

## 1. Executive Verdict

**CLASSIFIED WITH HUMAN DECISIONS**

All four remaining blockers are classifiable. None are ambiguous at the file-type level. Three blockers (`docker-compose.yml`, root context files, portions of `ops/**`) require explicit human authority before staging, restore, or LR-1 reconsideration. Backend compile isolation (prior session) is acknowledged complete; it is not re-litigated here.

| Blocker | Top-level classification |
|---------|--------------------------|
| `docker-compose.yml` (modified) | **NEEDS HUMAN DECISION** |
| `ops/**` (untracked, 197 files) | **Mixed** — see §3 |
| Root context files (4 untracked) | **NEEDS HUMAN DECISION** |
| OSCTL LR-1 | **BLOCKED** (downstream of above) |

---

## 2. docker-compose.yml Classification

### Summary of changes (working tree vs `HEAD`)

| Aspect | `HEAD` (tracked) | Working tree (modified) |
|--------|------------------|-------------------------|
| Scope | Full local stack: `backend`, `frontend`, `db`, `redis` | Infra-only: `postgres`, `redis`, `adminer`, `mailhog` |
| App containers | Backend + frontend built from repo Dockerfiles | **Removed** — host-run backend assumed |
| DB service name | `db` | `postgres` |
| Postgres image | `postgres:15-alpine` | `postgres:16-alpine` |
| DB credentials | `postgres` / `postgres` / `sitepilot` | `sitepilot` / `sitepilot123` / `sitepilot` |
| Healthchecks | DB only | DB + Redis |
| Dev tooling | None | Adminer (`8080`), Mailhog (`1025`/`8025`) |

The diff aligns with the “local dev infra only” model described in `MASTER_CONTEXT.md` §Local dev, but it is **not** what is currently committed on `HEAD`.

### Domain ownership

| Question | Answer |
|----------|--------|
| Belongs to backend/runtime? | **Yes** — local development infrastructure |
| Belongs to OSCTL? | **No** — must never enter OSCTL commit, ledger event, projection, or LR-1 step |
| Mixed-commit risk | **High** if staged alongside `ops/**` |

### Classification

**NEEDS HUMAN DECISION** (runtime track; isolation required before any OSCTL work)

### Recommendation

| Option | When | Action |
|--------|------|--------|
| **Restore** | If local-dev rewrite was exploratory or accidental | `git restore docker-compose.yml` on backend branch |
| **Stash** | If rewrite is intentional but not ready to commit | `git stash push -m "local-dev compose rewrite" -- docker-compose.yml` |
| **Branch** | If rewrite is intentional and should ship | Commit on a dedicated backend/dev-infra branch only — never on `osctl/governance-application` |

**Do not** include `docker-compose.yml` in LR-1 or any OSCTL anchoring commit.

### Human decision required

- **Yes.** Operator must choose restore vs stash vs dedicated backend branch before LR-1 workspace can be considered OSCTL-only.

---

## 3. ops/** Classification

**State:** Entire `ops/` tree is **untracked** (`git ls-files -- ops` → empty). **197 files** present on disk.

### 3.1 Canonical OSCTL candidates — **CANON**

Stage only after deliberate human review; not blind `git add ops/`.

| Path | Role |
|------|------|
| `ops/osctl/core/**` | Frozen Python kernel (`cli`, `ledger`, `projection`, `replay`, `schema`, `verify`) |
| `ops/osctl/README.md` | Navigation entrypoint (no authority) |
| **15 canonical governance files** (per `CANONICAL_GOVERNANCE_MAP.md` §2): `ARCHITECTURE_FREEZE.md`, `FREEZE_v1.md`, `EVENT_SCHEMA.md`, `STATE_MACHINE.md`, `LEDGER_MODEL.md`, `PROJECTION_RULES.md`, `REPLAY_GUARANTEES.md`, `VERIFY_MODEL.md`, `SERIALIZATION_RULES.md`, `ROLLBACK_POLICY.md`, `DRIFT_DETECTION.md`, `GOVERNANCE.md`, `BOUNDARIES.md`, `HUMAN_BOUNDARIES.md`, `TRUST_MODEL.md` | Spec + governance kernel |
| `ops/osctl/NON_GOALS.md` | Negative-scope companion (referenced by canonical set) |
| `ops/osctl/snapshots/**` (spec + scripts + fixture JSON) | Scoped snapshot layer |
| `ops/osctl/validation/run_validation.py` | Executable proof |
| `ops/osctl/validation/scenarios/**` | Validation fixtures |
| `ops/osctl/examples/**` (JSON payloads, READMEs, rehearsal scripts — **excluding** example projections; see §3.3) | Deterministic rehearsal fixtures |
| `ops/osctl/ledger/events.jsonl` | **Canonical ledger** per `FREEZE_v1.md` (5 events) |

### 3.2 Audit / report candidates — **CANON** (audit layer) / **ARCHIVE** (post-execution)

| Path | Classification | Notes |
|------|----------------|-------|
| `ops/osctl/audit/**` (all `.md` reports) | **CANON** (as dated observations) | Non-authoritative; includes this report |
| Hygiene one-shots per `ARCHIVE_RECOMMENDATIONS.md` §4 | **ARCHIVE** (after hygiene applied) | e.g. `REPOSITORY_HYGIENE_PLAN.md`, `GIT_TRACKING_STATUS.md`, `WORKSPACE_ISOLATION_PLAN.md` |
| Consolidation plans per `ARCHIVE_RECOMMENDATIONS.md` §5 | **ARCHIVE** (after LR actions applied) | e.g. `GOVERNANCE_DEDUPLICATION_PLAN.md`, `TRUST_SIMPLIFICATION_PLAN.md` |
| Draft specs per `ARCHIVE_RECOMMENDATIONS.md` §3 | **ARCHIVE** (with SUPERSEDED banner first) | `SPEC_REFERENCE.md`, `ARCHITECTURE_FREEZE_CHECKLIST.md`, `IMPLEMENTATION_NOTES.md` |
| Frozen verdicts (`FINAL_*_VERDICT.md`, `CONSOLIDATION_FINAL_VERDICT.md`, etc.) | **CANON** (frozen in place) | Do not archive until freeze policy says so |

Backend isolation reports (`BACKEND_*`, `TEMPLATE_SYSTEM_AUDIT.md`, etc.) are **CANON** as audit evidence for the current session; they are **not** OSCTL kernel authority.

### 3.3 Generated / artifact candidates — **IGNORE** (for initial staging) or regenerate

| Path | Classification | Rule |
|------|----------------|------|
| `ops/osctl/projections/*.generated.md` | Regenerable artifact | May stage **with** canonical ledger after `replay` verification; never edit by hand for truth |
| `ops/osctl/examples/**/projections/*.generated.md` (12 files) | **IGNORE** | Example rehearsal outputs — exclude from anchoring commit |
| `ops/osctl/validation/VALIDATION_REPORT.md`, `VALIDATION_SUMMARY.md`, `HASH_REGISTRY.md`, `DETERMINISM_REPORT.md` | Regenerable evidence | Re-run `run_validation.py` before commit; do not treat as policy |
| `ops/__pycache__/` (if present) | **IGNORE** | Never stage |
| Duplicate ledger copies in validation/examples | **IGNORE** for anchoring | Fixture-only unless explicitly promoted |

### 3.4 Adjacent operations (not OSCTL canonical) — **CANON** (ops layer) / **NEEDS HUMAN DECISION**

| Path | Classification | Notes |
|------|----------------|-------|
| `ops/rituals/**` | **CANON** (operator playbooks) | Not OSCTL trust kernel |
| `ops/simulations/**` | **CANON** (training narratives) | Not OSCTL trust kernel |
| `ops/state/*.template.md`, checklists, `STATE_TRANSITIONS.md` | **CANON** (templates) | Human-operated until projections replace them |
| `ops/state/GOVERNANCE.md` | **NEEDS HUMAN DECISION** | Adjacent governance; must not silently merge with `ops/osctl/GOVERNANCE.md` |
| `ops/state/ledger/events.jsonl` | **NEEDS HUMAN DECISION** | **Byte-identical** to `ops/osctl/ledger/events.jsonl` — dual-path duplication |
| `ops/state/projections/CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` | **NEEDS HUMAN DECISION** | Manual copies mirroring OSCTL projection format; not `.generated.md` suffix |
| `ops/README.md` | **NEEDS HUMAN DECISION** | Stale (claims ledger “not created yet”); update or **ARCHIVE** after anchoring |
| `ops/__init__.py` | **CANON** | Package marker for `python -m ops.osctl.core` |

### 3.5 Should-not-stage-blindly list

1. `ops/state/ledger/events.jsonl` — duplicate canonical path; pick one authority before staging both  
2. `ops/state/projections/*.md` — manual projection copies; risk of drift from `ops/osctl/projections/*.generated.md`  
3. `ops/osctl/examples/**/projections/*.generated.md` — rehearsal artifacts only  
4. `ops/__pycache__/**` — generated Python cache  
5. Any file under `ops/osctl/archive/` if created before archive policy is applied  
6. Backend isolation audit reports — stage separately from kernel if commit granularity matters  
7. Entire `ops/` via `git add ops/` — **forbidden** without path-level review

### 3.6 Human decision required list

| # | Decision | Options |
|---|----------|---------|
| H1 | Canonical ledger path | `ops/osctl/ledger/events.jsonl` only (per `FREEZE_v1`) vs retain `ops/state/ledger/` as mirror |
| H2 | Projection authority | OSCTL `.generated.md` only vs keep `ops/state/projections/` as human-readable mirror |
| H3 | Commit granularity | Single OSCTL anchor commit vs phased sequence per `HUMAN_COMMIT_SEQUENCE.md` |
| H4 | LR-2 path reconciliation | Explicit approval required before any path moves (`GOVERNANCE_OPERATIONALIZATION_VERDICT.md`) |
| H5 | Archive timing | Apply `ARCHIVE_RECOMMENDATIONS.md` moves before or after initial git anchor |
| H6 | Root context anchoring | Include in LR-1 scope vs defer vs banner-and-pointer only |

---

## 4. Root Context Classification

All four files are **untracked** at repository root. Per `CANONICAL_GOVERNANCE_MAP.md` §7, none are in the OSCTL canonical 15-file set. They overlap with `ops/state/` templates and `ops/osctl/projections/` — creating **dual source-of-truth risk**.

### AGENT_RULES.md

| Dimension | Classification |
|-----------|----------------|
| Primary role | **Agent policy** |
| Secondary | Operator discipline (backend scope, deploy isolation, forbidden actions) |
| OSCTL canonical? | No |
| Overlap | Partial overlap with `ops/osctl/HUMAN_BOUNDARIES.md` (automation zones) |
| **Verdict** | **NEEDS HUMAN DECISION** |

**Recommended disposition options:**

- **CANON** at root as agent-facing policy (if agents are instructed to read root first), with cross-reference to `HUMAN_BOUNDARIES.md`  
- **ARCHIVE** if superseded by OSCTL human-boundary docs after LR-1 banner pass  
- **IGNORE** for OSCTL anchoring commit (stage separately on agent-policy track)

### CURRENT_STATUS.md

| Dimension | Classification |
|-----------|----------------|
| Primary role | **Operational state** (legacy manual backend summary) |
| Content character | Hand-authored; cites `BUILD_STATUS.md`, `RAILWAY_DEPLOY.md`; dated 2026-05-02 deploy |
| Conflicts with | `ops/osctl/projections/CURRENT_STATUS.generated.md` (ledger-derived, seq 5, reconciled) |
| OSCTL canonical? | No — `CANONICAL_GOVERNANCE_MAP.md` §7 requires banner marking |
| **Verdict** | **NEEDS HUMAN DECISION** |

**Recommended disposition options:**

- Add **LEGACY / NON-AUTHORITATIVE** banner pointing to `ops/osctl/projections/CURRENT_STATUS.generated.md` → then **CANON** as historical context  
- **ARCHIVE** if operator adopts OSCTL projections as sole operational status  
- **IGNORE** for LR-1 (do not stage until banner decision applied)

### DEPLOYMENT_STATE.md

| Dimension | Classification |
|-----------|----------------|
| Primary role | **Deployment state** (legacy manual env/infra reference) |
| Content character | Hand-authored Railway env matrix, health expectations, startup sequence |
| Conflicts with | `ops/osctl/projections/DEPLOYMENT_STATE.generated.md` (ledger journal) |
| OSCTL canonical? | No |
| **Verdict** | **NEEDS HUMAN DECISION** |

**Recommended disposition options:**

- Banner as **reference supplement** (env var catalog is useful; state truth is ledger) → **CANON** with pointer  
- **ARCHIVE** if env catalog moves to `backend/.env.example` + OSCTL projection only  
- **IGNORE** for LR-1 until human chooses banner vs archive

### MASTER_CONTEXT.md

| Dimension | Classification |
|-----------|----------------|
| Primary role | **Canonical governance** (backend architecture summary) + partial deploy context |
| Content character | Comprehensive backend module map, stack, deployment model, env contract |
| OSCTL overlap | Mentions OSCTL adjacency; not OSCTL kernel authority |
| Round 3 guidance | Must be trimmed; restatement of trust claims forbidden (`CANONICAL_GOVERNANCE_MAP.md` §7) |
| **Verdict** | **NEEDS HUMAN DECISION** |

**Recommended disposition options:**

- **CANON** at root after trim (backend context entrypoint only; cite `ops/osctl/TRUST_MODEL.md` for trust claims)  
- Split: backend sections **CANON**, OSCTL sections **ARCHIVE** in favor of `ops/osctl/README.md`  
- **IGNORE** for blind staging — content review required before anchor

### Root context summary table

| File | agent policy | operational state | deployment state | canonical governance | archive | ignore | needs human decision |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `AGENT_RULES.md` | ✓ | | | | opt | opt | **✓** |
| `CURRENT_STATUS.md` | | ✓ | | | opt | opt | **✓** |
| `DEPLOYMENT_STATE.md` | | | ✓ | | opt | opt | **✓** |
| `MASTER_CONTEXT.md` | | | | ✓ (backend) | opt | opt | **✓** |

---

## 5. LR-1 Readiness Impact

**OSCTL LR-1 remains BLOCKED.**

| LR-1 readiness condition | Status |
|--------------------------|--------|
| Backend compile clean | ✓ Pass (`npx tsc --noEmit` exit 0; prior session) |
| Backend dirty trees isolated | ✓ Stashed (`templates`, `notifications`; `app.module.ts` at HEAD) |
| `docker-compose.yml` isolated from OSCTL workspace | ✗ Still modified |
| `ops/**` git-anchored with human staging decisions | ✗ Entire tree untracked |
| Root context files classified and disposition chosen | ✗ Classified here; human disposition pending |
| Workspace OSCTL-only or clean | ✗ Mixed: runtime compose + untracked ops + root context on backend branch |
| Explicit human approval to begin LR-1 | ✗ Not granted |
| Validation re-run on commit candidate | ✗ Not performed this session |

LR-1 (Round 3 §6 actions 1–8, docs-only governance entrypoint) cannot proceed until the human operator isolates `docker-compose.yml`, chooses root-context disposition, and stages `ops/**` on an OSCTL-only branch per `HUMAN_COMMIT_SEQUENCE.md`.

---

## 6. Safe Next Human Action

**Exactly one step:**

> **Isolate `docker-compose.yml` from the working tree** — run `git restore docker-compose.yml` *or* `git stash push -m "local-dev compose rewrite" -- docker-compose.yml` on the current branch — then re-run `git status --short` and confirm only `ops/**` and root context files remain as untracked blockers.

Rationale: compose is the last tracked runtime mutation on an otherwise compile-clean backend branch. Removing it is the smallest reversible action that separates runtime from OSCTL tracks without touching stashes, staging `ops/**`, or starting LR-1.

---

## 7. What NOT to Do

| Forbidden action | Reason |
|------------------|--------|
| `git add .` | Would mix runtime, OSCTL, and unreviewed duplicates |
| Mass staging `ops/**` | 197 files include artifacts, duplicate ledgers, stale README |
| Commit before classification disposition | Root context and dual-path ledgers unresolved |
| Start LR-1 | Workspace still mixed; trust boundary violation |
| Touch stashes (`stash@{0}`, `stash@{1}`) | Backend feature work preserved; out of scope |
| Deploy, Railway, Cloudflare, CI mutation | Strict-mode prohibition |
| Restore or commit `docker-compose.yml` inside OSCTL branch | Runtime artifact; wrong track |
| Edit OSCTL kernel beyond this report | Governance kernel frozen |

---

## 8. Strict-Mode Compliance Summary

| Constraint | Complied |
|------------|----------|
| Read-only classification only | ✓ |
| No deploy / Railway / Cloudflare / CI | ✓ |
| No package.json / backend / docker-compose edits | ✓ |
| No commits / push / merge / staging / stash / discard | ✓ |
| No OSCTL edits except this allowed report | ✓ |
| Single output file created | ✓ `ops/osctl/audit/WORKSPACE_BLOCKER_CLASSIFICATION.md` |
| VERIFY before ACT | ✓ Evidence gathered before classification |
| CLASSIFY before STAGE | ✓ Staging deferred pending human decisions |
| HUMAN AUTHORITY FINAL | ✓ All disposition choices deferred to operator |

---

**Classification complete.** Human operator owns next isolation step (§6).