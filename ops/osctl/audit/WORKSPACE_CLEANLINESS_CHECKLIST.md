# OSCTL Workspace Cleanliness Checklist

**Use before future OSCTL phases, staging, commits, PRs, or trust-layer anchoring.**  
**Authority:** Human operator completes and approves this checklist.

## Required Checks

- [ ] `git status --short --untracked-files=all` has been reviewed.
- [ ] Workspace is clean or all non-OSCTL changes are intentionally isolated.
- [ ] No `__pycache__/` directories exist under `ops/osctl/`.
- [ ] No `.pyc` files exist under `ops/osctl/`.
- [ ] No unrelated backend modifications are staged with OSCTL.
- [ ] No `docker-compose.yml` changes are staged with OSCTL.
- [ ] No `package.json` or lockfile changes are staged with OSCTL.
- [ ] No CI workflow changes are staged with OSCTL.
- [ ] No Railway or Cloudflare files are staged with OSCTL.
- [ ] No secrets, credentials, `.env` files, or generated runtime artifacts are staged.
- [ ] Trust-layer paths are isolated to `MASTER_CONTEXT.md` and reviewed `ops/osctl/` paths.
- [ ] Governance files are tracked deliberately and in the correct order.
- [ ] Validation evidence under `ops/osctl/validation/` is tracked deliberately.
- [ ] Snapshot layer under `ops/osctl/snapshots/` is tracked separately from runtime/infrastructure changes.
- [ ] Audit layer under `ops/osctl/audit/` reflects actual repository state.

## Read-Only Verification Commands

Use these commands for inspection only:

```text
git status --short --untracked-files=all
git diff --stat
git diff --name-status
git ls-files -- ops/osctl
```

Use a duplicate governance scan before anchoring:

```text
review root MASTER_CONTEXT.md
review ops/osctl/GOVERNANCE.md
review ops/state/GOVERNANCE.md
confirm each file has distinct authority
```

## Cleanliness Verdict Rules

GO requires:

- no unrelated dirty paths,
- no OSCTL cache artifacts,
- OSCTL governance tracked,
- OSCTL core tracked,
- validation evidence tracked,
- staged paths limited to a single authority domain.

CONDITIONAL GO requires:

- unrelated dirty paths are present but fully isolated and unstaged,
- OSCTL cache artifacts are absent,
- human has approved exact path-scoped staging.

NO-GO applies when:

- backend, docker, infra, CI, package, or deploy files are mixed with OSCTL;
- `ops/osctl/` remains untracked and validation evidence is not git-anchored;
- `MASTER_CONTEXT.md` remains untracked;
- `__pycache__/` or `.pyc` files exist under `ops/osctl/`;
- evidence cannot be tied to git history.

## Current Baseline

Current baseline remains NO-GO because the workspace still contains unrelated backend/docker changes, untracked governance files, and untracked OSCTL trust-layer material.
