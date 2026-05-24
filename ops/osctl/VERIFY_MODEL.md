# OSCTL Verify Model

**Freeze ID:** `osctl-freeze/1.5`  
**Implementation:** `ops/osctl/core/verify/reconcile.py`

---

## Purpose

`verify` answers: **Is the ledger internally consistent, and do on-disk projections match replay?**

It does **not** answer: **Is production actually healthy?**

---

## Command

```bash
python -m ops.osctl.core verify
python -m ops.osctl.core verify --ledger <path> --output <projection_dir>
```

| Exit code | Meaning |
|-----------|---------|
| 0 | All checks pass |
| 1 | One or more errors |

---

## Verification Layers

### Layer 1 — Event schema

Per event, via `validate_event()`:

| Check | Error example |
|-------|---------------|
| Required fields present | `missing field: ts` |
| `spec_version` | Must be `osctl-core/1.0` |
| `seq` | Must match index |
| `ts` format | UTC ISO8601 with `Z` |
| `actor`, `env` | Non-empty strings |
| `type` | Closed enum |
| Payload | Per-type schema |

### Layer 2 — Lifecycle transitions

Via `validate_lifecycle_transition()` on deploy/rollback/reconcile events:

| Check | Error example |
|-------|---------------|
| Allowed transition | — |
| Forbidden transition | `forbidden transition: failed -> production` |
| Unknown state | `unknown lifecycle state: …` |
| Invalid transition | `invalid transition: staging -> production` |

Also accumulated in `fold_events()` → `transition_errors`.

### Layer 3 — Rollback integrity

When `rollback_active`:

| Check | Error example |
|-------|---------------|
| Target seq present | `rollback active but rollback_target_seq missing` |
| Target exists in ledger | `rollback target_seq 99 not found in ledger` |
| Target is deploy | `target_seq N is not deploy.recorded` |
| Target succeeded | `target_seq N is not a successful deploy` |

### Layer 4 — Production environment posture

On `deploy.recorded` where `env == production`:

| Check | Error example |
|-------|---------------|
| Required keys in `keys_present` | `env drift: missing or invalid JWT_SECRET` |
| `db_sync == false` | `env drift: … DB_SYNC must be false …` |

Key **names** only — never values.

### Layer 5 — Projection drift

Via `verify_projection_match()`:

| Check | Error example |
|-------|---------------|
| File exists | `projection missing on disk: …` |
| Byte identity | `projection mismatch: …/CURRENT_STATUS.md` |

Compares SHA-256 of on-disk UTF-8 vs replay-rendered content.

---

## Composite Verify

`verify_all(events, projection_dir)`:

```text
errors = verify_ledger(events) + verify_projection_match(events, projection_dir)
```

All errors reported — not fail-fast on first.

---

## Fingerprint

On success, CLI prints:

```text
verify ok — N events, fingerprint <sha256>
```

Fingerprint = `projection_fingerprint(events)` — stable identity of replay output.

---

## What Verify Does Not Check

| Gap | Reason |
|-----|--------|
| Railway live state | No network |
| Git SHA on remote | No git calls |
| Endpoint health | No HTTP |
| Secret values | Names only |
| Actor authorization | Policy layer deferred |
| Hash chain / tamper | Not implemented v1.0 |
| Concurrent write safety | Filesystem policy |

---

## Recommended Workflow

```bash
# After append or any projection touch:
python -m ops.osctl.core project
python -m ops.osctl.core verify
```

Treat verify failure as **blocker** for operational decisions based on projections.

---

## Negative Test Coverage

Validated in `ops/osctl/validation/run_validation.py`:

- Invalid transition
- Rollback target missing
- Environment mismatch
- Malformed event
- Projection drift

See `ops/osctl/validation/FAILURE_CASES.md`.

---

## Related

- `DRIFT_DETECTION.md` — mismatch taxonomy
- `TRUST_MODEL.md` — trust claims
- `REPLAY_GUARANTEES.md` — determinism
