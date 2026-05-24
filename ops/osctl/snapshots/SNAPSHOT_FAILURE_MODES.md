# OSCTL Snapshot Failure Modes

**Recovery principle:** Rebuild from ledger; never “restore” by mutating ledger from snapshot.

---

## Corruption

| Symptom | Detection | Recovery |
|---------|-----------|----------|
| Invalid JSON | `load_snapshot()` | Discard file; re-export from ledger replay |
| `snapshot_hash` mismatch | `verify_snapshot.py` | Treat as tampered; do not use; investigate source |
| Truncated file | JSON parse error | Discard; restore from archive if hash verified |

---

## Partial Writes

| Symptom | Detection | Recovery |
|---------|-----------|----------|
| Incomplete JSON | Parse error | Delete incomplete file; never append-fix |
| Missing `snapshot_hash` | `validate_structure()` | Discard |
| Zero-byte file | Read error | Discard |

**Prevention:** Write to temp file → verify hash → atomic rename (operator tooling only; not in Phase 3 scripts).

---

## Stale Snapshots

| Symptom | Detection | Recovery |
|---------|-----------|----------|
| `ledger_seq` < current length | `compare_snapshot.py --ledger` | Use for history only; replay ledger for current state |
| Old `created_at` | Human review | Re-export snapshot if handoff needed |

Example: `examples/stale-snapshot.json` (seq 3 vs ledger seq 5).

---

## Replay Divergence

| Symptom | Detection | Recovery |
|---------|-----------|----------|
| State field mismatch | `compare_snapshot.py` | Trust ledger replay; invalidate snapshot |
| Projection content mismatch | compare projection hashes | Regenerate via `ops.osctl.core replay` |
| Fingerprint mismatch | metadata vs replay | Discard snapshot for operational use |

---

## Hash Mismatch

| Symptom | Detection | Recovery |
|---------|-----------|----------|
| Recorded ≠ computed hash | `verify_snapshot.py` | Quarantine file (`examples/corrupted-snapshot.json`) |
| ledger_lines_hash drift | Manual check vs current ledger file | Snapshot captured different ledger bytes — discard |

---

## Operator Recovery Procedures

### Procedure A — Snapshot suspect

```text
1. python -m ops.osctl.core verify
2. python -m ops.osctl.core replay
3. python ops/osctl/snapshots/scripts/verify_snapshot.py <snap>
4. python ops/osctl/snapshots/scripts/compare_snapshot.py <snap> --ledger <ledger>
5. If any fail → do not act on snapshot
6. Human documents incident; optional re-export
```

### Procedure B — Lost snapshots only

```text
1. python -m ops.osctl.core verify
2. python -m ops.osctl.core replay
3. Operational state fully recoverable from ledger
```

### Procedure C — Ledger and snapshot disagree

```text
1. Ledger wins — always
2. Investigate snapshot provenance
3. Do not append “fix” events to match snapshot
4. Human decides if new ledger event needed to record reality
```

---

## Escalation

| Condition | Escalate to |
|-----------|-------------|
| Repeated hash failures | Human owner — possible tampering |
| Ledger verify fails | Stop ops; fix ledger per governance |
| Agent acted on stale snapshot | Human owner — process review |

**Forbidden:** Automated rollback/deploy triggered by snapshot failure detection.
