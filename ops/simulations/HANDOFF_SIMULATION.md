# Simulation: Operator Handoff Mid-Release

> **Type:** Tabletop walkthrough · **No real deploy**  
> **Scenario:** Operator A starts prod deploy · SEV3 incident parallel · Operator B takes baton  
> **Release ID:** `r20260527-f00baaa`

## Scenario Setup

| Role | Person |
|------|--------|
| Operator A (outgoing) | `human:alex` |
| Operator B (incoming) | `human:andriy` |
| Release owner | `human:andriy` |
| Parallel incident | `inc-20260527-003` · SEV3 · publish queue lag (pre-existing) |

| Field | Value |
|-------|-------|
| Release scope | Playwright memory limit config + env var doc |
| Git SHA | `f00baaa1234567890abcdef1234567890abcdef12` |
| Time | 2026-05-27 · 16:00 UTC handoff |

---

## Initial State (Operator A)

**16:00 — Deploy ritual in progress**

| Step | Status |
|------|--------|
| Daily ops | Clear |
| Pre-checks | Done |
| Staging waiver | Local prod-like pass |
| Smoke (pre-GO) | Pass |
| Rollback target | Documented · `r20260521-cafe000` |
| GO | **Approved** by owner `human:andriy` at 15:55 |
| CI deploy | **Running** (`deploy-railway.yml`) |
| Baton | `ci:deploy-railway` · action: `deploy` |

**Parallel:** SEV3 incident open — publish lag · owner `human:andriy` · not deploy-blocking per triage.

Operator A must leave at 16:00 (hard stop).

---

## Step 1 — Handoff Trigger

**Ritual:** `HANDOFF_PROTOCOL.md`

Outgoing (Alex) status:

- **Unsafe to hand off?** Rollback not mid-execute · CI running is **careful handoff** zone
- Decision: hand off with CI running · owner remains Andriy

---

## Step 2 — Baton Transfer

Alex fills handoff block in `ops/state/instances/r20260527-f00baaa/HANDOFF.md`:

```text
handoff:
  from: human:alex
  to: human:andriy
  at: 2026-05-27T16:00:00Z
  action_pending: verify
  release_id: r20260527-f00baaa
  incident_id: inc-20260527-003
  notes: |
    CI deploy in flight since 15:58. GO approved 15:55.
    Do NOT push main again. On CI fail see FAILED_PRODUCTION_DEPLOY sim.
    SEV3 publish lag unrelated — do not rollback deploy for it.
  accountable_human: human:andriy
```

Update instance CURRENT_STATUS deployment baton:

```text
holder: human:andriy
action_pending: verify
accountable_human: human:andriy
```

Alex messages Andriy: `baton offered` · Andriy replies: `baton accepted 16:02 UTC`

**Gap discovered:** HANDOFF.md not in original template set — created ad hoc in instances folder.

---

## Step 3 — Unresolved Incident During Handoff

**Ritual:** `INCIDENT_TRIAGE.md` + `HANDOFF_PROTOCOL.md` § incident ownership

| Field | SEV3 incident |
|-------|---------------|
| ID | `inc-20260527-003` |
| Owner | `human:andriy` (unchanged) |
| Deploy relation | unrelated |

Incoming operator (Andriy) **does not** assume incident from Alex — already owner.

Handoff note clarifies: **do not conflate** publish SEV3 with deploy verify.

**Gap discovered:** No visual "active incident + active deploy" dashboard — easy to merge mentally.

---

## Step 4 — Ownership Transfer

| Domain | Owner after handoff |
|--------|---------------------|
| Release `r20260527-f00baaa` | `human:andriy` (was already owner) |
| CI completion watch | `human:andriy` |
| GO validity | stands if CI succeeds · re-verify smoke |
| SEV3 incident | `human:andriy` |
| Rollback authority | `human:andriy` |

Alex **off baton** — no longer accountable.

---

## Step 5 — Release Continuation (Operator B)

**16:12 — CI completes SUCCESS**

Andriy executes `DEPLOY_RITUAL.md` § post-release only (does not re-GO):

| # | Step | Result (simulated) |
|---|------|-------------------|
| 1 | Record Railway ID `dd2e0033-…` | Done |
| 2 | `GET /health` | 200 ok |
| 3 | Auth smoke | 200 ok |
| 4 | Migrations | none |
| 5 | Journal append | `lifecycle.state: production` |

Update root MD files · set baton `action_pending: none`.

SEV3 incident ** stays open** — separate track.

---

## Step 6 — Handoff Completion Record

Append to release instance:

```text
handoff_complete:
  verifier: human:andriy
  ci_result: success
  post_deploy_smoke: pass
  completed_at: 2026-05-27T16:25:00Z
```

Notify Alex async: `r20260527-f00baaa prod verified — no action needed`

---

## Simulation Outcome

| Question | Answer |
|----------|--------|
| Handoff protocol sufficient? | **Mostly** — needed ad hoc HANDOFF.md |
| CI-in-flight handoff safe? | Yes **if** owner accepts and no second push |
| SEV3 + deploy parallel clear? | Required explicit note |

## Gaps Found (This Simulation)

1. No `HANDOFF.md` template in `ops/state/`
2. CI-in-flight handoff rules buried in HANDOFF_PROTOCOL — easy to miss
3. Operator must duplicate baton in CURRENT_STATUS + HANDOFF file
4. No notification standard beyond chat
5. Incoming operator may re-run full daily ops — redundant but unclear if mandatory mid-handoff
6. GO timestamp vs CI start not validated (5 min gap un audited)
