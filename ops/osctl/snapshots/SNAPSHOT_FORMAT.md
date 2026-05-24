# OSCTL Snapshot Format

**Spec version:** `osctl-snapshot/1.0`  
**Serialization:** Same canonical rules as `ops/osctl/core/schema/serialize.py`

---

## Top-Level Structure

```json
{
  "spec_version": "osctl-snapshot/1.0",
  "metadata": { "...": "..." },
  "state": { "...": "..." },
  "projections": { "CURRENT_STATUS.generated.md": "...", "...": "..." },
  "snapshot_hash": "<64-char hex SHA-256>"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `spec_version` | yes | Must be `osctl-snapshot/1.0` |
| `metadata` | yes | Provenance and ledger anchors |
| `state` | yes | Output of `fold_events()` at head |
| `projections` | no | Output of `replay()` at head |
| `snapshot_hash` | yes | Integrity over canonical payload |

---

## Metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `snapshot_id` | string | yes | Unique label (e.g. `snap-20260525-reconciled`) |
| `created_at` | string | yes | UTC ISO8601 `…Z` (ms optional) |
| `ledger_path` | string | no | Relative path hint for operators |
| `ledger_seq` | int | yes | Ledger head seq captured |
| `ledger_event_count` | int | yes | Must equal `ledger_seq` for contiguous ledgers |
| `ledger_lines_hash` | string | yes | SHA-256 of raw ledger file bytes at capture |
| `projection_fingerprint` | string | yes | `replay_fingerprint()` at head |
| `purpose` | string | yes | e.g. `operator-handoff`, `audit-export` |
| `actor` | string | yes | e.g. `human:andriy` — no service impersonation |

---

## State Object

Must be the deterministic output of `fold_events(events[:ledger_seq])`. Keys follow `ops/osctl/core/projection/fold.py` `empty_state()` schema.

**Forbidden in snapshots:**

- Runtime timestamps not from ledger events
- Network-fetched fields
- Mutable cache pointers
- Orchestration tokens or deploy credentials

---

## Snapshot Hash Rules

**Payload hashed** (canonical JSON, sorted keys, compact separators):

```json
{
  "spec_version": "...",
  "metadata": { ... },
  "state": { ... },
  "projections": { ... }
}
```

Rules:

1. Exclude `snapshot_hash` from hash input
2. Omit `projections` key entirely if not present (do not hash `null`)
3. Use `canonical_dumps()` from core serialize module
4. `snapshot_hash` = `content_hash(canonical_dumps(payload))`
5. Hash is lowercase hex, 64 characters

Verification: `ops/osctl/snapshots/scripts/verify_snapshot.py`

---

## Compression Rules

Optional transport/archive format:

| Aspect | Rule |
|--------|------|
| Algorithm | gzip (`gzip` stdlib) |
| Filename | `<snapshot_id>.json.gz` |
| Hash scope | **Uncompressed** canonical JSON bytes |
| Sidecar | `<snapshot_id>.json.gz.sha256` optional operator anchor |

Decompress → verify hash on uncompressed bytes → compare to ledger.

**Forbidden:** Compressed hash of compressed bytes unless explicitly labeled as a separate `compression_hash` (not in v1.0).

---

## Deterministic Serialization

Identical to core event serialization:

- Recursive key sort
- `json.dumps(ensure_ascii=True, separators=(",", ":"), sort_keys=True)`
- No trailing newline inside hash input string
- File on disk may use pretty-printed JSON + trailing newline for human review; hash always computed from canonical form

---

## Examples

| File | Intent |
|------|--------|
| `examples/valid-snapshot.json` | Passes verify + ledger compare at seq 5 |
| `examples/stale-snapshot.json` | Valid hash at seq 3; stale vs current ledger |
| `examples/corrupted-snapshot.json` | Tampered state; hash mismatch |
| `examples/REPLAY_RECONSTRUCTION.md` | Operator replay workflow |

---

## Versioning

| Version | Change |
|---------|--------|
| `osctl-snapshot/1.0` | Initial Phase 3 format |

Breaking changes require new spec version and new verification scripts.
