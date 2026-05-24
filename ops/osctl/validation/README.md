# OSCTL Core Validation

Deterministic integrity validation for `ops/osctl/core/`. **Validation only** — no orchestration, deploy, or network.

## Run

```bash
python ops/osctl/validation/run_validation.py
python -m ops.osctl.core verify
```

## Artifacts

| Document | Purpose |
|----------|---------|
| [DETERMINISM_REPORT.md](./DETERMINISM_REPORT.md) | Serialization, replay, fingerprint evidence |
| [REPLAY_TESTS.md](./REPLAY_TESTS.md) | Scenario matrix and reproduction steps |
| [FAILURE_CASES.md](./FAILURE_CASES.md) | Negative cases verify must detect |
| [TRUST_MODEL.md](./TRUST_MODEL.md) | Guarantees and explicit non-claims |
| [WHAT REMAINS MANUAL.md](./WHAT%20REMAINS%20MANUAL.md) | Human authority boundaries |

## Scenarios

| Directory | Purpose |
|-----------|---------|
| `scenarios/clean-deploy-chain/` | staging → validating → promoted → production |
| `scenarios/rollback-chain/` | failed deploy + rollback to prior seq |
| `scenarios/reconcile-flow/` | rollback + reconcile |
| `scenarios/invalid-transition/` | forbidden staging → production |
| `scenarios/rollback-target-missing/` | target_seq not in ledger |
| `scenarios/environment-mismatch/` | production env_posture drift |
| `scenarios/malformed-event/` | schema rejection sample |
| `scenarios/projection-mismatch/` | runtime drift injection (README only) |

## Result (2026-05-23)

**19/19 PASS** — core is deterministic, replayable, and verifiable within stated boundaries.
