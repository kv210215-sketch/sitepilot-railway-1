# Staging Deploy Success — Rehearsal

**Environment:** staging  
**Events:** 3  
**Fingerprint:** `dcbcb166e2224596bdc2f56da24e806708e2ff66c05da0683c6266ba65491e39`

---

## 1. Scenario Description

| Field | Value |
|-------|-------|
| What happened | CI deployed to staging; human ran staging validation; release promoted |
| Environment | `staging` |
| Expected lifecycle end | `promoted` |
| Expected ledger events | 3 × `deploy.recorded` |

Simulates happy-path staging gate before production GO/NO-GO. No production events. No infra actions performed.

---

## 2. Event Sequence

```text
None → staging        (seq 1, CI deploy)
staging → validating   (seq 2, CI smoke start)
validating → promoted  (seq 3, human sign-off)
```

---

## 3. Example Ledger

See `events.jsonl` in this directory.

---

## 4. Replay Result

```bash
python -m ops.osctl.core replay \
  --ledger ops/osctl/examples/staging_deploy_success/events.jsonl \
  --output ops/osctl/examples/staging_deploy_success/projections
```

| Output | Key fields |
|--------|------------|
| `CURRENT_STATUS.generated.md` | `lifecycle_state: promoted`, active release `r20260526-stg001`, seq 3 |
| `DEPLOYMENT_STATE.generated.md` | 3 journal entries (deploy chain on staging) |

Excerpt — CURRENT_STATUS:

```markdown
| Lifecycle state | `promoted` |
| Release ID | `r20260526-stg001` |
| As of seq | `3` |
```

---

## 5. Verify Result

| Check | Result |
|-------|--------|
| Schema | PASS |
| Transitions | PASS |
| Replay consistency | PASS |
| Projection drift | PASS (after replay) |
| **Overall** | **PASS** |

| State | Value |
|-------|-------|
| Drift | none |
| Projection hash | matches replay |
| Replay | stable fingerprint |

---

## 6. Human Checkpoints

| Checkpoint | Actor | This scenario |
|------------|-------|---------------|
| GO/NO-GO for prod | Human | **Not yet** — staging promoted only |
| Rollback approval | Human | N/A |
| Severity classification | Human | N/A |
| Reconcile attestation | Human | N/A |
| Staging promotion | Human | **seq 3** — `human:andriy` sets `promoted` |

---

## 7. Drift Scenarios (Relevant)

| Drift type | Risk here |
|------------|-----------|
| Stale projection | Operator promotes in ledger but skips `replay` |
| Unrecorded deploy | CI deploys staging but no append |
| Missing verify | Promotion recorded; projections never refreshed |

---

## 8. Recovery Semantics

Not applicable — success path. If staging smoke fails, see `staging_deploy_failure/`.

Post-append discipline:

```bash
python -m ops.osctl.core replay --ledger ... --output .../projections
python -m ops.osctl.core verify --ledger ... --output .../projections
```

---

## 9. Operator Ergonomics

| Area | Observation |
|------|-------------|
| Confusing steps | Three separate `deploy.recorded` for one release — operator must understand lifecycle progression |
| Naming friction | `promoted` on staging env — not yet production |
| Replay readability | Clear journal chain in DEPLOYMENT_STATE |
| Projection usability | CURRENT_STATUS shows last deploy fields (staging URL) |
| Reconciliation complexity | Low — no rollback |

---

## 10. Final Assessment

| | |
|-|-|
| **Worked** | Valid transition chain; verify PASS; promoted state visible |
| **Ambiguous** | Whether seq 2 and 3 should both be `deploy.recorded` vs separate event types (Phase 2) |
| **Improve before Phase 2** | Document single-release multi-event pattern in operator runbook |
