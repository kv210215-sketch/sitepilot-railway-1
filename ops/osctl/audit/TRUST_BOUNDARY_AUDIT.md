# OSCTL Trust Boundary Audit

**Date:** 2026-05-24  
**Mode:** Read-only strict audit  
**Principle:** Ledger authoritative · Snapshots disposable · VERIFY before ACT

---

## Trust Boundary Model (Expected)

```text
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL (untrusted for OSCTL record)                       │
│  Railway · Cloudflare · GitHub Actions · live HTTP · agents  │
└───────────────────────────┬─────────────────────────────────┘
                            │ human/CI approved append only
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  TRUST KERNEL — ops/osctl/core/                              │
│  ledger read → fold → render → verify (pure, local FS)       │
└───────────────────────────┬─────────────────────────────────┘
                            │ derived read
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PROJECTIONS — derived MD (non-authoritative for append)     │
└───────────────────────────┬─────────────────────────────────┘
                            │ optional acceleration
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  SNAPSHOTS — sealed exports (non-authoritative)              │
└─────────────────────────────────────────────────────────────┘
```

---

## Boundary Compliance by Zone

### Zone A: OSCTL Core (`ops/osctl/core/`)

| Check | Result | Evidence |
|-------|--------|----------|
| No network I/O in fold/render | PASS | `REPLAY_GUARANTEES.md`, validation isolation report |
| No Railway/Cloudflare imports | PASS | Grep + `validation/VALIDATION_SUMMARY.md` |
| No backend module imports | PASS | Python imports limited to stdlib + internal packages |
| Append-only ledger API | PASS | `store.py` uses `O_APPEND` |
| CLI commands local-only | PASS | `append`, `replay`, `verify` — no deploy subcommand |
| Actor authorization enforcement | N/A (deferred) | Documented in `NON_GOALS.md` |

**Verdict:** Trust kernel boundaries **INTACT**.

---

### Zone B: Validation (`ops/osctl/validation/`)

| Check | Result | Evidence |
|-------|--------|----------|
| Sandboxed execution | PASS | Temp git repo + robocopy |
| No production writes | PASS | `VALIDATION_REPORT.md` |
| Evidence not git-anchored | FAIL (process) | Untracked — trust chain broken at repo level |

**Verdict:** Validation **methodology** sound; **evidence anchoring** missing.

---

### Zone C: Snapshots (`ops/osctl/snapshots/`)

| Check | Result | Evidence |
|-------|--------|----------|
| Read-only verify/compare scripts | PASS | `scripts/verify_snapshot.py`, `compare_snapshot.py` |
| No snapshot writer in core CLI | PASS | `PHASE3_FINAL_REVIEW.md` |
| No deploy trigger fields | PASS | `SNAPSHOT_TRUST_BOUNDARIES.md`, `CAPABILITY_MATRIX.md` |
| Agent authority map forbids escalation | PASS | `AGENT_AUTHORITY_MAP.md` |

**Verdict:** Snapshot layer **within trust boundary design**.

---

### Zone D: Hidden Authority Paths (CRITICAL FINDINGS)

Paths that can bypass ledger verify and grant de facto operational truth to agents or humans:

| Path | Authority claimed | Ledger-derived? | Risk |
|------|-------------------|-----------------|------|
| Root `CURRENT_STATUS.md` | Agent read-first (`AGENT_RULES.md` L8) | **No** — manual, 2026-05-02 | **HIGH** |
| Root `DEPLOYMENT_STATE.md` | Agent read-first | **No** — manual legacy | **HIGH** |
| `ops/state/projections/CURRENT_STATUS.md` | OSCTL projection header | **Yes** (seq 5) | LOW if verify-first |
| `ops/osctl/projections/` | Fixture / default CLI output | Mixed | MEDIUM — wrong default path vs freeze |
| `MASTER_CONTEXT.md` | Top-level context | Partial OSCTL section | MEDIUM — backend + OSCTL mixed |
| `BUILD_STATUS.md`, `RAILWAY_DEPLOY.md` | Referenced by root CURRENT_STATUS | External docs | MEDIUM — stale deploy narrative |
| Snapshot JSON examples | Acceleration only | Derived at export time | LOW if compare_snapshot used |

