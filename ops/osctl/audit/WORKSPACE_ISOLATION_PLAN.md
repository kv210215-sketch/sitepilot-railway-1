# OSCTL Workspace Isolation Plan

**Mode:** Planning only  
**Problem:** Mixed workspace — trust layer, product code, and stray artifacts coexist untracked/modified

---

## Isolation Goals

| Layer | Paths | Authority |
|-------|-------|-----------|
| Trust kernel | `ops/osctl/core/` | Deterministic replay; no infra |
| Evidence | `ops/osctl/validation/` | Proof artifacts |
| Snapshots | `ops/osctl/snapshots/` | Read-only acceleration |
| Governance | `MASTER_CONTEXT.md`, `ops/osctl/*.md` | Human-maintained |
| Product | `backend/`, `deploy/`, `docker-compose.yml` | Application runtime |
| Stray/generated | Root `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` | Classify before commit |

---

## Isolate Backend Changes

**Current dirty paths:**

- `M backend/src/app.module.ts`
- `?? backend/src/notifications/`
- `?? backend/src/templates/`

**Plan:**

| Step | Action |
|------|--------|
| B1 | Document intent of backend changes (feature vs experiment) |
| B2 | Do **not** stage backend files during OSCTL anchoring commits |
| B3 | Option A: separate branch `product/<feature>` for backend work |
| B4 | Option B: stash backend changes before OSCTL staging (`git stash push -p -- backend/`) — human only |
| B5 | Resume backend work only after trust layer anchored or on parallel branch |

**Rule:** Backend modules never appear in commits titled `ops(osctl): …`.

---

## Isolate ops/osctl

| Step | Action |
|------|--------|
| O1 | Treat entire `ops/osctl/` as atomic trust package for anchoring |
| O2 | Exclude `__pycache__` before any add (see artifact policy) |
| O3 | Review `ledger/events.jsonl` for sensitive refs before track |
| O4 | Keep `ops/osctl/projections/` — regenerable; commit optional |
| O5 | No edits to `ops/osctl/` during unrelated backend sessions without re-validation |

**Worktree option (human):**

```text
git worktree add ../sitepilot-osctl-anchor main
# anchor OSCTL only in worktree with clean product tree
```

Planning phase does not execute worktree commands.

---

## Avoid Mixed Authority Commits

| Anti-pattern | Correct separation |
|--------------|-------------------|
| OSCTL verify fix + NestJS module | Two commits, two PRs |
| MASTER_CONTEXT + app.module | Governance commit separate |
| Ledger fixture + docker-compose | Never combined |
| Snapshot scripts + Railway docs | Trust vs infra docs |

**Commit message lint (recommended):**

- `ops(osctl): …` — trust layer only
- `feat(backend): …` — product only
- `docs: …` — governance only if no code

---

## Separate Trust Layer from Product Layer

```text
┌─────────────────────────────────────┐
│  TRUST LAYER (ops/osctl/)           │
│  • append-only semantics            │
│  • zero network                     │
│  • validation evidence              │
│  • read-only snapshot scripts       │
└─────────────────────────────────────┘
           NO shared commits
┌─────────────────────────────────────┐
│  PRODUCT LAYER (backend/, deploy/)  │
│  • runtime API                      │
│  • Railway deploy config            │
│  • docker-compose                   │
└─────────────────────────────────────┘
```

Cross-reference allowed in **documentation only** (URLs, service names) — not in shared commits or coupled CI.

---

## Stray Root Artifacts

| File | Isolation action |
|------|------------------|
| `CURRENT_STATUS.md` (root) | Compare to `ops/osctl/projections/` — delete duplicate or gitignore |
| `DEPLOYMENT_STATE.md` (root) | Same |
| `AGENT_RULES.md` | Decide: repo governance (commit separately) or local-only |

Do not anchor stray copies before deduplication decision.

---

## Parallel Work Protocol

When two operators/agents work simultaneously:

1. Trust work only touches `ops/osctl/` + `MASTER_CONTEXT.md`
2. Product work only touches `backend/`, `deploy/`, docker
3. Merge via PR with separate review criteria
4. Re-run `run_validation.py` after any trust-layer merge
