# Simulation: Unrecorded Deploy Drift

> **Type:** Tabletop walkthrough · **No real deploy**  
> **Scenario:** Weekly reconciliation finds prod running undeclared SHA  
> **Discovery date:** 2026-W22 weekly review (simulated Monday)

## Scenario Setup

| Source | Claim |
|--------|-------|
| Root `DEPLOYMENT_STATE.md` | Last entry: `r20260523-51eb8b1` · SHA `51eb8b1…` |
| Root `CURRENT_STATUS.md` | Active release `r20260523-51eb8b1` |
| Railway dashboard (simulated) | Active deploy SHA `cafe000…` · deploy ID `cc1d9922-…` · deployed **2026-05-21** by manual `railway up` |
| GitHub Actions | No workflow run on 2026-05-21 |
| Ledger (Phase 2) | **Does not exist** |

**Drift type:** Unrecorded manual deploy + SHA mismatch.

---

## Step 1 — Detect SHA Mismatch

**Ritual:** `WEEKLY_RECONCILIATION.md` § deployments vs journal

Operator runs weekly compare:

| Check | Expected | Actual |
|-------|----------|--------|
| Railway active SHA | `51eb8b1…` | `cafe0001234…` |
| Journal last SHA | `51eb8b1…` | matches doc |
| CI run for active SHA | yes | **no run for cafe000** |

**Finding:** Production truth ≠ documented truth.

Assign SEV3 incident: `inc-20260526-002`

---

## Step 2 — Deployment Not in Ledger

Phase 1.5: "ledger" = `DEPLOYMENT_STATE.md` + `ops/state/instances/`

Search:

```text
grep -r cafe000 ops/state/   → no matches
grep cafe000 DEPLOYMENT_STATE.md → no matches
```

**Conclusion:** Deploy occurred outside governed channel.

**Gap discovered:** Without ledger, "unrecorded" detection depends on weekly human discipline — easily missed for 5+ days.

---

## Step 3 — Weekly Reconciliation Process

**Ritual:** `WEEKLY_RECONCILIATION.md` full agenda

| Agenda item | Result |
|-------------|--------|
| Deployments vs journal | **FAIL** — 1 orphan |
| Unrecorded deploys | **1** — manual Railway |
| Rollback references | **STALE** — points to 51eb8b1 but prod is cafe000 |
| Incidents | New SEV3 opened |
| Operational drift | Deploy channel violated |

Weekly note path (simulated):

```text
ops/state/instances/weekly-2026-W22/reconciliation.md
```

---

## Step 4 — Reconcile Process

**Goal:** Document reality without rewriting history (append-only discipline).

### 4a. Forensic record (human interview)

```text
actor: human:andriy (simulated admission)
action: manual railway up during CI token debug
date: 2026-05-21
reason: CI failed; bypassed process
```

### 4b. Append journal entry (retroactive)

Create `ops/state/instances/r20260521-cafe000/` **post-facto**:

```text
release_id: r20260521-cafe000
git_sha: cafe0001234567890abcdef1234567890abcdef12
actor: human:andriy
lifecycle.state: production
verification.state: unknown
notes: RETROACTIVE ENTRY — unrecorded deploy reconciled W22
deploy_channel: manual-railway (violation)
railway_deployment_id: cc1d9922-2222-4214-a1b8-043edaa96e5e
```

Append block to root `DEPLOYMENT_STATE.md`.

### 4c. Update CURRENT_STATUS

```text
active_release: r20260521-cafe000
known_blockers: B2 — rollback target unknown until smoke verified
deployment_baton: human:andriy · action: verify
```

### 4d. Validate prod ( belated smoke)

| Test | Result (simulated) |
|------|---------------------|
| health | 200 ok |
| auth login | 200 ok |

Set `verification.state: passed` retroactively with note "verified during W22 reconcile only."

### 4e. Reset rollback target

Document new known-good:

```text
rollback_target: r20260521-cafe000 / cc1d9922-…
previous_stale_target: r20260523-51eb8b1 (never deployed)
```

**Gap discovered:** Retroactive release IDs break monotonic timeline — no `supersedes` link in templates until operator adds manually.

---

## Step 5 — Root Cause Recording

INCIDENT_LOG `inc-20260526-002`:

| Field | Value |
|-------|-------|
| Severity | SEV3 |
| Root cause category | `process` |
| Root cause | Manual Railway deploy bypassing GitHub Actions; no journal append |
| Prevention PF1 | Disable local Railway token on operator laptops except break-glass |
| Prevention PF2 | Weekly reconciliation mandatory calendar + owner |
| Prevention PF3 | Phase 2: CI-only deploy channel enforced by Railway token scope |

Close incident after PF items assigned.

---

## Simulation Outcome

| Metric | Value |
|--------|-------|
| Time to detect | 5 days (too long) |
| Time to reconcile | ~90 min |
| Prod risk during drift | Unknown verification state |

## Gaps Found (This Simulation)

1. No real-time drift alert — weekly only
2. Retroactive instance folders awkward — no `deploy.observed` backfill schema
3. Rollback target was fiction (51eb8b1 never on prod) — dangerous if incident occurred W21
4. Manual deploy channel not technically blocked
5. GitHub Actions vs Railway dashboard — two truths, no single query
6. `r20260523` date in release ID after undeployed SHA — naming confusion
