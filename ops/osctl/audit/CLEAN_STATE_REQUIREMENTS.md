# OSCTL Clean State Requirements

**Purpose:** Gate criteria before future phases and before audit GO  
**Mode:** Planning only — checklist for human operator

---

## Requirements Before Future Phases (Phase 4+)

| ID | Requirement | Verify |
|----|-------------|--------|
| P4-1 | `ops/osctl/core/` tracked in git | `git ls-files ops/osctl/core` non-empty |
| P4-2 | `ops/osctl/validation/` tracked | evidence paths in git |
| P4-3 | Validation suite passes on clean checkout | `run_validation.py` → 19/19 |
| P4-4 | `MASTER_CONTEXT.md` tracked at repo root | `git ls-files MASTER_CONTEXT.md` |
| P4-5 | No unrelated dirty paths in trust commits | `git status` clean or isolated branch |
| P4-6 | Snapshot examples verify | `verify_snapshot.py` on valid; corrupt fails |
| P4-7 | Hygiene verdict GO or CONDITIONAL GO | `audit/FINAL_HYGIENE_VERDICT.md` |
| P4-8 | External head-hash anchoring assigned to human | documented in operator log |

---

## Requirements Before Audit GO

| ID | Requirement | Current (2026-05-24) |
|----|-------------|----------------------|
| G1 | `MASTER_CONTEXT.md` tracked | **FAIL** — untracked |
| G2 | `ops/osctl/` tracked | **FAIL** — fully untracked |
| G3 | Zero `__pycache__` in `ops/osctl/` | **FAIL** — present |
| G4 | No mixed authority uncommitted state | **FAIL** — backend + ops + root MDs |
| G5 | Validation evidence matches anchored core | **UNKNOWN** — not in git |
| G6 | Duplicate governance files | **PASS** — single `MASTER_CONTEXT.md` |
| G7 | `MASTER_CONTEXT.md` at repo root | **PASS** — path correct |
| G8 | Strict-mode paths only in Phase 3 scope | **PARTIAL** — snapshots present; workspace mixed |

**Audit status:** **NO-GO** until G1–G5 pass.

---

## Required Git Cleanliness

| State | Allowed for GO |
|-------|----------------|
| `git status` clean after trust anchor commits | Required |
| Untracked `ops/osctl/` | Not allowed |
| Untracked root governance | Not allowed |
| Modified files outside active PR scope | Not allowed during anchor |
| Uncommitted validation evidence | Not allowed |

**Target:**

```text
git status --short
# (empty) on main after anchoring series
# OR only intentional in-progress product branch
```

---

## Required Artifact Cleanup

| Artifact | Action before anchor |
|----------|---------------------|
| `**/__pycache__/` | Delete |
| `*.pyc`, `*.pyo` | Delete |
| `.pytest_cache/` under ops | Delete if present |
| Stray root projections | Deduplicate vs `ops/osctl/projections/` |
| Temp sandbox paths | Out of repo — no action in repo |

---

## Required Tracking Guarantees

After anchoring, these must be reproducible from git alone:

| Guarantee | Test |
|-----------|------|
| Fresh clone → validation pass | clone + `run_validation.py` |
| Fresh clone → verify pass | clone + `python -m ops.osctl.core verify` |
| Committed HASH_REGISTRY matches runtime | compare fingerprints |
| No untracked trust kernel files | `git status ops/osctl` clean |
| Commit history separates trust vs product | `git log --oneline ops/osctl` review |

---

## Conditional GO Definition

**CONDITIONAL GO** permitted when:

- Trust layer fully tracked and validated
- Unrelated backend changes isolated on separate branch (not blocking)
- External head-hash anchoring scheduled with owner + date
- Hygiene plans committed under `ops/osctl/audit/`

**GO** requires additionally: clean workspace, no open blockers, audit G1–G8 all pass.
