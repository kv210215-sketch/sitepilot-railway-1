# OSCTL Snapshot Trust Boundaries

**Critical principle:** The snapshot is **NOT** the source of truth.

---

## Authority Model

```text
                    AUTHORITATIVE
                         │
                         ▼
              ┌─────────────────────┐
              │  append-only ledger  │
              │  events.jsonl        │
              └──────────┬──────────┘
                         │ deterministic replay
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    fold state    projections      fingerprint
         │               │               │
         └───────────────┴───────────────┘
                         │ optional export
                         ▼
              ┌─────────────────────┐
              │  snapshot (JSON)     │  ◄── DISPOSABLE
              └─────────────────────┘
```

---

## What Snapshots Are

| Property | Statement |
|----------|-----------|
| Role | Acceleration artifact for read-heavy workflows |
| Mutability | Immutable after write |
| Lifetime | Disposable; safe to delete if ledger retained |
| Trust | Conditional on verify + ledger compare at use time |

---

## What Snapshots Are Not

| Non-role | Reason |
|----------|--------|
| Source of truth | Ledger append order defines history |
| Deploy trigger | Would grant orchestration authority |
| Recovery master | Restore flows must replay ledger, not inject snapshot |
| CI gate input alone | CI must verify ledger/read-only projections |
| Secret store | Snapshots may embed projection text — not for credentials |

---

## Ledger Remains Authoritative

All operational facts enter via ledger append (human or approved CI ingest). Snapshots **never** append events.

If snapshot and ledger disagree:

```text
ledger replay  >  snapshot content
```

---

## Disposable Acceleration Artifacts

Operators may:

- Delete local snapshots after handoff
- Skip snapshot creation entirely
- Rely only on `verify` + `replay`

System must remain correct with **zero** snapshots present.

---

## Rebuilding Must Remain Deterministic

Rebuilding operational views:

```text
events.jsonl → verify → replay → projections
```

Must produce identical output for identical ledger bytes (validated in `ops/osctl/validation/`). Snapshots must not introduce alternate code paths that change fold/render semantics.

---

## VERIFY before ACT

| Step | Action | Authority |
|------|--------|-----------|
| 1 | `ops.osctl.core verify` | Trust kernel |
| 2 | `ops.osctl.core replay` | Trust kernel |
| 3 | Optional snapshot compare | Acceleration check only |
| 4 | Human decision | **Only human/approved CI for acts** |

Agents may read snapshots **after** steps 1–2; agents may **never** skip to step 4 from snapshot alone.

---

## Cross-References

- `ops/osctl/BOUNDARIES.md` — org-wide authority
- `ops/osctl/validation/TRUST_MODEL.md` — core guarantees
- `SNAPSHOT_SECURITY.md` — threat handling