**Primary hidden authority:** `AGENT_RULES.md` instructs agents to read root `CURRENT_STATUS.md` and `DEPLOYMENT_STATE.md` **before** `MASTER_CONTEXT.md`, with no requirement to run `osctl verify`. Root CURRENT_STATUS describes deploy from **2026-05-02**; ledger projection describes **seq 5 reconciled state (2026-05-25 narrative)**.

**Trust boundary violation class:** **Read-path bypass** — not orchestration, but agents may act on stale manual docs.

---

### Zone E: Backend / Infrastructure Isolation

| Check | Result | Evidence |
|-------|--------|----------|
| OSCTL modifies backend | NO | Strict mode; no backend edits in audit |
| OSCTL in AppModule | NO | Backend changes are notifications/templates — separate workstream |
| docker-compose changes | Present | Modified — **mixed workspace**, not OSCTL coupling |
| CI workflow mutation | NO | No changes detected in audit scope |

**Verdict:** OSCTL **does not couple** to backend runtime. Workspace **mixes** product and ops changes.

---

### Zone F: Agent Authority Crossings

From `AGENT_AUTHORITY_MAP.md` and observed docs:

| Crossing | Status |
|----------|--------|
| Snapshot → Deploy | FORBIDDEN — not implemented |
| Validator → Ledger auto-fix | FORBIDDEN — not implemented |
| CI → Silent append | FORBIDDEN — planning only |
| Agent → Root MD as truth | **DE FACTO ALLOWED** via `AGENT_RULES.md` — **BOUNDARY GAP** |
| Architect → Infra hooks | FORBIDDEN — not implemented |

---

### Zone G: Duplicate Trust Surfaces

| Surface A | Surface B | Conflict |
|-----------|-----------|----------|
| `ops/osctl/ledger/events.jsonl` | `ops/state/ledger/events.jsonl` | Same content today; diverge on next append |
| `ops/osctl/TRUST_MODEL.md` | `ops/osctl/validation/TRUST_MODEL.md` | Overlapping content; validation copy uses `project` command |
| `ops/osctl/GOVERNANCE.md` | `ops/state/GOVERNANCE.md` | Overlapping role model; different phase framing |

---

## Trust Boundary Scorecard

| Boundary | Status |
|----------|--------|
| Core purity (no external I/O) | PASS |
| No deploy orchestration in code | PASS |
| Snapshot non-authoritative | PASS (design) |
| Single ledger truth path | **FAIL** |
| Single projection read path for agents | **FAIL** |
| Agent read path requires verify | **FAIL** |
| Git-anchored trust chain | **FAIL** |
| External head-hash anchoring | **NOT DONE** (human) |

---

## Required Boundary Repairs (Human)

1. **Agent read contract:** Update `AGENT_RULES.md` to require `verify` exit 0 before trusting projections; demote root legacy MDs.
2. **Canonical path lock:** One ledger path, one projection path — documented in freeze and enforced in `paths.py`.
3. **Remove duplicate ledgers:** Keep fixture copy only under `examples/` or `validation/scenarios/`, not two production-class paths.
4. **Governance precedence:** Declare order: `ARCHITECTURE_FREEZE.md` > `GOVERNANCE.md` > `ops/state/GOVERNANCE.md` (adjacent) > `MASTER_CONTEXT.md` (summary).
5. **External anchor:** Schedule head-hash recording per `VALIDATION_SUMMARY.md`.

---

## Trust Boundary Verdict

**Runtime trust kernel:** **PASS** — boundaries hold in code.  
**Operational trust chain:** **FAIL** — untracked artifacts, duplicate paths, agent read bypass.  
**Overall:** **NO-GO** for production reliance until hidden authority paths are closed.
