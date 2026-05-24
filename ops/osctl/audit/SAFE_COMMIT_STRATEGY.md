# OSCTL Safe Commit Strategy

**Mode:** Planning only — no commits, no staging  
**Principle:** Preserve trust boundaries and evidence chain in git history

---

## Commit Ordering

Follow `GIT_ANCHORING_PLAN.md` series:

1. Core + freeze docs  
2. Validation evidence  
3. Snapshots layer  
4. Examples + ledger fixture  
5. Audit/hygiene plans  
6. `MASTER_CONTEXT.md`  

Each commit should be ** independently revertible** without breaking Python import paths (commit 1 must include full `core/` tree).

---

## Forbidden Squash Patterns

| Pattern | Risk |
|---------|------|
| Squash all OSCTL into one commit | Loses evidence ordering |
| Squash validation into core without message | Auditors cannot tie proof to code |
| Interactive rebase dropping evidence commits | Breaks reproducibility narrative |
| `git commit --amend` after push | Rewrites shared history |
| Squash trust + product before merge | Mixed authority permanent in history |

**Allowed:** Squash only typo fixes **before push** on private anchor branch — human discretion.

---

## Trust-Boundary Commit Rules

| Rule | Detail |
|------|--------|
| TB-1 | One authority domain per commit |
| TB-2 | Commit message cites validation pass for trust commits |
| TB-3 | No `--no-verify` on trust commits |
| TB-4 | Ledger fixture changes require human reviewer |
| TB-5 | Snapshot script changes require read-only re-audit |
| TB-6 | Never commit with failing `run_validation.py` |

**Message template (trust commits):**

```text
ops(osctl): anchor validation evidence layer

Validation: 19/19 PASS (run_validation.py)
Fingerprints: see validation/HASH_REGISTRY.md
Scope: ops/osctl/validation only
```

---

## Evidence Preservation

| Evidence | Preservation |
|----------|--------------|
| `VALIDATION_REPORT.md` | Keep in git; do not overwrite without new run |
| `HASH_REGISTRY.md` | Append new section for new runs; avoid silent edits |
| Scenario fixtures | Immutable unless state machine change |
| Audit NO-GO record | Keep hygiene docs referencing baseline date |

**Do not** delete failed validation logs from operator archives — store outside repo if needed.

---

## Validation Evidence Retention

| Artifact | Retention |
|----------|-----------|
| In-repo validation MDs | Permanent for spec version |
| Sandbox logs | Operator archive 90 days |
| Cross-version fingerprint JSON | Regenerate on demand; optional commit |
| Pre-Phase-4 audit | This `audit/` package |

When re-validating after core change:

1. Re-run full isolation suite  
2. Update HASH_REGISTRY with new date section  
3. New commit — do not silently replace old fingerprints  

---

## Branch Strategy (Recommended)

| Branch | Purpose |
|--------|---------|
| `main` | Anchored trust + product (eventually) |
| `ops/osctl-anchor` | Staging trust commits only |
| `product/*` | Backend features isolated |

Merge `ops/osctl-anchor` → `main` via PR with validation CI (future, read-only).

---

## Rollback Strategy

If bad trust commit lands:

1. `git revert <commit>` — preferred over force push  
2. Re-run validation on reverted tree  
3. Document incident in operator log  
4. Do not revert ledger files on production systems — git only  

---

## Pre-Push Checklist

- [ ] `git diff --stat` matches intended scope  
- [ ] No backend paths in trust commit  
- [ ] No `__pycache__` staged  
- [ ] Validation passed on staged tree  
- [ ] MASTER_CONTEXT updated only in governance commit  
- [ ] Human approved ledger fixture if included  
