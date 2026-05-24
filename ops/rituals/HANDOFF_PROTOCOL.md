# Handoff Protocol

> **When:** Shift change, owner unavailable, deploy paused mid-ritual, or incident transfer  
> **Rule:** Baton must always have exactly one accountable human (CI counts only during automated deploy step)

## Baton Model

| Field | Meaning |
|-------|---------|
| **Holder** | Who is accountable right now |
| **Action pending** | `none` \| `deploy` \| `verify` \| `rollback` \| `incident` |
| **Release ID** | Active release context (if any) |
| **Incident ID** | Active incident (if any) |

Recorded in CURRENT_STATUS instance + verbal/chat confirmation.

---

## Operator Baton Transfer

### Outgoing operator

1. Complete or pause at safe point (never mid-rollback execution)
2. Update CURRENT_STATUS deployment baton section
3. Fill handoff block (below)
4. Confirm incoming operator ack

### Incoming operator

1. Read `DAILY_OPERATIONS.md` fresh
2. Read CURRENT_STATUS + active incident logs
3. Verbal/chat ack: `baton accepted human:<NAME> at <UTC>`
4. Continue or hold per GO/NO-GO state

### Handoff block (paste in release or incident file)

```text
handoff:
  from: human:<OUTGOING>
  to: human:<INCOMING>
  at: <ISO8601 UTC>
  action_pending: <none|deploy|verify|rollback|incident>
  release_id: <RELEASE_ID|n/a>
  incident_id: <INCIDENT_ID|n/a>
  notes: <one paragraph max>
```

---

## Release Ownership

| State | Owner |
|-------|-------|
| `planned` → `validating` | Operator who started ritual |
| `promoted` (pre-GO) | Release owner |
| GO given → deploy running | CI executes · human owner accountable |
| `production` post-verify | Owner until weekly reconciliation |
| `failed` | Owner until retried or archived |

**Transfer release:** Outgoing notifies incoming · incoming re-runs GO prerequisites if >4 hours elapsed.

---

## Active Incident Ownership

| Severity | Owner rule |
|----------|------------|
| SEV1 | Single named owner — no shared accountability |
| SEV2 | Named owner required |
| SEV3/SEV4 | Owner optional but recommended |

Transfer: update INCIDENT_LOG · notify stakeholders · incoming reads full timeline before actions.

**Never transfer SEV1 mid-rollback execution** without sync call.

---

## Rollback Ownership

| Phase | Owner |
|-------|-------|
| Rollback decision | Release owner |
| Rollback execution | Delegated ops (named) |
| Smoke verification | Independent verifier (can be incoming operator) |
| Reconcile + lock release | Release owner |

If owner unavailable during SEV1: pre-designated delegate from GOVERNANCE must act — document delegate name in repo or team wiki (not secrets).

---

## Unfinished Deployment Handling

**Paused mid-ritual** (common cases):

| Pause point | Safe? | Resume |
|-------------|-------|--------|
| Pre-checks incomplete | Yes | Incoming continues from step 1 |
| Staging pass, no GO | Yes | Incoming re-validates smoke if >2h |
| GO given, CI running | Careful | Monitor CI · do not second push |
| Post-deploy verify incomplete | **Risk** | Incoming completes verify or rollback |
| Rollback mid-execute | **No handoff** | Outgoing completes or sync call |

**Rule:** If uncertain, **NO-GO** and hold until owner sync.

Set `lifecycle.state` to reflect pause — do not leave as `promoted` with stale smoke.

---

## CI as Temporary Baton Holder

During `deploy-railway.yml`:

```text
holder: ci:deploy-railway
action_pending: deploy
accountable_human: <release owner>
```

Human owner remains accountable; CI is executor only.

On CI failure: baton returns to human operator · action `verify` or `rollback`.

---

## Forbidden Handoffs

- To agent (Cursor/Claude) as baton holder
- Without written handoff block
- During active rollback lock without owner ack
- "Someone will watch CI" without named human

---

## References

- `ops/rituals/DAILY_OPERATIONS.md`
- `ops/rituals/DEPLOY_RITUAL.md`
- `ops/state/CURRENT_STATUS.template.md` § Deployment Baton
- `ops/state/GOVERNANCE.md`
