# OSCTL Repository Cleanup Report

**Mode:** Strict local repository hygiene only  
**Authority:** Human remains final authority  
**Baseline verdict:** NO-GO  
**Scope:** `ops/osctl/` cleanup and audit documentation only

## Removed Artifacts

Removed only Python cache artifacts under `ops/osctl/`.

Removed `__pycache__` directories:

- `ops/osctl/__pycache__/`
- `ops/osctl/core/__pycache__/`
- `ops/osctl/core/cli/__pycache__/`
- `ops/osctl/core/ledger/__pycache__/`
- `ops/osctl/core/project/__pycache__/`
- `ops/osctl/core/projection/__pycache__/`
- `ops/osctl/core/replay/__pycache__/`
- `ops/osctl/core/schema/__pycache__/`
- `ops/osctl/core/verify/__pycache__/`

Removed `.pyc` artifacts under those directories, including CPython 3.12 and 3.14 bytecode for:

- `__init__.py`
- `__main__.py`
- `main.py`
- `paths.py`
- `store.py`
- `fold.py`
- `render.py`
- `engine.py`
- `events.py`
- `serialize.py`
- `transitions.py`
- `reconcile.py`

No non-cache OSCTL source, validation, snapshot, ledger, or documentation files were removed.

## Remaining Dirty Paths

Tracked modifications outside OSCTL:

- `backend/src/app.module.ts`
- `docker-compose.yml`

Untracked governance and root context files:

- `MASTER_CONTEXT.md`
- `AGENT_RULES.md`
- `CURRENT_STATUS.md`
- `DEPLOYMENT_STATE.md`

Untracked OSCTL trust-layer paths:

- `ops/osctl/`

Untracked non-OSCTL operations paths:

- `ops/README.md`
- `ops/__init__.py`
- `ops/__pycache__/`
- `ops/rituals/`
- `ops/simulations/`
- `ops/state/`

Untracked backend paths remain present outside OSCTL scope:

- `backend/src/notifications/`
- `backend/src/templates/`

## Remaining Risks

- Workspace remains mixed: OSCTL trust-layer files coexist with backend, docker, root governance, and non-OSCTL operations changes.
- `ops/osctl/` is not git-anchored; `git ls-files -- ops/osctl` returns no tracked paths.
- Validation evidence under `ops/osctl/validation/` is untracked and therefore not yet reproducible from git history.
- `MASTER_CONTEXT.md` is untracked and cannot yet serve as a stable governance anchor.
- Backend and `docker-compose.yml` modifications must not be staged with OSCTL trust-layer files.
- `ops/__pycache__/` remains outside OSCTL scope and should be handled by a separate human-approved cleanup if desired.

## Isolated Trust-Layer Paths

Allowed OSCTL trust-layer paths for future human-only staging:

- `MASTER_CONTEXT.md`
- `ops/osctl/*.md`
- `ops/osctl/__init__.py`
- `ops/osctl/core/`
- `ops/osctl/validation/`
- `ops/osctl/snapshots/`
- `ops/osctl/examples/`
- `ops/osctl/ledger/`
- `ops/osctl/projections/`
- `ops/osctl/audit/`

Must remain outside OSCTL trust-layer commits:

- `backend/`
- `docker-compose.yml`
- `package.json`
- CI workflow files
- Railway configuration
- Cloudflare configuration
- secrets, `.env`, credentials, and deployment-only state

## Cleanup Verdict

OSCTL cache cleanup is complete. Repository cleanliness remains NO-GO until unrelated modifications are isolated and OSCTL governance, core, validation evidence, snapshots, coordination, and audit layers are intentionally tracked by a human.
