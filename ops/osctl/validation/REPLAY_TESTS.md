# OSCTL Core — Replay Tests

**Purpose:** Prove that ledger replay reproduces identical operational state and projections.  
**Runner:** `ops/osctl/validation/run_validation.py`  
**Status:** All replay tests PASS (2026-05-23)

---

## Test Matrix

| ID | Scenario | Events | verify_ledger | Fingerprint stable | Projection byte-identical |
|----|----------|--------|---------------|--------------------|---------------------------|
| R1 | clean-deploy-chain | 4 | 0 errors | PASS | PASS |
| R2 | rollback-chain | 3 | 0 errors | PASS | PASS |
| R3 | reconcile-flow | 4 | 0 errors | PASS | PASS |
| R4 | production ledger | 5 | 0 errors | PASS | PASS |

---

## Scenario Definitions

### R1 — Clean deploy chain

**Path:** `scenarios/clean-deploy-chain/events.jsonl`

Lifecycle path (valid transitions only):

```text
seq 1: None → staging
seq 2: staging → validating
seq 3: validating → promoted
seq 4: promoted → production
```

Production event includes `env_posture` with required keys and `db_sync: false`.

**Replay assertion:**

```python
fp1 = projection_fingerprint(events)
fp2 = projection_fingerprint(events)
render1 == render2  # CURRENT_STATUS.md + DEPLOYMENT_STATE.md
```

Fingerprint: `83ce6b0b574264a2…`

---

### R2 — Rollback chain

**Path:** `scenarios/rollback-chain/events.jsonl`

```text
seq 1: deploy production (success)
seq 2: deploy failed (production → failed)
seq 3: rollback.recorded (failed → rollback, target_seq=1)
```

Verify confirms rollback target seq 1 exists and is successful deploy.

Fingerprint: `86256d2fd463eb64…`

---

### R3 — Reconcile flow

**Path:** `scenarios/reconcile-flow/events.jsonl`

Extends R2:

```text
seq 4: reconcile.recorded (rollback → reconciled)
```

Post-reconcile state: `rollback_active=false`, `lifecycle_state=reconciled`.

Fingerprint: `48cbd2dd7d8ce715…`

---

### R4 — Production ledger

**Path:** `ops/state/ledger/events.jsonl`

Live repo ledger (5 events). CLI:

```bash
python -m ops.osctl.core verify
# verify ok — 5 events, fingerprint 6e461036d6334dae…
```

---

## Append-Only Replay

| Test | Method | Result |
|------|--------|--------|
| Sequential seq assignment | Temp ledger, 2 appends | seq 1, 2 — no gaps |
| No in-place mutation | Re-read after append | Bytes match canonical_dumps output |
| Chronological integrity | read_events seq check | `[1..N]` enforced |

Append uses `O_APPEND` — no overwrite path in `ledger/store.py`.

---

## Projection Regeneration

```bash
python -m ops.osctl.core project
python -m ops.osctl.core verify
```

If verify passes after project, on-disk projections are **exact replay** of ledger fold.

**Journal rule:** `DEPLOYMENT_STATE.md` entries derive solely from `journal_entries` populated during fold — no external reads.

---

## Reproduce Locally

```bash
cd <repo-root>
python ops/osctl/validation/run_validation.py
python -m ops.osctl.core project
python -m ops.osctl.core verify
```

Expected exit code: `0` for all three.
