# Simulation: Failed Production Deploy

> **Type:** Tabletop walkthrough · **No real deploy**  
> **Scenario:** CI succeeds, health passes, auth smoke fails after prod deploy  
> **Release ID:** `r20260525-deadbee`

## Scenario Setup

| Field | Value |
|-------|-------|
| Prior prod release | `r20260523-51eb8b1` (rollback target) |
| Failed release | `r20260525-deadbee` |
| Git SHA | `deadbee1234567890abcdef1234567890abcdef12` |
| Operator | `human:andriy` |
| Railway deployment ID (bad) | `bb9c8811-1111-4214-a1b8-043edaa96e5e` |
| Backend URL | `https://sitepilot-railway-production.up.railway.app` |
| Suspected cause | Wrong `JWT_SECRET` rotated in Railway mid-deploy |

---

## Timeline (Simulated)

| UTC | Event |
|-----|-------|
| 14:00 | GO recorded · `lifecycle.state: promoted` |
| 14:05 | Push `main` · CI `deploy-railway.yml` starts |
| 14:12 | CI SUCCESS · baton `ci:deploy-railway` |
| 14:15 | Post-deploy health curl · 200 · `"status":"ok"` |
| 14:18 | Auth smoke · `POST /api/v1/auth/login` · **401** |
| 14:20 | Incident declared · SEV2 |
| 14:22 | GO invalidated retroactively · NO-GO condition met |
| 14:25 | Rollback trigger · owner approves |
| 14:40 | Rollback complete · smoke pass |
| 15:00 | Incident updated · reconciled |

---

## Step 1 — Failed Healthcheck?

**Check:** `GET /health`

```json
{"status":"ok","env":"production","ts":"2026-05-25T14:15:00.000Z"}
```

Health **passes** — known SitePilot failure pattern (health ok, API broken).

**Action:** Do not close incident. Proceed to auth smoke per `DEPLOY_RITUAL.md` § post-release.

**Gap discovered:** Rituals warn about this pattern but no mandatory "health+auth pair" gate in CI.

---

## Step 2 — Incident Declaration

**Ritual:** `INCIDENT_TRIAGE.md`

| Field | Value |
|-------|-------|
| Incident ID | `inc-20260525-001` |
| Severity | **SEV2** (auth broken, no workaround) |
| Affected layer | `backend` · `auth` |
| Create | `ops/state/instances/inc-20260525-001/INCIDENT_LOG.md` |

Deploy freeze activated per SEV2.

Set failed release journal: `lifecycle.state: failed` · `verification.state: failed`

**Gap discovered:** No standard link from RELEASE_ID folder to INCIDENT_ID folder (operator creates cross-ref manually).

---

## Step 3 — GO/NO-GO Failure (Retroactive)

**Ritual:** `PRODUCTION_GO_NO_GO.md`

GO was given at 14:00, but post-deploy verification failed G5 (smoke).

| Rule | Application |
|------|-------------|
| Post-GO is not success | Failed verify → incident |
| Forbidden: health-only pass | **Violated in practice** if operator stopped early |

Document in incident:

```text
go_invalidated: true
reason: post_deploy_auth_smoke_fail
original_approver: human:andriy
```

**Gap discovered:** GO checklist has no "post-GO verify failed" branch — only pre-deploy NO-GO.

---

## Step 4 — Rollback Trigger

**Ritual:** `ROLLBACK_RITUAL.md` + `INCIDENT_TRIAGE.md`

| Trigger | Met? |
|---------|------|
| Critical path broken (auth) | Yes |
| Deploy within 4 hours | Yes |
| SEV2 deploy-related | Yes → rollback recommended |

Owner approves rollback at 14:25.

Instance CURRENT_STATUS:

```text
lifecycle.state: rollback
rollback_active: yes
rollback_target: r20260523-51eb8b1 / aa8b5749-...
```

Phase 2 draft event: `ops/osctl/examples/rollback-event.json` (not ingested).

---

## Step 5 — Rollback Execution (Simulated)

1. Halt merges to `main`
2. Railway → redeploy deployment `aa8b5749-25e2-4214-a1b8-043edaa96e5e`
3. Restore `JWT_SECRET` from password manager (not documented in ops repo)
4. Service Active at 14:38

**Gap discovered:** Env revert source of truth is **outside** governance docs (password manager) — journal only records "env reverted" not provable snapshot.

---

## Step 6 — Post-Rollback Validation

| Check | Result |
|-------|--------|
| `GET /health` | 200 ok |
| `POST /api/v1/auth/login` (admin) | 200 + token |
| CORS | skip (frontend not live) |

Set `lifecycle.state: reconciled` on rollback target release context.

Ingest shape (future): `ops/osctl/examples/reconcile-event.json`

---

## Step 7 — Incident Recording (Close Loop)

Complete INCIDENT_LOG sections:

| Section | Content |
|---------|---------|
| Root cause | JWT_SECRET rotated without journal entry; new tokens invalid |
| Prevention PF1 | Env changes require DEPLOYMENT_STATE append before Railway edit |
| Prevention PF2 | Post-deploy auth smoke mandatory in DEPLOY_RITUAL sign-off |
| Signed off | human:andriy · 2026-05-25T15:00:00Z |

Failed release `r20260525-deadbee` remains `failed` · not archived to prod.

Update root `DEPLOYMENT_STATE.md` append block · root `CURRENT_STATUS.md` rollback target refreshed.

---

## Simulation Outcome

| Question | Answer |
|----------|--------|
| Could operator follow docs? | Yes, across 4 files |
| Time to coherent state | ~60 min (too long under real SEV2 pressure) |
| Critical miss without simulation | Post-GO verify not wired to GO invalidation |

## Gaps Found (This Simulation)

1. Post-GO failure path underdocumented
2. Health-only false confidence not blocked by checklist mechanics
3. Env revert provenance outside repo
4. RELEASE_ID ↔ INCIDENT_ID linking ad hoc
5. CI success contradicts operational failure — reconciliation burden on human
