# Drift Detection — Rehearsal

**Environment:** production  
**Events:** 1 (base ledger)  
**Fingerprint:** `e8e842b0b77031cfe40711d385be355102bdd3e5cdf3d8a83a6f451db8fc53f6`

---

## 1. Scenario Description

| Field | Value |
|-------|-------|
| What happened | Single recorded prod deploy — base truth for drift injection exercises |
| Environment | `production` |
| Expected lifecycle end | `production` |
| Expected ledger events | 1 × `deploy.recorded` |

Rehearses **detection** of mismatches between ledger, projections, and external reality. No infra mutation.

---

## 2. Event Sequence

```text
None → production  (seq 1, recorded deploy)
```

---

## 3. Example Ledger

See `events.jsonl`.

---

## 4. Replay Result

```bash
python -m ops.osctl.core replay \
  --ledger ops/osctl/examples/drift_detection/events.jsonl \
  --output ops/osctl/examples/drift_detection/projections
```

| Output | Key fields |
|--------|------------|
| `CURRENT_STATUS.generated.md` | release `r20260528-prod001`, lifecycle `production`, seq 1 |
| `DEPLOYMENT_STATE.generated.md` | 1 journal entry |

---

## 5. Verify Result

### Base ledger (clean)

| Check | Result |
|-------|--------|
| Schema | PASS |
| Replay consistency | PASS |
| Projection drift | PASS |
| **Overall** | **PASS** |

### Injected drift variants (rehearsed)

| Variant | Injection | Verify |
|---------|-----------|--------|
| **Stale projection** | Append `<!-- stale -->` to CURRENT_STATUS.generated.md | **FAIL** — `projection mismatch: ...CURRENT_STATUS.generated.md` |
| **Missing projection** | Delete projection files | **FAIL** — `projection missing on disk` |
| **Unrecorded deploy** | Railway has newer deploy; ledger unchanged | **PASS** (false negative — external drift) |
| **Mismatched SHA** | `refs.git_sha` ≠ `payload.git_sha` | **PASS** (not validated — ambiguity) |
| **Missing verify** | Operator skips verify after append | Undetected until next verify |
| **Replay inconsistency** | Core bug — not reproduced | N/A |

Recovery for stale projection:

```bash
python -m ops.osctl.core replay --ledger ... --output ...
python -m ops.osctl.core verify --ledger ... --output ...
```

---

## 6. Human Checkpoints

| Checkpoint | Actor | This scenario |
|------------|-------|---------------|
| GO/NO-GO | Human | Assumed passed at record time |
| Rollback approval | Human | N/A |
| Severity | Human | N/A |
| Reconcile attestation | Human | N/A |
| **Drift investigation** | **Human** | Required for unrecorded deploy / SHA mismatch |

---

## 7. Drift Scenarios (Primary Focus)

This scenario exists to rehearse all drift classes from `DRIFT_DETECTION.md`:

1. **Projection drift** — detected by verify (demonstrated)
2. **Ledger internal drift** — see `validation/scenarios/invalid-transition/`
3. **Deploy mismatch** — manual audit: Railway dashboard vs seq 1
4. **Runtime mismatch** — smoke fails but ledger says `health_status: ok`
5. **Stale projection** — ledger at seq N, MD at seq N-1

---

## 8. Recovery Semantics

| Drift | Recovery |
|-------|----------|
| Stale/missing projection | `replay` + `verify` |
| Unrecorded deploy | Human appends `deploy.recorded` |
| SHA mismatch | Human appends correcting event; verify does not auto-detect |
| Runtime mismatch | `incident.recorded` + human investigation |

---

## 9. Operator Ergonomics

| Area | Observation |
|------|-------------|
| Confusing steps | Verify PASS does not mean Railway matches ledger |
| Naming friction | "Drift" covers multiple unlike failure modes |
| Replay readability | Simple single-event case — good baseline |
| Projection usability | `.generated.md` suffix clarifies derived nature |
| Reconciliation complexity | External drift requires human audit outside CLI |

---

## 10. Final Assessment

| | |
|-|-|
| **Worked** | Projection drift detection; replay restores consistency |
| **Ambiguous** | Verify PASS implies internal consistency only — not runtime truth |
| **Improve before Phase 2** | Weekly reconciliation checklist; optional SHA cross-field validation |
