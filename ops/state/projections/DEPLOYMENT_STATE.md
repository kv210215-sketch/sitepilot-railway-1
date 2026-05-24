# DEPLOYMENT STATE — OSCTL Journal Projection

> **Source:** ledger only · **Spec:** `osctl-core/1.0` · **Entries:** `3`

---

## Entry seq `1` · `deploy.recorded`

| Field | Value |
|-------|-------|
| Release ID | `r20260523-51eb8b1` |
| Git SHA | `51eb8b17947b49ca1ac4ab2d483a432a35adcbbc` |
| Actor | `ci:deploy-railway:deploy-backend` |
| Environment | `production` |
| Lifecycle state | `production` |
| Verification state | `passed` |
| Recorded at (UTC) | `2026-05-23T14:05:00.000Z` |
| Refs | `git_sha=51eb8b17947b49ca1ac4ab2d483a432a35adcbbc, railway_deployment_id=aa8b5749-25e2-4214-a1b8-043edaa96e5e` |

---

## Entry seq `3` · `rollback.recorded`

| Field | Value |
|-------|-------|
| Release ID | `r20260525-deadbee` |
| Git SHA | `n/a` |
| Actor | `human:andriy` |
| Environment | `n/a` |
| Lifecycle state | `rollback` |
| Verification state | `n/a` |
| Recorded at (UTC) | `2026-05-25T14:25:00.000Z` |
| Rollback reference | `seq:1` |
| Reason | `auth_smoke_fail_after_deploy` |

---

## Entry seq `4` · `reconcile.recorded`

| Field | Value |
|-------|-------|
| Release ID | `r20260523-51eb8b1` |
| Git SHA | `n/a` |
| Actor | `human:andriy` |
| Environment | `n/a` |
| Lifecycle state | `reconciled` |
| Verification state | `n/a` |
| Recorded at (UTC) | `2026-05-25T15:00:00.000Z` |
| Summary | `Railway redeploy to seq 1 artifact; prod smoke passed` |

---

## Rollback Pointers

| Field | Value |
|-------|-------|
| Rollback active | `no` |
| Target seq | `1` |
| Target release | `r20260523-51eb8b1` |

_generated_from_seq: 5_
