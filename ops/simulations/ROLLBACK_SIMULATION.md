# Simulation: Full Rollback Ritual

> **Type:** Tabletop walkthrough · **No real rollback executed**  
> **Scenario:** Deliberate rollback drill from known-good documentation  
> **Trigger:** Quarterly drill (no live incident)

## Scenario Setup

| Field | Value |
|-------|-------|
| Current prod (simulated) | `r20260525-deadbee` · **failed** (prior simulation) |
| Rollback target | `r20260523-51eb8b1` |
| Target SHA | `51eb8b17947b49ca1ac4ab2d483a432a35adcbbc` |
| Target Railway ID | `aa8b5749-25e2-4214-a1b8-043edaa96e5e` |
| Operator | `human:andriy` |
| Approver | `human:andriy` (owner) |
| Backend URL | `https://sitepilot-railway-production.up.railway.app` |

---

## Phase 1 — Identify Rollback Target

**Sources consulted (order):**

1. Instance `ops/state/instances/r20260524-a1b2c3d/CURRENT_STATUS.md` rollback section
2. Root `DEPLOYMENT_STATE.md` last known-good entry
3. Railway dashboard deployment list (simulated screenshot)

**Recorded target:**

```text
release_id: r20260523-51eb8b1
git_sha: 51eb8b17947b49ca1ac4ab2d483a432a35adcbbc
railway_deployment_id: aa8b5749-25e2-4214-a1b8-043edaa96e5e
verified_at: 2026-05-26T08:00:00Z
```

**Gap discovered:** Three sources can disagree if weekly reconciliation skipped — drill exposed root MD still citing May 02 narrative.

---

## Phase 2 — Verify Target Exists

| Check | Method | Result |
|-------|--------|--------|
| Deployment ID in Railway | Dashboard search | **Found** · SUCCESS |
| SHA matches git | `git cat-file -t 51eb8b1` | Valid |
| Health at rollback artifact (historical) | Documented 200 in BUILD_STATUS | Accept |
| Migrations compatible | No migration between target and failed release | OK — no DB revert |

If deployment ID purged by Railway retention → ** drill fails** → escalate to git SHA rebuild deploy (undocumented path).

**Gap discovered:** No procedure if Railway deployment artifact aged out.

---

## Phase 3 — Operator Approval

**Ritual:** `ROLLBACK_RITUAL.md` § approval

```text
rollback_declared_by: human:andriy
rollback_approved_by: human:andriy
approved_at: 2026-05-26T08:15:00Z
reason: quarterly_drill + prior failed release simulation
incident_id: inc-20260526-drill (drill flag)
```

Create minimal incident log with `[DRILL]` prefix in title.

Set baton:

```text
holder: human:andriy
action_pending: rollback
```

Journal: `lifecycle.state: rollback`

---

## Phase 4 — Rollback Execution (Simulated Steps)

Execute order per `ROLLBACK_RITUAL.md`:

| # | Step | Simulated action |
|---|------|------------------|
| 1 | Halt forward deploy | Confirm no CI running |
| 2 | Mark state | Journal + incident updated |
| 3 | Railway redeploy | Select `aa8b5749-…` · Redeploy |
| 4 | Env revert | No env change in drill |
| 5 | DB revert | **Skipped** — not approved |

Simulated completion: 08:28 UTC · new active deploy ID `aa8b5749-25e2-4214-a1b8-043edaa96e5e` (same artifact)

**Gap discovered:** Operator unsure whether redeploy creates **new** deployment ID — journal must record both; template allows one field.

---

## Phase 5 — Smoke Verification

**Ritual:** post-rollback smoke

| # | Test | Simulated |
|---|------|-----------|
| 1 | Service Active | Yes |
| 2 | `GET /health` | 200 · ok |
| 3 | `POST /api/v1/auth/login` | 200 · token |
| 4 | Critical path | projects list 200 |

Verifier: same operator (drill) — production incident should use independent verifier.

**Gap discovered:** Independent verifier requirement stated in ROLLBACK_RITUAL but not enforced in checklist checkboxes.

---

## Phase 6 — Reconcile State

| Artifact | Update |
|----------|--------|
| Incident log | `lifecycle after action: reconciled` · drill complete |
| DEPLOYMENT_STATE instance + root | Append rollback + reconcile entries |
| CURRENT_STATUS | `lifecycle.state: production` on target release · rollback_active: no |
| Baton | `holder: human:andriy` · `action_pending: none` |
| Failed release | `r20260525-deadbee` stays `failed` / archived |

Future event shape: `reconcile-event.json` (`event_kind: reconcile`)

**Phase 2 note:** Would append seq 19–20 to ledger; Phase 1.5 manual only.

---

## Drill Scorecard

| Criterion | Pass? |
|-----------|-------|
| Target identified <15 min | Yes (with 3 sources) |
| Approval documented | Yes |
| Execution order followed | Yes |
| Smoke documented | Yes |
| State reconciled | Yes |
| Single source of truth | **No** — 3 sources conflict risk |

## Gaps Found (This Simulation)

1. Railway artifact retention / missing deployment ID — no runbook
2. Redeploy vs new deployment ID journal ambiguity
3. Independent verifier not checklist-enforced
4. Drill vs real incident not distinguished in templates (added `[DRILL]` ad hoc)
5. Reconciliation touches 4 files — high error rate under stress
