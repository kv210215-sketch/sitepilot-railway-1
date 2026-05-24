# OSCTL Git Anchoring Plan

**Mode:** Planning only — no commits, no staging, no push  
**Purpose:** Define commit order so trust layer is reproducible and auditable

---

## Anchoring Principles

1. **Ledger authority first in documentation, not first in commit** — code + validation before ledger fixtures
2. **Evidence follows code** — validation MDs commit with or immediately after core
3. **Governance follows evidence** — `MASTER_CONTEXT.md` references validated paths
4. **Snapshots last among OSCTL** — Phase 3 depends on validated core
5. **External head-hash anchoring remains human** — outside git or in signed release notes

---

## What Must Be Committed First

| Order | Path | Rationale |
|-------|------|-----------|
| **A1** | `ops/osctl/core/` | Trust kernel — append, replay, verify, schema |
| **A2** | Frozen spec docs at `ops/osctl/` root | `FREEZE_v1.md`, `BOUNDARIES.md`, `STATE_MACHINE.md`, etc. |
| **A3** | `ops/osctl/validation/` | Evidence + `run_validation.py` + scenarios |
| **A4** | `ops/osctl/snapshots/` | Phase 3 read-only layer |
| **A5** | `ops/osctl/examples/` | Rehearsal fixtures (no secrets) |
| **A6** | `ops/osctl/audit/` | Hygiene plans (this package) |
| **A7** | `ops/osctl/ledger/events.jsonl` | Bundled fixture ledger — **human review** for prod-like data |
| **A8** | `ops/osctl/projections/*.generated.md` | Derived artifacts — optional; regenerable via replay |
| **G1** | `MASTER_CONTEXT.md` (repo root) | Governance anchor — after OSCTL paths exist in tree |

---

## Trust Anchor Ordering

```text
core (deterministic code)
  → validation (proof)
    → snapshots (acceleration, read-only)
      → MASTER_CONTEXT (human-facing map)
        → external head-hash (human, out-of-band)
```

Each layer must pass its verification gate before anchoring the next.

---

## Governance File Ordering

| Priority | Files |
|----------|-------|
| 1 | `ops/osctl/BOUNDARIES.md`, `GOVERNANCE.md`, `HUMAN_BOUNDARIES.md` |
| 2 | `ops/osctl/validation/TRUST_MODEL.md`, `VALIDATION_SUMMARY.md` |
| 3 | `ops/osctl/snapshots/SNAPSHOT_TRUST_BOUNDARIES.md` |
| 4 | `MASTER_CONTEXT.md` — OSCTL Snapshot Layer Status section |
| 5 | `ops/osctl/audit/FINAL_HYGIENE_VERDICT.md` — post-stabilization |

---

## Validation Evidence Ordering

Commit together or in immediate sequence:

1. `validation/run_validation.py`
2. `validation/scenarios/**`
3. `VALIDATION_REPORT.md`, `VALIDATION_MATRIX.md`, `HASH_REGISTRY.md`, `VALIDATION_SUMMARY.md`
4. Supporting: `DETERMINISM_REPORT.md`, `REPLAY_TESTS.md`, `FAILURE_CASES.md`

**Do not** commit evidence without the core version it was generated against.

---

## Snapshot Layer Ordering

After validation evidence is anchored:

1. `snapshots/SNAPSHOT_*.md`, `STATE_MACHINE_BOUNDARIES.md`, etc.
2. `snapshots/scripts/*.py` (read-only)
3. `snapshots/examples/*.json` (fixtures)

Verify examples still pass `verify_snapshot.py` before commit.

---

## Recommended Commit Series (Minimal)

| Commit | Scope | Pre-commit gate |
|--------|-------|-----------------|
| 1 | `ops/osctl/core/` + root OSCTL freeze docs | `run_validation.py` |
| 2 | `ops/osctl/validation/` | `run_validation.py` |
| 3 | `ops/osctl/snapshots/` | `verify_snapshot.py` on examples |
| 4 | `ops/osctl/examples/` + ledger fixture + projections | `verify` + `replay` |
| 5 | `ops/osctl/audit/` | none (docs) |
| 6 | `MASTER_CONTEXT.md` | human review |

**Forbidden:** Single squashed commit mixing all six — destroys audit granularity.

---

## Post-Anchoring Verification

After each commit (human operator):

```powershell
git checkout <commit>
python ops/osctl/validation/run_validation.py
python -m ops.osctl.core verify
```

Tag optional: `osctl-trust-kernel-v1.0` on validation-pass commit — human decision only.
