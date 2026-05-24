# OSCTL Snapshot Security

**Principle:** VERIFY before ACT  
**Authority:** Ledger only

---

## Tamper Detection

| Layer | Mechanism |
|-------|-----------|
| Snapshot integrity | `snapshot_hash` over canonical payload |
| Ledger cross-check | `compare_snapshot.py --ledger` |
| Projection drift | Content hash per projection vs replay |
| Structural | `validate_structure()` in `snapshot_metadata.py` |

**Limitation (v1.0):** No Merkle chain on ledger lines. Snapshot tamper detection does not prove ledger history was unmodified before snapshot capture.

---

## Stale Snapshot Risks

| Risk | Description | Mitigation |
|------|-------------|------------|
| Head lag | Snapshot at seq N while ledger at N+k | Always compare `--ledger`; reject for action if seq differs |
| False confidence | Valid hash but outdated posture | Display `metadata.created_at` and `ledger_seq` prominently |
| Agent cache | Agent treats snapshot as live state | Require ledger verify before agent recommendations |

Stale snapshots are **safe for historical audit** if labeled stale; **unsafe for operational decisions**.

---

## Replay Mismatch Handling

When `compare_snapshot.py` reports drift:

1. **Stop** — do not act on snapshot
2. Run `python -m ops.osctl.core verify` on ledger
3. Run `python -m ops.osctl.core replay` to regenerate projections
4. Either discard snapshot or re-export from fresh replay (human operator)
5. Log mismatch for operator review

**Forbidden:** Auto-heal snapshot from ledger in Phase 3 scripts.

---

## Snapshot Poisoning Risks

| Attack | Vector | Defense |
|--------|--------|---------|
| Malicious export | Operator or compromised tool writes false state | Ledger compare; human approval on export |
| Partial injection | Mixed valid metadata + false state | Hash covers full payload |
| Replay confusion | Two snapshots same id different hash | Treat hash as identity; reject duplicates in action paths |
| Agent amplification | AI cites poisoned snapshot as truth | VERIFY before ACT; ledger replay mandatory |

---

## Trust Assumptions

| Assumed | Not assumed |
|---------|-------------|
| Core replay is deterministic (validated) | Snapshot creator is honest |
| SHA-256 collision resistance | Offline copy is latest |
| Operator runs verify before trust | Filesystem ACLs prevent unauthorized writes |
| Read-only scripts are not modified | Snapshots are distributed securely |

---

## Security Boundaries

```text
 TRUSTED FOR READ (after verify + compare)
 ┌─────────────────────────────────────┐
 │  snapshot_hash valid                 │
 │  ledger verify ok                    │
 │  compare_snapshot ok at head         │
 └─────────────────────────────────────┘

 NEVER TRUST FOR WRITE / ACT
 ┌─────────────────────────────────────┐
 │  snapshot alone                      │
 │  stale snapshot                      │
 │  corrupted snapshot                  │
 │  agent paraphrase of snapshot        │
 └─────────────────────────────────────┘
```

See `SNAPSHOT_TRUST_BOUNDARIES.md` and `FUTURE_RISKS.md`.
