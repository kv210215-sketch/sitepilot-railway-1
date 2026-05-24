# OSCTL Snapshot Architecture

**Phase:** 3 — Immutable Operational State Snapshots  
**Spec:** `osctl-snapshot/1.0`  
**Status:** Design + read-only verification tooling  
**Principle:** **VERIFY before ACT**

---

## Purpose

Provide **immutable, deterministic acceleration artifacts** that capture folded operational state and optional projection content at a fixed ledger head (`ledger_seq`). Snapshots speed up human and agent **read** workflows; they never replace the append-only ledger.

---

## Immutable Snapshots

| Property | Rule |
|----------|------|
| Write model | Write-once; no in-place mutation API in Phase 3 |
| Content | Frozen `state` + optional `projections` at `metadata.ledger_seq` |
| Integrity | `snapshot_hash` = SHA-256 of canonical payload (excluding hash field) |
| Authority | **Non-authoritative** — ledger replay always wins |

Snapshots are files (JSON or compressed JSON). Once written, any edit invalidates `snapshot_hash`.

---

## Deterministic Reconstruction

Authoritative reconstruction path:

```text
events.jsonl  →  read_events()  →  fold_events()  →  state
                                 →  replay()       →  projections
                                 →  replay_fingerprint()
```

Snapshot reconstruction (non-authoritative):

```text
snapshot.json  →  verify_snapshot_hash()
               →  compare_snapshot --ledger events.jsonl
```

**Guarantee:** If `compare_snapshot` reports no drift, snapshot content matches ledger replay at the same head. If ledger has advanced past `metadata.ledger_seq`, snapshot is **stale** but may still be structurally valid.

---

## Snapshot Lifecycle

```text
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   CREATED   │ ──► │   VERIFIED   │ ──► │   REFERENCED │ ──► │  ARCHIVED   │
│ (operator)  │     │ (read-only)  │     │ (read-only)  │     │ (retention) │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
       │                    │                    │
       │                    ▼                    ▼
       │              INVALIDATED           SUPERSEDED
       │              (hash fail)           (ledger advanced)
       └──────────────────────────────────────────────► DISCARD (policy)
```

| Phase | Actor | Actions allowed |
|-------|-------|-----------------|
| Created | Human operator | Export snapshot from verified replay |
| Verified | Validator / operator | `verify_snapshot.py`, `compare_snapshot.py` |
| Referenced | Agents (read-only) | Consult snapshot **after** ledger verify |
| Archived | Operator | Move to offline store per retention policy |
| Invalidated | System / operator | Reject; re-replay from ledger |
| Superseded | Time / ledger growth | Mark stale; do not delete ledger |

Phase 3 provides **verification scripts only** — no snapshot writer in core CLI.

---

## Replay Boundaries

| Boundary | Inside | Outside |
|----------|--------|---------|
| Input | Ledger lines `1..N` or snapshot at seq `N` | Live Railway state, Cloudflare, backend DB |
| Output | Folded state, projections, fingerprints | Deploy commands, infra mutations |
| Trust | Requires `verify` pass on ledger first | Snapshot without ledger compare |

**Hard rule:** Replay from snapshot **without** ledger confirmation is forbidden for operational decisions.

---

## Snapshot Trust Guarantees

| Guaranteed | Not guaranteed |
|------------|------------------|
| Structural schema validity (when verify passes) | Snapshot reflects current ledger head |
| Hash covers embedded state/projections | Snapshot was created by a trusted actor |
| Same bytes → same hash | Protection against ledger tampering (no hash chain in v1) |
| Read-only scripts detect drift vs ledger | Automatic refresh or healing |

---

## Snapshot Invalidation Rules

A snapshot is **invalid for operational use** when any of:

1. `verify_snapshot.py` fails (`snapshot_hash` mismatch)
2. `compare_snapshot.py --ledger` reports drift at claimed `ledger_seq`
3. `metadata.ledger_seq` < current ledger length (stale head)
4. `metadata.projection_fingerprint` ≠ replay fingerprint at `ledger_seq`
5. `spec_version` ≠ `osctl-snapshot/1.0`
6. Embedded projections disagree with replay output

**Stale ≠ corrupt:** A stale snapshot may still pass hash verification but must not drive actions until re-compared or discarded.

---

## Relationship to Core

| Layer | Role |
|-------|------|
| `ops/osctl/core/` | Ledger, replay, verify — **trust kernel** |
| `ops/osctl/snapshots/` | Format, policy, read-only verification — **acceleration layer** |
| `ops/osctl/validation/` | Evidence that core is deterministic |

See `SNAPSHOT_TRUST_BOUNDARIES.md` and `SNAPSHOT_FORMAT.md`.
