# OSCTL Drift Detection

**Freeze ID:** `osctl-freeze/1.5`  
**Implementation:** `verify/reconcile.py`, human reconciliation rituals

---

## Drift Classes

| Class | Definition | Detected by core? |
|-------|------------|-------------------|
| **Projection drift** | On-disk MD ≠ replay(L) | Yes — `verify` |
| **Ledger internal drift** | Invalid transitions, schema, rollback refs | Yes — `verify_ledger` |
| **Deploy mismatch** | Railway running ≠ last `deploy.recorded` | No — manual/CI observe |
| **Runtime mismatch** | Live health/env ≠ ingested payload | No — manual smoke |
| **Stale projection** | Ledger advanced; MD not re-projected | Yes — projection hash |
| **Unrecorded deploy** | Deploy happened; no ledger event | No — human audit |

Core detects **internal** and **projection** drift only. **External** drift requires human reconciliation.

---

## 1. Projection Drift

**Cause:** Manual MD edit, forgotten `project` after append, merge conflict in projections.

**Detection:**

```bash
python -m ops.osctl.core verify
```

**Error:** `projection mismatch: …/CURRENT_STATUS.md`

**Resolution:**

```bash
python -m ops.osctl.core project
python -m ops.osctl.core verify
```

Or git revert projection files to last verified commit.

---

## 2. Ledger Internal Drift

**Cause:** Invalid event sequence ingested, bad merge on JSONL, transition violation.

**Detection:** `verify_ledger()` errors.

**Examples:**

- `invalid transition: staging -> production`
- `rollback target_seq 99 not found in ledger`
- `env drift: missing or invalid DATABASE_URL`

**Resolution:**

1. Identify offending seq
2. Append compensating event (preferred) OR human-led ledger repair (merge/re-seq — explicit procedure)
3. `project` + `verify`

Never silent line edit without governance approval.

---

## 3. Deploy Mismatch

**Cause:** CI deployed artifact not recorded in ledger, or ledger records deploy that did not occur.

**Detection:** Human audit — compare Railway dashboard / GHA run vs latest `deploy.recorded`.

**Not automated in Phase 1.5.**

**Resolution:**

1. Human confirms actual state
2. Append correct `deploy.recorded` or `note` equivalent via human-approved ingest
3. `project` + `verify`

Reference: `ops/simulations/UNRECORDED_DEPLOY_DRIFT.md`

---

## 4. Runtime Mismatch

**Cause:** Ingested `health_status: ok` but prod broken; env vars changed outside recorded posture.

**Detection:** Smoke tests, human observation — not core probe.

**Resolution:**

1. Record incident (`incident.recorded`)
2. Assess rollback need per `ROLLBACK_POLICY.md`
3. Update ledger with corrected facts after human verification

---

## 5. Stale Projection

**Cause:** Ledger has seq N; projections reflect seq < N.

**Detection:**

- `verify` fingerprint mismatch
- Header `As of seq` < ledger line count

**Resolution:** `project` + `verify`

---

## Reconcile Procedure

For rollback recovery (ledger-level):

| Step | Actor | Action |
|------|-------|--------|
| 1 | Human | Execute external rollback (Railway/VPS) |
| 2 | Human | Run smoke validation |
| 3 | Human | Append `reconcile.recorded` with `verification_state: passed` |
| 4 | Operator | `project` + `verify` |
| 5 | Human | Resolve incident if applicable |

OSCTL records reconciliation — does not perform it.

For projection drift:

```bash
python -m ops.osctl.core project && python -m ops.osctl.core verify
```

---

## Drift Response Matrix

| Drift type | Auto-fix? | Authority |
|------------|-----------|-----------|
| Projection stale | Re-project only | Operator |
| Ledger invalid | No | Human |
| Deploy unrecorded | No | Human ingest |
| Runtime vs record | No | Human + optional new event |
| Secret/env wrong | No | Human (Railway dashboard) |

**Verify never mutates state.**

---

## Weekly Reconciliation

Human ritual: `ops/rituals/WEEKLY_RECONCILIATION.md`

Compare:

- Ledger last seq vs Railway active deployment
- Verify exit code
- Open incidents vs blockers in CURRENT_STATUS

---

## Related

- `VERIFY_MODEL.md` — detection layers
- `ROLLBACK_POLICY.md` — rollback recovery
- `ops/osctl/validation/FAILURE_CASES.md` — negative tests
