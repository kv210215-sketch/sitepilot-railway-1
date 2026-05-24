# Rollback Ritual

> **When:** SEV1/SEV2 impact, failed prod smoke, or explicit human decision  
> **Authority:** Human owner only — see approval section  
> **Checklist:** `ops/state/ROLLBACK_CHECKLIST.md`

## Rollback Triggers

Enter rollback when **any** condition true:

| Trigger | Typical signal |
|---------|----------------|
| Prod unavailable | Health fail >5 min, 5xx sustained |
| Critical path broken | Auth, core API 500 after deploy |
| Bad deploy artifact | Smoke pass on health only; API broken |
| Migration failure | Partial schema, migration exit ≠ 0 |
| Security / data risk | Credential leak, data exposure |
| Env misconfig | CORS/auth broken for all users |

**Not automatic:** Operator + owner decide. Agents never initiate rollback.

---

## Rollback Approval Authority

| Action | Who |
|--------|-----|
| Declare rollback intent | Operator (human) |
| Approve rollback execution | **Release owner** or delegated ops lead |
| Execute Railway redeploy | Approved human |
| DB `migration:revert` | **Owner only** — separate decision |
| Release rollback state | Owner after smoke pass |

Record approver in incident log: `human:<NAME>` at ISO8601 UTC.

---

## Rollback Execution Order

Execute in order — do not parallelize 3 and 4 without assessment.

```
1. Declare rollback (halt forward deploy)
2. Mark state + incident
3. Execute external rollback (Railway)
4. Env revert (if cause was config)
5. DB revert (only if approved — separate step)
6. Post-rollback smoke
7. Reconcile + handoff
```

---

### Step 1 — Halt Forward Deploy

- [ ] No merges to `main` for fix until path chosen (rollback vs forward-fix)
- [ ] Confirm CI not deploying (`deploy-railway.yml`)
- [ ] Set baton: `human:<NAME>` · action: `rollback`
- [ ] Set `lifecycle.state`: `rollback`

---

### Step 2 — Mark State + Incident

- [ ] Copy `INCIDENT_LOG.template.md` → `ops/state/instances/inc-YYYYMMDD-NNN/`
- [ ] Fill rollback target from CURRENT_STATUS (pre-deploy documented target)
- [ ] Append DEPLOYMENT_STATE journal: `lifecycle.state: rollback`
- [ ] Phase 2+: ingest `ops/osctl/examples/rollback-event.json` shape

---

### Step 3 — Execute External Rollback (Railway)

1. Railway → project `triumphant-purpose` → service `sitepilot-railway`
2. Deployments → select **known-good** deployment ID (from rollback target)
3. Redeploy / rollback to that artifact
4. Wait until service `Active`
5. Record new deployment ID if different

**Do not rely on git revert alone** — runtime artifact must match target.

---

### Step 4 — Env Revert (if applicable)

If incident cause was Railway variables:

- [ ] Restore known-good var set (names documented in last good journal entry)
- [ ] Wait for redeploy
- [ ] Re-run smoke

---

### Step 5 — DB Revert (optional, owner-approved)

Only if schema change caused incident:

- [ ] Owner explicit approval
- [ ] `railway run npm run migration:revert` (one step)
- [ ] Verify schema + smoke
- [ ] Document in incident — OSCTL does not auto-revert

---

## Rollback Verification

Before declaring reconciled:

| Check | Expected |
|-------|----------|
| Service status | Active |
| `GET /health` | 200, `status: ok` |
| `POST /api/v1/auth/login` | 200 + token |
| User-critical path | Pass (define in incident) |
| CORS | Matches frontend if applicable |

All must pass for `lifecycle.state: reconciled`.

---

## Post-Rollback Smoke Validation

Same table as deploy smoke — run on **production URL** after rollback:

```text
GET  {{BACKEND_URL}}/health
POST {{BACKEND_URL}}/api/v1/auth/login
```

Sign-off: verifier human + UTC timestamp in incident log.

---

## Incident Recording

Complete incident log sections:

- Timeline (declare → execute → verify)
- Rollback decision + approver
- Smoke validation results
- Root cause (initial — may refine later)
- Prevention follow-up items

Phase 2+: ingest `ops/osctl/examples/reconcile-event.json` shape after verify.

Set `lifecycle.state`: `reconciled` · release rollback lock: `released` · baton: handoff per protocol.

---

## Forward Fix After Rollback

Rollback is not the end state for permanent fixes:

1. Fix on branch — do not hot-push
2. Full `DEPLOY_RITUAL.md` when ready
3. New RELEASE_ID — do not reuse failed release ID

---

## References

- `ops/state/ROLLBACK_CHECKLIST.md`
- `ops/rituals/INCIDENT_TRIAGE.md`
- `ops/rituals/HANDOFF_PROTOCOL.md`
- `DEPLOYMENT_STATE.md` § Rollback Notes
