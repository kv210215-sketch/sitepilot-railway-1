# Replay Reconstruction Example

**Purpose:** Show how an operator rebuilds operational state from the **ledger** and compares it to a snapshot.  
**Rule:** Ledger replay is authoritative; snapshot is an acceleration artifact only.

---

## Inputs

| Artifact | Path |
|----------|------|
| Ledger | `ops/osctl/ledger/events.jsonl` (5 events) |
| Valid snapshot | `examples/valid-snapshot.json` |
| Stale snapshot | `examples/stale-snapshot.json` |

---

## Step 1 — Replay from ledger (authoritative)

```powershell
Set-Location <repo-root>
py -3.12 -m ops.osctl.core verify
py -3.12 -m ops.osctl.core replay
```

Expected:

```text
verify ok — 5 events, fingerprint 90178458ed000496df14a73fc76907094cdacfd27a4c65f75d4f1d3f7b2d6b52
replayed 5 events to ops/osctl/projections
fingerprint: 90178458ed000496df14a73fc76907094cdacfd27a4c65f75d4f1d3f7b2d6b52
```

Derived state at seq 5:

| Field | Value |
|-------|-------|
| `lifecycle_state` | `reconciled` |
| `last_seq` | `5` |
| `rollback_active` | `false` |
| `active_release_id` | `r20260523-51eb8b1` |

---

## Step 2 — Verify snapshot integrity (read-only)

```powershell
py -3.12 ops/osctl/snapshots/scripts/verify_snapshot.py ops/osctl/snapshots/examples/valid-snapshot.json
py -3.12 ops/osctl/snapshots/scripts/verify_snapshot.py ops/osctl/snapshots/examples/corrupted-snapshot.json
```

Expected:

| Snapshot | Result |
|----------|--------|
| `valid-snapshot.json` | `verify ok` |
| `corrupted-snapshot.json` | `FAIL: snapshot_hash mismatch` |

---

## Step 3 — Compare snapshot to ledger replay

```powershell
py -3.12 ops/osctl/snapshots/scripts/compare_snapshot.py `
  ops/osctl/snapshots/examples/valid-snapshot.json `
  --ledger ops/osctl/ledger/events.jsonl

py -3.12 ops/osctl/snapshots/scripts/compare_snapshot.py `
  ops/osctl/snapshots/examples/stale-snapshot.json `
  --ledger ops/osctl/ledger/events.jsonl
```

Expected:

| Snapshot | Result |
|----------|--------|
| Valid | `compare ok — no drift detected` |
| Stale | `DRIFT: ledger_seq mismatch`, `state.lifecycle_state mismatch`, etc. |

---

## Operator rule

```text
VERIFY before ACT
  1. verify ledger (ops.osctl.core verify)
  2. replay ledger (ops.osctl.core replay)
  3. optionally compare snapshot (compare_snapshot.py --ledger)
  4. human decision — never act on snapshot alone
```

Snapshots **must not** trigger deploys, rollbacks, or infra changes.
