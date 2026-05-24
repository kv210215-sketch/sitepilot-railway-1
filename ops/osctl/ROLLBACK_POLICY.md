# OSCTL Rollback Policy

**Freeze ID:** `osctl-freeze/1.5`  
**Core spec:** `osctl-core/1.0`

---

## Principle

Rollback in OSCTL is **metadata and procedure** — not automation.

OSCTL records rollback intent, target pointer, and reconciliation. It does **not** execute Railway redeploy, VPS rollback, or DB revert.

---

## Rollback Eligibility

Human owner decides rollback when **any** condition met:

| Trigger | Typical evidence |
|---------|------------------|
| Prod smoke failure after deploy | Failed auth/critical path |
| Bad deploy artifact | Success deploy but broken behavior |
| Migration partial failure | Manual migration observe |
| Security incident | SEV1/SEV2 |
| Env misconfiguration | Wrong CORS, missing var names |

OSCTL does not auto-trigger on verify failure or health check.

---

## Rollback Target Rules

Recorded in `rollback.recorded` payload:

| Field | Rule |
|-------|------|
| `target_seq` | Must reference existing ledger seq |
| Target event type | Must be `deploy.recorded` |
| Target status | Must be `success` |
| `target_release_id` | Must match target deploy payload |
| `target_git_sha` | Must match target deploy payload |
| `lifecycle_state` | Must be `rollback` |

**Primary key:** ledger `seq` at known-good state.  
**Secondary refs:** git SHA, release ID in payload/`refs` — for human verification only.

Verify enforces target rules on every `verify` run.

---

## Lifecycle Path

```text
production → failed (optional) → rollback → reconciled → production
```

| Transition | Event | Actor |
|------------|-------|-------|
| `production → rollback` | `rollback.recorded` | Human |
| `failed → rollback` | `rollback.recorded` | Human |
| `rollback → reconciled` | `reconcile.recorded` | Human |
| `reconciled → production` | `deploy.recorded` | Human-approved ingest |

Forbidden: `rollback → production` (skip reconcile).

---

## Rollback Recording Semantics

Append `rollback.recorded`:

```json
{
  "ts": "2026-05-25T14:25:00.000Z",
  "actor": "human:andriy",
  "type": "rollback.recorded",
  "env": "production",
  "payload": {
    "release_id": "r20260525-deadbee",
    "target_seq": 1,
    "target_release_id": "r20260523-51eb8b1",
    "target_git_sha": "51eb8b17947b49ca1ac4ab2d483a432a35adcbbc",
    "reason": "auth_smoke_fail_after_deploy",
    "lifecycle_state": "rollback"
  },
  "refs": { "incident_id": "inc-20260525-001" }
}
```

Post-fold state:

- `rollback_active = true`
- `rollback_target_seq`, `rollback_target_release_id`, `rollback_target_git_sha` set
- `lifecycle_state = rollback`

---

## Rollback Verification

| Check | When | How |
|-------|------|-----|
| Target seq valid | On verify | `verify_ledger()` |
| Target deploy succeeded | On verify | Core checks payload.status |
| External rollback executed | Before reconcile | Human smoke tests |
| Prod smoke passed | Before reconcile | Human attestation in `reconcile.recorded` |

Core verify does **not** confirm Railway was redeployed.

---

## Rollback Execution (External — Human)

| Step | Owner | OSCTL |
|------|-------|-------|
| Decide rollback | Human | — |
| Mark in ledger | Human | `append rollback.recorded` |
| Railway redeploy to target artifact | Human | — |
| Smoke validation | Human | — |
| Record reconcile | Human | `append reconcile.recorded` |
| Refresh projections | Operator | `project` + `verify` |

Ritual: `ops/rituals/ROLLBACK_RITUAL.md`

---

## Reconcile Semantics

Append `reconcile.recorded` after external rollback + smoke pass:

- Sets `lifecycle_state: reconciled`
- Clears `rollback_active`
- Updates `verification_state`
- Optional `rollback_target_seq` reference

---

## Rollback Failure Handling

| Failure | Response |
|---------|----------|
| Invalid target seq on append | Rejected at append — fix target before write |
| Target missing at verify | verify exit 1 — fix ledger or append correction |
| External rollback fails | Human retries or escalates — append incident |
| Smoke fails post-rollback | Do not append reconcile — remain in rollback |
| Wrong target selected | Append new rollback with corrected target (human) — no line edit |

**No auto-recovery.** Human owns all failure paths.

---

## DB Rollback

Database schema revert (`migration:revert`) is **separate** from OSCTL rollback:

- Human assesses whether DB rollback required
- OSCTL may record observation — does not execute migration commands

---

## Authority Summary

| Action | Authority |
|--------|-----------|
| Mark rollback | Human owner only |
| Select target seq | Human owner |
| Execute redeploy | Human owner (or delegated ops) |
| Reconcile | Human owner after smoke |
| Append rollback event | Human-approved |
| CI append rollback | **Forbidden** Phase 1.5 |

---

## Related

- `STATE_MACHINE.md` — transitions
- `DRIFT_DETECTION.md` — mismatch handling
- `HUMAN_BOUNDARIES.md` — permanent human authority
- `ops/rituals/ROLLBACK_RITUAL.md` — operational steps
