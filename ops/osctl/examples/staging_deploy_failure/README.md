# Staging Deploy Failure — Rehearsal

**Environment:** staging  
**Events:** 3  
**Fingerprint:** `e8316efc85da2e7bc73e8fc132f208197b4bca704cff8c42e126bcc0ceb0152c`

---

## 1. Scenario Description

| Field | Value |
|-------|-------|
| What happened | Staging deploy succeeded; validation failed (migration smoke timeout) |
| Environment | `staging` |
| Expected lifecycle end | `failed` |
| Expected ledger events | 3 × `deploy.recorded` (last status=failed) |

Blocks production GO/NO-GO. No rollback — staging failure only.

---

## 2. Event Sequence

```text
None → staging        (seq 1, CI deploy success)
staging → validating   (seq 2, CI smoke in progress)
validating → failed    (seq 3, human records failure)
```

---

## 3. Example Ledger

See `events.jsonl`.

---

## 4. Replay Result

```bash
python -m ops.osctl.core replay \
  --ledger ops/osctl/examples/staging_deploy_failure/events.jsonl \
  --output ops/osctl/examples/staging_deploy_failure/projections
```

| Output | Key fields |
|--------|------------|
| `CURRENT_STATUS.generated.md` | `lifecycle_state: failed`, `health: degraded`, release `r20260526-stg002` |
| `DEPLOYMENT_STATE.generated.md` | 3 entries; seq 3 shows `status: failed`, `verification_state: failed` |

---

## 5. Verify Result

| Check | Result |
|-------|--------|
| Schema | PASS |
| Transitions | PASS |
| Replay consistency | PASS |
| Projection drift | PASS |
| **Overall** | **PASS** |

---

## 6. Human Checkpoints

| Checkpoint | Actor | This scenario |
|------------|-------|---------------|
| GO/NO-GO for prod | Human | **NO-GO** implied by failed lifecycle |
| Rollback approval | Human | N/A (staging only) |
| Severity classification | Human | Optional — not recorded here |
| Reconcile attestation | Human | N/A |
| Failure attestation | Human | **seq 3** — human records `failed` |

---

## 7. Drift Scenarios

| Drift type | Risk |
|------------|------|
| Unrecorded deploy | CI shows green; ledger still `validating` |
| Mismatched SHA | `refs.git_sha` ≠ `payload.git_sha` — **not detected by verify** |
| Missing verify | Failed state in ledger; projections show stale `validating` |

---

## 8. Recovery Semantics

Recovery path (not in this ledger):

```text
failed → planned  (new human-approved retry intent)
```

Operator must append new events — no ledger edit. Then `replay` + `verify`.

---

## 9. Operator Ergonomics

| Area | Observation |
|------|-------------|
| Confusing steps | Failure recorded as another `deploy.recorded` — same type as success |
| Naming friction | `status: failed` vs `lifecycle_state: failed` — both required |
| Replay readability | Journal clearly shows failure at seq 3 |
| Projection usability | Blockers section empty — failure not surfaced as blocker |
| Reconciliation complexity | Medium — must not proceed to prod without new events |

---

## 10. Final Assessment

| | |
|-|-|
| **Worked** | Failed lifecycle validates; verify PASS |
| **Ambiguous** | Failed staging does not auto-create incident event |
| **Improve before Phase 2** | Runbook: pair `failed` deploy with optional `incident.recorded` |
