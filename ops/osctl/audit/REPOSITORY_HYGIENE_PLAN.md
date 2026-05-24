# OSCTL Repository Hygiene Plan

**Agent:** Repository Hygiene Agent  
**Mode:** Planning only — no git mutations  
**Audit baseline:** NO-GO (2026-05-24)  
**Goal:** Safe path to git anchoring, trust reproducibility, and clean workspace boundaries

---

## Current State Summary

| Finding | Severity |
|---------|----------|
| `MASTER_CONTEXT.md` untracked | Critical |
| `ops/osctl/` fully untracked | Critical |
| Unrelated modified/untracked paths | High |
| `__pycache__` under `ops/osctl/` | Medium |
| Mixed product + trust layer in one working tree | High |

---

## Cleanup Order

Execute in this sequence **before any staging** (human operator; not automated):

| Step | Action | Scope |
|------|--------|-------|
| C1 | Inventory working tree | `git status --short` full repo |
| C2 | Remove Python bytecode caches | `ops/osctl/**/__pycache__/`, `*.pyc` |
| C3 | Confirm no `.env`, credentials, tokens in untracked paths | repo-wide scan |
| C4 | Separate generated projections at repo root | `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` — classify: OSCTL-derived vs stray |
| C5 | Document unrelated backend/docker changes | isolate before trust commits |
| C6 | Re-run validation in clean sandbox copy | optional parity check |
| C7 | Verify `ops/osctl/snapshots/scripts/` still read-only | no writer additions |

**Rule:** Cleanup **never** deletes ledger content or validation evidence without human sign-off.

---

## Isolation Order

| Phase | Isolate | Method |
|-------|---------|--------|
| I1 | Trust layer | Treat `ops/osctl/` + root `MASTER_CONTEXT.md` as one logical unit |
| I2 | Product layer | `backend/`, `docker-compose.yml` as separate concern |
| I3 | Agent docs | `AGENT_RULES.md` — classify: commit with governance or separate |
| I4 | Stray projections | Root `CURRENT_STATUS.md` / `DEPLOYMENT_STATE.md` vs `ops/osctl/projections/` |

Use git stash or worktree **only after** human review — not in planning phase.

---

## Tracking Order

First paths to enter version control (see `GIT_ANCHORING_PLAN.md`):

1. `ops/osctl/core/` — trust kernel
2. `ops/osctl/validation/` — evidence layer
3. `ops/osctl/snapshots/` — Phase 3 read-only layer
4. Root `MASTER_CONTEXT.md` — governance anchor
5. Remaining `ops/osctl/` docs, examples, ledger fixtures (non-secret)
6. **Not** in same commit: backend, docker, unrelated root MDs

---

## Staging Boundaries

| Boundary | May stage together | Must not stage together |
|----------|-------------------|-------------------------|
| Trust kernel | `core/`, `validation/`, frozen specs | `backend/` |
| Evidence | validation MDs + scenarios | product code |
| Snapshots | `snapshots/` docs + scripts + examples | deploy configs |
| Governance | `MASTER_CONTEXT.md` OSCTL section + `ops/osctl/*.md` | `package.json` |
| Product | `backend/`, `docker-compose.yml` | `ops/osctl/ledger/events.jsonl` without review |

**Partial staging:** Prefer `git add -p` or path-specific adds — never `git add .` in mixed state.

---

## Safe Commit Boundaries

A commit is **safe** when:

- Single authority domain (trust OR product OR docs-only)
- No `__pycache__` or build artifacts
- No secrets or env files
- Commit message states scope (e.g. `ops(osctl): anchor validated trust kernel`)
- Preceded by `python ops/osctl/validation/run_validation.py` pass (trust commits)

---

## Forbidden Mixed Commits

| Pattern | Why forbidden |
|---------|---------------|
| `ops/osctl/` + `backend/` in one commit | Blurs trust vs product authority |
| Trust kernel + `docker-compose.yml` | Infra coupling |
| Validation evidence + unrelated feature work | Breaks audit trail |
| `MASTER_CONTEXT.md` + backend module | Governance mixed with runtime |
| Snapshot scripts + CI workflow edits | Phase boundary violation |
| Ledger append + code refactor | History vs implementation conflation |

---

## Success Criteria

Hygiene plan complete when `CLEAN_STATE_REQUIREMENTS.md` checklist passes and `FINAL_HYGIENE_VERDICT.md` reaches GO or CONDITIONAL GO.

See also: `WORKSPACE_ISOLATION_PLAN.md`, `SAFE_COMMIT_STRATEGY.md`, `PYCACHE_AND_ARTIFACT_POLICY.md`.
