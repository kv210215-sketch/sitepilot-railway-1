# OSCTL State Machine

**Freeze ID:** `osctl-freeze/1.5`  
**Core spec:** `osctl-core/1.0`  
**Implementation:** `ops/osctl/core/schema/transitions.py`

---

## Scope

Lifecycle states for **operational releases** tracked in the ledger — not NestJS runtime states.

State is carried in `payload.lifecycle_state` on `deploy.recorded`, `rollback.recorded`, and `reconcile.recorded` events. Fold replays events to derive current state.

---

## States

| State | Meaning |
|-------|---------|
| `planned` | Intent recorded; no deploy execution yet |
| `staging` | Change in non-prod target |
| `validating` | Post-deploy checks in progress |
| `promoted` | Passed validation; approved for prod entry |
| `production` | Active prod; serving traffic |
| `failed` | Validation or deploy failed |
| `rollback` | Known-good pointer set; rollback posture active |
| `reconciled` | Post-rollback documented; rollback posture cleared |
| `archived` | Historical; superseded |

---

## Allowed Transitions (Frozen)

Implemented as `ALLOWED` set in `transitions.py`:

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

---

## Forbidden Transitions (Explicit)

Highlighted in code as `FORBIDDEN_HIGHLIGHTS`:

| From | To | Reason |
|------|-----|--------|
| `failed` | `production` | Must not skip recovery |
| `validating` | `production` | Requires promotion |
| `planned` | `production` | Must not skip gates |
| `rollback` | `production` | Must reconcile first |
| `archived` | `production` | New deploy cycle required |

Any pair not in `ALLOWED` is rejected: `invalid transition: {from} -> {to}`.

---

## Event Triggers (Implemented Types)

| Transition | Event type | Actor |
|------------|------------|-------|
| → `staging` / `validating` / `production` | `deploy.recorded` | Human, CI (Phase 2+) |
| → `failed` | `deploy.recorded` (status=failed) | Human, CI |
| → `rollback` | `rollback.recorded` | **Human only** |
| → `reconciled` | `reconcile.recorded` | **Human only** |
| → `promoted` | `deploy.recorded` | **Human** (promotion gate) |

`incident.recorded` does not change lifecycle state.

---

## SitePilot Default Path

Current Railway setup (no separate staging service):

```text
None → validating → production
```

Or direct:

```text
None → production
```

Full gate path when staging exists:

```text
staging → validating → promoted → production
```

Document path in ledger events. State machine unchanged when staging service added.

---

## Rollback Lifecycle

```text
production → failed (optional) → rollback → reconciled → production
```

| Phase | Fold state |
|-------|------------|
| After `rollback.recorded` | `rollback_active=true`, `lifecycle_state=rollback` |
| After `reconcile.recorded` | `rollback_active=false`, `lifecycle_state=reconciled` |

See `ROLLBACK_POLICY.md`.

---

## Verification

Invalid transitions detected by:

1. `verify_ledger()` — per-event check during scan
2. `fold_events()` — `transition_errors` list

Both reported on `verify` exit 1.

---

## Projection Mapping

| State | CURRENT_STATUS | DEPLOYMENT_STATE |
|-------|------------------|------------------|
| `production` | Active release table | Latest deploy journal entry |
| `rollback` | Rollback target section | Rollback journal entry |
| `failed` | Verification status | Failed deploy entry |
| `reconciled` | Lifecycle state field | Reconcile summary entry |

---

## Related

- `EVENT_SCHEMA.md` — payload fields
- `ROLLBACK_POLICY.md` — rollback semantics
- `VERIFY_MODEL.md` — transition errors
