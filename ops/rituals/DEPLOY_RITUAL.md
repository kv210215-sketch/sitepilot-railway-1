# Deploy Ritual

> **When:** Every intentional production release  
> **Prerequisite:** `DAILY_OPERATIONS.md` complete · `PRODUCTION_GO_NO_GO.md` pass  
> **Checklist:** `ops/state/RELEASE_CHECKLIST.md`

## Release Identity

Assign before step 1:

```text
RELEASE_ID = rYYYYMMDD-<short-sha>   (e.g. r20260523-51eb8b1)
Operator     = human:<NAME>
Target env   = production | staging
```

Copy templates to `ops/state/instances/{{RELEASE_ID}}/`.

---

## Ritual Sequence (Deterministic)

```
pre-checks
  → staging validation (or documented waiver)
  → smoke tests
  → rollback verification
  → production approval
  → deploy execution (CI or approved manual)
  → post-release verification
  → reconciliation update
```

Do not skip steps. Do not reorder production approval before rollback verification.

---

## 1. Pre-checks

| # | Check | Fail action |
|---|-------|-------------|
| 1 | Daily operations clear | Stop |
| 2 | Release scope written (commits, migrations, env deltas) | Stop |
| 3 | `lifecycle.state` → `planned` in journal | Record |
| 4 | No active SEV1/SEV2 incident | Stop |
| 5 | No active rollback lock | Stop |
| 6 | Migration plan if schema change (post-deploy manual run) | Document |
| 7 | Railway secrets: JWT_*, DATABASE_URL, DB_SYNC=false (names verified) | Stop |

---

## 2. Staging Validation

Follow `STAGING_VALIDATION.md` fully **or** record hotfix waiver:

```text
hotfix_waiver: true
reason: <one line>
approver: human:<NAME>
```

Set `lifecycle.state`: `staging` → `validating`.

**SitePilot default:** No Railway staging service — waiver allowed with local prod-like or direct `validating` on prod URL pre-gate (read-only smoke only before approval).

---

## 3. Smoke Tests

Run on target URL (staging or prod pre-deploy read-only where applicable):

| # | Test | Pass |
|---|------|------|
| 1 | `GET /health` → 200, `status: ok` | ☐ |
| 2 | `POST /api/v1/auth/register` (test user) | ☐ |
| 3 | `POST /api/v1/auth/login` | ☐ |
| 4 | One authenticated `GET /api/v1/...` | ☐ |
| 5 | CORS (if frontend live) | ☐ |

`verification.state`: `passed` | `failed` — failed stops ritual.

---

## 4. Rollback Verification

Before production approval, document rollback target in CURRENT_STATUS instance:

| Field | Value |
|-------|-------|
| Target release ID | previous known-good |
| Target git SHA | |
| Target Railway deployment ID | from dashboard |
| Rollback ritual reviewed | `ROLLBACK_RITUAL.md` |

Operator confirms ability to execute rollback within 30 minutes.

---

## 5. Production Approval

**Gate:** `PRODUCTION_GO_NO_GO.md` — human owner only.

Record:

```text
approved_by: human:<NAME>
approved_at: <ISO8601 UTC>
lifecycle.state: promoted
```

CI cannot substitute this step.

---

## 6. Deploy Execution

**Standard path:**

```text
git push origin main
  → GitHub Actions deploy-railway.yml
  → railway up --service sitepilot-railway
```

Set baton: `ci:deploy-railway` · pending action: `deploy`

**Forbidden:** Push without approval · Parallel deploys · Railway GitHub App auto-deploy re-enabled without journal update

---

## 7. Post-Release Verification

After CI success (or manual deploy complete):

| # | Check | Record |
|---|-------|--------|
| 1 | Railway deployment ID | journal |
| 2 | `GET /health` on prod URL | timestamp + body status |
| 3 | Auth smoke on prod | pass/fail |
| 4 | Migrations if planned: `railway run npm run migration:run` | exit code |
| 5 | Post-migration smoke | pass/fail |

Set `lifecycle.state`: `production` on success.

---

## 8. Reconciliation Update

| Artifact | Action |
|----------|--------|
| `ops/state/instances/{{RELEASE_ID}}/DEPLOYMENT_STATE` | Append final entry |
| `ops/state/instances/{{RELEASE_ID}}/CURRENT_STATUS` | Final projection fields |
| Root `CURRENT_STATUS.md` | Update summary |
| Root `DEPLOYMENT_STATE.md` | Append journal block |
| Previous release | Mark `archived` in journal |
| Baton | Transfer to `none` or next owner via `HANDOFF_PROTOCOL.md` |

Phase 2+: ingest `ops/osctl/examples/deploy-event.json` shape · run `osctl project` (future).

---

## Abort Conditions

Stop ritual and set `lifecycle.state: failed` if:

- Smoke fail after deploy
- Migration exit code ≠ 0
- Health not `ok` within 15 minutes
- Undocumented env change detected

Next: `ROLLBACK_RITUAL.md` or forward-fix decision per `INCIDENT_TRIAGE.md`.

---

## References

- `ops/state/RELEASE_CHECKLIST.md`
- `ops/rituals/STAGING_VALIDATION.md`
- `ops/rituals/PRODUCTION_GO_NO_GO.md`
- `ops/state/STATE_TRANSITIONS.md`
