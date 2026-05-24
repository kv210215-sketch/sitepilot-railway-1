# OSCTL Operational Rehearsals

Realistic deployment simulations for the frozen OSCTL governance system (`FREEZE_v1`).

**Not performed:** deploy, rollback execution, Railway/Cloudflare mutation, automation.

## Run All Rehearsals

```bash
python ops/osctl/examples/run_rehearsals.py
```

Per scenario:

```bash
python -m ops.osctl.core replay \
  --ledger ops/osctl/examples/<scenario>/events.jsonl \
  --output ops/osctl/examples/<scenario>/projections

python -m ops.osctl.core verify \
  --ledger ops/osctl/examples/<scenario>/events.jsonl \
  --output ops/osctl/examples/<scenario>/projections
```

## Scenarios

| Scenario | Events | Lifecycle end | Verify | Fingerprint (prefix) |
|----------|--------|---------------|--------|----------------------|
| [staging_deploy_success](./staging_deploy_success/) | 3 | `promoted` | PASS | `dcbcb166…` |
| [staging_deploy_failure](./staging_deploy_failure/) | 3 | `failed` | PASS | `e8316efc…` |
| [rollback_rehearsal](./rollback_rehearsal/) | 4 | `rollback` | PASS | `ab0ab863…` |
| [drift_detection](./drift_detection/) | 1 | `production` | PASS* | `e8e842b0…` |
| [reconcile_flow](./reconcile_flow/) | 5 | `reconciled` | PASS | `ab1df612…` |
| [operator_handoff](./operator_handoff/) | 3 | `production` | PASS | `74033f5e…` |

*Drift variants documented in scenario README; stale projection injection → FAIL.

## Legacy Single-Event Examples

Root-level `deploy-event.json`, `rollback-event.json`, `reconcile-event.json` are draft-shape references (pre-`osctl-core/1.0`). Use scenario `events.jsonl` files for canonical rehearsals.

See [REHEARSAL_SUMMARY.md](./REHEARSAL_SUMMARY.md) for cross-scenario assessment.
