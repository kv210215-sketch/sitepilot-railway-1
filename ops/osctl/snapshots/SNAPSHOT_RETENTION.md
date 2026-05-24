# OSCTL Snapshot Retention

**Scope:** Policy for immutable snapshot artifacts  
**Authority:** Human operator — no automated deletion in Phase 3

---

## Retention Policy

| Tier | Duration | Contents |
|------|----------|----------|
| Hot | 30 days | Recent operator handoffs, incident snapshots |
| Warm | 12 months | Monthly audit exports, validation references |
| Cold | 7 years (or org policy) | Compliance archives, major incident bundles |
| Evidence | Permanent (git) | Example fixtures in `examples/` |

Retention clocks start at `metadata.created_at`, not file mtime.

---

## Archival Strategy

1. Verify snapshot (`verify_snapshot.py`)
2. Optional: compare to ledger at export time; record output in operator log
3. gzip compress per `SNAPSHOT_FORMAT.md` if storing offline
4. Store with sidecar: `snapshot_id`, `ledger_seq`, `snapshot_hash`, `projection_fingerprint`
5. Prefer **append-only archive** (new files only) — no overwrite

**Offline storage guidance:**

- Encrypted disk or object store with versioning enabled
- Separate from production deploy credentials
- Read-only mount for auditors
- Include ledger excerpt or full `events.jsonl` copy at same head for independent replay

---

## Pruning Policy

| Action | Allowed | Forbidden |
|--------|---------|-----------|
| Delete superseded hot snapshot after warm copy | Human operator | Automated cron |
| Remove local temp exports | Operator | CI job |
| Prune stale agent cache | Operator | Snapshot layer auto-prune |
| Git-tracked examples | Never delete without review | Silent removal |

**Rule:** Pruning snapshots **never** prunes the ledger.

---

## Forbidden Auto-Deletion

Phase 3 explicitly **forbids**:

- CI workflows that delete snapshots
- Self-healing retention jobs
- “Latest only” rotation without human sign-off
- Coupling snapshot lifecycle to deploy pipeline success/failure

---

## Supersession vs Deletion

When ledger advances past `metadata.ledger_seq`:

| Status | Action |
|--------|--------|
| Superseded | Mark stale; move to warm/cold archive |
| Invalid hash | Quarantine; keep for forensics |
| Duplicate id | Keep both if hashes differ; investigate |

Deletion requires explicit human decision documented in operator journal (outside OSCTL core).

---

## Ledger Retention (Reference)

Snapshots do not replace ledger retention. Ledger remains append-only source; retain ledger according to governance docs in `ops/osctl/GOVERNANCE.md`.
