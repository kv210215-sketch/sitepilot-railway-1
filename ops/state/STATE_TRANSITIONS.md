# State Transitions — Canonical Reference

> Operational lifecycle for SitePilot releases.  
> **Source of truth (governance):** `ops/osctl/STATE_MACHINE.md`  
> **Storage (Phase 2+):** ledger event `payload.lifecycle.state`

## States

| State | Definition |
|-------|------------|
| `planned` | Intent recorded; no deploy executed |
| `staging` | Deployed to non-prod / pre-prod |
| `validating` | Health, smoke, migration checks running |
| `promoted` | Human-approved for production entry |
| `production` | Active prod release |
| `failed` | Validation or deploy observe failed |
| `rollback` | Rollback marked; rollback lock active |
| `reconciled` | Post-rollback/failure documented; locks cleared |
| `archived` | Superseded; historical only |

---

## Allowed Transitions

| From | To | Trigger | Actor |
|------|-----|---------|-------|
| — | `planned` | Release scoped | human, ci |
| `planned` | `staging` | Staging deploy success | ci, human |
| `planned` | `validating` | Deploy + checks start | ci |
| `staging` | `validating` | Checks start | ci, human |
| `validating` | `promoted` | Human production approval | **human** |
| `validating` | `failed` | Check or deploy failure | ci |
| `promoted` | `production` | Prod deploy observe success | ci |
| `production` | `rollback` | Incident + rollback mark | **human** |
| `rollback` | `reconciled` | External rollback + verify | **human** |
| `reconciled` | `production` | Forward fix deploy success | ci |
| `failed` | `planned` | Retry intent recorded | human |
| `failed` | `reconciled` | No prod impact; documented | human |
| `production` | `archived` | Superseded by newer release | ci + journal |
| `*` → `archived` | Explicit archive | human policy |

---

## Forbidden Transitions

| From | To | Reason |
|------|-----|--------|
| `failed` | `production` | Must not skip validation |
| `validating` | `production` | Requires `promoted` or documented hotfix waiver |
| `planned` | `production` | Must observe deploy path |
| `rollback` | `production` | Must reconcile first |
| `rollback` | `promoted` | Rollback lock blocks promotion |
| `archived` | `*` | Terminal — new release gets new ID |
| `*` | `production` | While `rollback` lock held |
| `validating` | `promoted` | CI-only — human required |

---

## SitePilot Default Path (no staging service)

```
planned → validating → promoted → production → archived
```

Document `staging` waiver in DEPLOYMENT_STATE journal when skipped.

---

## Hotfix Path

```
planned → validating → production
```

Requires:

1. `note.human` with `hotfix_waiver: true`
2. Human production gate
3. Full prod smoke post-deploy

Still **forbidden:** `failed` → `production`, `rollback` → `production` without `reconciled`.

---

## Rollback Triggers

Enter `rollback` when any apply (human decides):

- Prod smoke fail after successful health
- Migration partial failure
- Security / data integrity incident
- Env misconfiguration with user impact

**Required:** `rollback.marked` + rollback lock + human actor (Phase 2+).

---

## Transition Recording

| Phase | Where to record |
|-------|-----------------|
| Now | `DEPLOYMENT_STATE.template.md` entry + `CURRENT_STATUS.template.md` |
| Phase 2+ | Ledger events → `osctl project` |

**Related:** `RELEASE_CHECKLIST.md`, `ROLLBACK_CHECKLIST.md`, `GOVERNANCE.md`
