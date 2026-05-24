# OSCTL Safe Stage Sequence

**Mode:** Human-only future staging plan  
**Agent action allowed now:** Documentation only  
**Forbidden now:** staging, commit, push, merge, deploy, CI mutation, backend edits

## Ground Rules

- Human operator performs all staging.
- Use path-specific `git add` commands only.
- Do not use `git add .` in a mixed workspace.
- Confirm `git status --short --untracked-files=all` before each stage.
- Confirm no `__pycache__` or `.pyc` files are present before each stage.
- Never stage OSCTL trust-layer files with backend, docker, package, CI, Railway, or Cloudflare changes.

## Exact Future Order

1. `MASTER_CONTEXT.md`

   Purpose: establish the repository-level governance anchor before trust-layer implementation details.

   Human-only staging candidate:

   ```text
   git add -- MASTER_CONTEXT.md
   ```

   Must not include:

   - `backend/`
   - `docker-compose.yml`
   - `package.json`
   - CI workflows
   - deploy configuration

2. OSCTL core

   Purpose: anchor deterministic trust-layer code and frozen OSCTL specification as a coherent unit.

   Human-only staging candidates:

   ```text
   git add -- ops/osctl/*.md
   git add -- ops/osctl/__init__.py
   git add -- ops/osctl/core
   ```

   Human review required before including:

   - `ops/osctl/ledger/`
   - generated projections
   - examples
   - audit files

3. Validation evidence

   Purpose: anchor deterministic proof material after the core has a stable git basis.

   Human-only staging candidate:

   ```text
   git add -- ops/osctl/validation
   ```

   Required precondition:

   - validation report and hash registry are reviewed as evidence, not regenerated during staging by an agent.

4. Snapshot layer

   Purpose: anchor read-only snapshot design, examples, and verification scripts after validation evidence.

   Human-only staging candidate:

   ```text
   git add -- ops/osctl/snapshots
   ```

   Must not include:

   - deploy execution hooks
   - CI mutation
   - backend integration

5. Coordination layer

   Purpose: anchor non-executing examples, ledger fixtures, derived projection fixtures, and coordination docs after core trust evidence is stable.

   Human-only staging candidates:

   ```text
   git add -- ops/osctl/examples
   git add -- ops/osctl/ledger
   git add -- ops/osctl/projections
   ```

   Human review required:

   - ledger event content
   - generated projection provenance
   - whether root `CURRENT_STATUS.md` and `DEPLOYMENT_STATE.md` belong outside this sequence

6. Audit layer

   Purpose: anchor cleanup, hygiene, and boundary reports last so they describe the final intended trust-layer boundary.

   Human-only staging candidate:

   ```text
   git add -- ops/osctl/audit
   ```

   Required precondition:

   - reports reflect the actual post-cleanup workspace state.

## Forbidden Mixed Commits

- `MASTER_CONTEXT.md` plus backend source changes.
- `ops/osctl/` plus `docker-compose.yml`.
- validation evidence plus product feature files.
- snapshot scripts plus CI workflow mutation.
- OSCTL audit files plus package/dependency changes.
- ledger or projection artifacts plus deploy configuration.

## Final Pre-Commit Human Check

Before any future commit:

```text
git status --short --untracked-files=all
git diff --cached --stat
git diff --cached --name-status
git ls-files --stage -- ops/osctl
```

Commit only when staged paths match exactly one sequence step and no forbidden path class is present.
