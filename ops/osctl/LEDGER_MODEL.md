# OSCTL Ledger Model

**Freeze ID:** `osctl-freeze/1.5`  
**Core spec:** `osctl-core/1.0`

---

## Canonical Store

The ledger is the **single machine-readable source of truth** for recorded operational history.

| Property | Value |
|----------|-------|
| Format | JSON Lines (`.jsonl`) |
| Path | `ops/state/ledger/events.jsonl` |
| Encoding | UTF-8 |
| Line ending | `\n` (LF) |
| Mutability | Append-only |

---

## Append Semantics

| Rule | Enforcement |
|------|-------------|
| One event per line | Writer emits single canonical line + `\n` |
| No in-place edit | No update/delete API in core |
| No reorder | Events consumed in file order |
| Seq assignment | Core assigns `next_seq = len(existing) + 1` on append |
| Spec version default | Core sets `osctl-core/1.0` if absent |
| Write mode | `O_APPEND` — no overwrite path |

---

## Sequence Contract

| Rule | Behavior |
|------|----------|
| First event | `seq: 1` |
| Monotonic | Each new event increments by 1 |
| No gaps on read | `read_events()` rejects `seq != index` |
| Corrections | New compensating event — never edit prior line |

---

## Read Semantics

| Condition | Result |
|-----------|--------|
| File missing | Empty event list |
| Blank lines | Skipped |
| Invalid JSON | `ValueError` with line number |
| Non-object event | `ValueError` |
| Seq gap | `ValueError` |

---

## Immutable Event Semantics

Once appended, an event line is **immutable fact**:

- Fields are not normalized retroactively
- Timestamps are caller-supplied and stored as-is (after validation)
- Projections re-derive all state from full replay

**Correction pattern:** append new event with updated facts; optionally reference prior seq in `refs`.

---

## Hash Chain (Deferred)

| Field | Status in `osctl-core/1.0` |
|-------|----------------------------|
| `prev_hash` | Not validated |
| `hash` | Not computed |

Tamper evidence is **not** guaranteed in Phase 1.5. Integrity relies on git history + verify replay.

---

## Single-Writer Policy

Core does not enforce file locking. Operational policy (ADR-007):

| Context | Rule |
|---------|------|
| Local human append | One writer at a time |
| CI append (Phase 2+) | One job per branch/env |
| Conflict on push | Human merges JSONL; re-seq repair procedure — never silent overwrite |

---

## Ledger vs Projections

| Store | Role |
|-------|------|
| `events.jsonl` | Canonical — append-only |
| `projections/*.md` | Derived — regenerate via `project` |

Manual projection edits create drift until `project` or revert.

---

## CLI

```bash
python -m ops.osctl.core append --file event.json
python -m ops.osctl.core project
python -m ops.osctl.core verify
```

Append validates schema before write. Invalid events never enter ledger.

---

## Related

- `EVENT_SCHEMA.md` — event shape
- `SERIALIZATION_RULES.md` — line format
- `REPLAY_GUARANTEES.md` — replay contract
