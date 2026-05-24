# OSCTL Capability Matrix

**Scope:** Trust kernel + snapshot layer + authority boundaries  
**Principle:** VERIFY before ACT

---

## Read-Only Capabilities

| Capability | Component | Network |
|------------|-----------|---------|
| Read ledger events | `core/ledger/store.py` | no |
| Replay projections | `core/replay/engine.py` | no |
| Verify ledger + drift | `core/verify/engine.py` | no |
| Validate event schema | `core/schema/events.py` | no |
| Run validation suite | `validation/run_validation.py` | no |
| Verify snapshot hash | `snapshots/scripts/verify_snapshot.py` | no |
| Compare snapshot vs ledger | `snapshots/scripts/compare_snapshot.py` | no |
| Extract snapshot metadata | `snapshots/scripts/snapshot_metadata.py` | no |
| CI read-only verify | `python -m ops.osctl.core verify` | no |

---

## Write Capabilities

| Capability | Who | Constraints |
|------------|-----|-------------|
| Append ledger event | Human / approved CI | Schema + seq rules |
| Write projections via replay | Operator CLI `replay` | Derived only; overwrites generated MD |
| Export snapshot file | Human operator | Manual; not in Phase 3 CLI |
| Archive snapshot offline | Human operator | Policy in SNAPSHOT_RETENTION.md |

---

## Forbidden Capabilities

| Capability | Status |
|------------|--------|
| Autonomous deploy | **FORBIDDEN** |
| Railway mutation | **FORBIDDEN** |
| Cloudflare mutation | **FORBIDDEN** |
| Backend state API write | **FORBIDDEN** |
| CI auto-append without approval | **FORBIDDEN** |
| CI snapshot delete/rotate | **FORBIDDEN** |
| Self-healing ledger/snapshot | **FORBIDDEN** |
| Snapshot → deploy trigger | **FORBIDDEN** |
| Hidden mutable OSCTL cache | **FORBIDDEN** |
| Orchestration authority | **FORBIDDEN** |

---

## Authority Matrix

| Domain | Holder | Notes |
|--------|--------|-------|
| Ledger authority | Append-only ledger | Single source of truth |
| Snapshot authority | **None** (non-authoritative) | Acceleration only |
| Infra authority | Human owner | Outside OSCTL |
| Deploy authority | Human owner + CI executor | OSCTL records only |
| Production authority | Human owner | Go/no-go |
| Verification authority | OSCTL core read paths | Detect inconsistency |
| External anchor authority | Human operator | Head-hash outside repo |

---

## Human Approval Requirements

| Action | Approval |
|--------|----------|
| Production-asserting ledger append | Human owner |
| Rollback / reconcile record | Human owner |
| Acting on operational state | Human after `verify` + `replay` |
| Trusting snapshot for handoff | Human after `compare_snapshot --ledger` |
| External head-hash publish | Human operator |
| Prune/archive snapshots | Human operator |
| Any deploy or infra change | Human owner (OSCTL not involved) |

---

## Phase 3 Snapshot Layer

| Operation | Allowed in Phase 3 |
|-----------|---------------------|
| Read snapshot | yes |
| Verify snapshot hash | yes |
| Compare to ledger | yes |
| Write snapshot via core CLI | no (manual export only) |
| Auto-create on replay | no |
