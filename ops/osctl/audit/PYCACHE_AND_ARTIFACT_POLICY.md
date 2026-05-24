# OSCTL Pycache and Artifact Policy

**Mode:** Planning only  
**Scope:** `ops/osctl/` and repo-wide hygiene for trust reproducibility

---

## Forbidden Artifacts

Never track in git:

| Artifact | Pattern |
|----------|---------|
| Python bytecode | `__pycache__/`, `*.pyc`, `*.pyo` |
| pytest cache | `.pytest_cache/` |
| mypy cache | `.mypy_cache/` |
| Temp validation output | `isolation_results.json` in sandbox (not in repo) |
| Editor swap files | `*.swp`, `*~` |
| OS metadata | `.DS_Store`, `Thumbs.db` |
| Secrets | `.env`, `*.pem`, credentials JSON |
| Railway/Cloudflare tokens | any token file |

---

## Cleanup Requirements

Before any `git add` under `ops/osctl/`:

```powershell
# Human operator — planning documents this command; do not run in planning agent session if NO file ops
Get-ChildItem -Path ops/osctl -Recurse -Directory -Filter __pycache__ | Remove-Item -Recurse -Force
Get-ChildItem -Path ops/osctl -Recurse -Include *.pyc,*.pyo | Remove-Item -Force
```

Post-cleanup verification:

```powershell
Get-ChildItem -Path ops/osctl -Recurse -Directory -Filter __pycache__
# expect: zero results
```

---

## Deterministic Repo Hygiene

| Principle | Implementation |
|-----------|----------------|
| Source-only trust kernel | Commit `.py` and `.md` only under `ops/osctl/` |
| Regenerable outputs | Projections marked `.generated.md` — commit optional |
| Stable fixtures | `validation/scenarios/`, `snapshots/examples/` — commit intentional bytes |
| No runtime state in tree | No local ledger mutations without review |

Determinism test: two clean checkouts produce identical `run_validation.py` and fingerprint outputs.

---

## Generated-File Policy

| File type | Policy |
|-----------|--------|
| `*.generated.md` (projections) | May commit as reference; must regenerate identically from ledger |
| `validation/*_REPORT.md` | Commit as evidence snapshot with date |
| `snapshots/examples/*.json` | Commit as fixtures; hash verified |
| Sandbox logs (`run-py311.log`) | Do not commit |
| `isolation_validate.py` (sandbox) | Do not commit unless promoted to `validation/` |

**Labeling:** Generated files should remain identifiable by name or header comment.

---

## Recommended .gitignore Additions (Human PR — Not Applied in Planning)

Planning recommends future addition (separate commit):

```gitignore
# OSCTL runtime artifacts
ops/osctl/**/__pycache__/
**/*.pyc
.pytest_cache/
```

Also consider ignoring stray root copies if regenerable:

```gitignore
/CURRENT_STATUS.md
/DEPLOYMENT_STATE.md
```

Only if canonical copies live under `ops/osctl/projections/`.

---

## Pre-Commit Hygiene Checklist

- [ ] No `__pycache__` under `ops/osctl/`
- [ ] No secrets in `ledger/events.jsonl` or examples
- [ ] No sandbox temp paths committed
- [ ] Validation evidence dates match commit intent
- [ ] Snapshot example hashes verify

---

## Enforcement

| Stage | Check |
|-------|-------|
| Pre-stage | Human scan or script listing `__pycache__` |
| Pre-commit hook (future) | Optional; not in scope for planning |
| CI (future) | Read-only `run_validation.py`; no CI mutation in this phase |
