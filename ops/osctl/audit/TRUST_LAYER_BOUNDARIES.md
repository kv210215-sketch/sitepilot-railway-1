# OSCTL Trust Layer Boundaries

**Purpose:** Define what belongs to OSCTL and what must remain outside future trust-layer anchoring.  
**Authority:** Human owner decides final staging, commits, and merge readiness.  
**Strict mode:** OSCTL records and verifies operational truth; it does not deploy, orchestrate, or control infrastructure.

## Belongs to OSCTL

OSCTL-owned trust-layer material:

- frozen architecture and governance documents in `ops/osctl/*.md`
- deterministic implementation under `ops/osctl/core/`
- validation evidence under `ops/osctl/validation/`
- snapshot specifications, examples, and read-only verification scripts under `ops/osctl/snapshots/`
- OSCTL examples under `ops/osctl/examples/`
- OSCTL ledger fixtures under `ops/osctl/ledger/`
- OSCTL generated projection fixtures under `ops/osctl/projections/`
- audit and hygiene documentation under `ops/osctl/audit/`
- root `MASTER_CONTEXT.md` only as a reviewed governance anchor, not as product runtime code

OSCTL may describe operational events, replay rules, projections, verification, boundaries, and human approval requirements.

## Must Remain Outside OSCTL

Runtime and product implementation:

- `backend/`
- frontend application code
- database migrations unless explicitly part of product work
- notification/template features
- service modules and runtime dependency wiring

Infrastructure and deployment:

- `docker-compose.yml`
- Railway configuration and commands
- Cloudflare configuration and commands
- deployment scripts
- environment files and secrets
- CI workflow mutation

Repository dependency and build metadata:

- `package.json`
- lockfiles, unless explicitly reviewed for a non-OSCTL product task
- generated build outputs and bytecode caches

Adjacent operations content requiring separate human classification:

- `ops/state/`
- `ops/rituals/`
- `ops/simulations/`
- root `CURRENT_STATUS.md`
- root `DEPLOYMENT_STATE.md`
- `AGENT_RULES.md`

## Forbidden Mixed Commits

The following combinations are forbidden for OSCTL trust-layer anchoring:

- OSCTL files plus backend source files.
- OSCTL files plus `docker-compose.yml`.
- OSCTL files plus `package.json` or dependency lockfile changes.
- OSCTL files plus CI workflow edits.
- OSCTL files plus Railway or Cloudflare configuration.
- validation evidence plus unrelated product features.
- audit files plus deploy configuration.
- ledger/projection files plus runtime service changes.
- root governance files plus backend or infrastructure changes.

## Forbidden Backend Coupling

OSCTL must not:

- import backend modules.
- require backend runtime services.
- mutate backend application state.
- depend on notification, template, auth, database, or service wiring.
- treat backend deployment success as recorded truth without explicit ledger evidence.
- add backend hooks, jobs, processors, controllers, or module changes.

Backend may be observed as an external fact only after human-approved evidence is represented as ledger input.

## Forbidden Infrastructure Coupling

OSCTL must not:

- call Railway.
- call Cloudflare.
- run deploy commands.
- change infrastructure configuration.
- mutate CI workflows.
- create orchestration or automation that changes production state.
- write secrets or environment variables.
- convert verification failures into autonomous rollback or deploy actions.

OSCTL verification may produce a local pass/fail result. Any production decision remains human-owned.

## Boundary Verdict

Future trust-layer anchoring is safe only when staged changes are limited to one OSCTL boundary class at a time and no runtime, infrastructure, dependency, CI, Railway, Cloudflare, or backend coupling is present.
