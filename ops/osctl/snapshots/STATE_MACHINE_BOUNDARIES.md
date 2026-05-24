# OSCTL State Machine Boundaries (Snapshot Layer)

**Applies to:** Folded state in snapshots and ledger replay  
**Core spec:** `osctl-core/1.0` · `ops/osctl/STATE_MACHINE.md`

---

## Allowed Transitions

Lifecycle transitions allowed in **ledger replay** (same as core `ALLOWED` set):

| From | To |
|------|-----|
| `None` | `planned`, `staging`, `validating`, `production` |
| `planned` | `staging`, `validating`, `failed` |
| `staging` | `validating`, `failed` |
| `validating` | `promoted`, `failed` |
| `promoted` | `production`, `failed` |
| `production` | `rollback`, `archived`, `failed` |
| `failed` | `planned`, `reconciled`, `rollback` |
| `rollback` | `reconciled` |
| `reconciled` | `production`, `archived` |
| `archived` | `planned` |

Snapshots **record** resulting state; they do **not** perform transitions.

---

## Forbidden Transitions

Same forbidden set as core (e.g. `staging → production`, `rollback → production`).  
If snapshot `state.lifecycle_state` implies a forbidden path not supported by ledger events, snapshot is **invalid for trust** even if hash passes.

---

## Replay Invariants

| Invariant | Description |
|-----------|-------------|
| R1 | `state.last_seq` equals last processed event seq |
| R2 | `transition_errors` empty for trusted snapshots |
| R3 | `projection_fingerprint` matches replay at `metadata.ledger_seq` |
| R4 | Rollback pointers consistent with ledger rollback events |
| R5 | Open incidents ⊆ incidents derived from ledger |

Violation → reject snapshot for operational use; replay ledger.

---

## Snapshot Invariants

| Invariant | Description |
|-----------|-------------|
| S1 | `metadata.ledger_event_count == metadata.ledger_seq` for standard ledgers |
| S2 | `snapshot_hash` matches canonical payload |
| S3 | `spec_version == osctl-snapshot/1.0` |
| S4 | No fields outside schema in hash payload |
| S5 | Snapshot seq ≤ current ledger length (equality = current head) |

S5 equality required for “current head” handoffs; strict less-than = stale.

---

## Deterministic Replay Guarantees

Given identical ledger bytes `1..N`:

- `fold_events()` → identical `state`
- `replay()` → identical `projections`
- `replay_fingerprint()` → identical fingerprint
- Snapshot export at N → identical `snapshot_hash` (same exporter version + spec)

Validated under Python 3.11/3.12 in `ops/osctl/validation/`.

---

## Operator-Only Authority Zones

| Zone | Authority |
|------|-----------|
| Ledger append | Human owner / approved CI ingest |
| Snapshot export | Human operator |
| Snapshot delete/archive | Human operator |
| Trust decision after drift | Human operator |
| External head-hash anchor | Human operator |
| Infra deploy/rollback | Human owner (Railway dashboard etc.) |

**Forbidden:** Snapshot scripts or agents performing any zone above.

---

## Snapshot vs Ledger State Machine

```text
Ledger:  event append → transition validate → fold → state at head
Snapshot: freeze(state at seq N) — no transitions after freeze
```

Advancing state requires new ledger events, not snapshot edits.
