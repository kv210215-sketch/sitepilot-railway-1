# OSCTL Trust Model

**Freeze ID:** `osctl-freeze/1.5`  
**Core spec:** `osctl-core/1.0`  
**Validated:** 2026-05-23 (19/19 validation tests pass)

---

## Trust Statement

Given a fixed `events.jsonl` byte sequence, OSCTL core provides:

| Property | Guarantee |
|----------|-----------|
| Deterministic | Identical ledger → identical projections |
| Append-only | No mutation API; monotonic `seq` |
| Replayable | `fold_events` + `render_projections` are pure |
| Verifiable | `verify` detects schema, transition, rollback, env, drift errors |
| Projection-safe | On-disk MD must match replay hash or verify fails |
| Human-governed | Core validates shape; authority is ritual/policy |

OSCTL is **not** autonomous, self-deploying, infrastructure-controlling, AI-operated, or auto-recovering.

---

## Trusted (Core Guarantees)

### 1. Ledger integrity

- Events written via `O_APPEND` only
- `seq` is contiguous `1..N` on read
- Canonical JSON line on append (`SERIALIZATION_RULES.md`)

### 2. Projection purity

```text
events.jsonl → fold_events() → state → render_projections() → *.md
```

- No network, filesystem reads, or clock access in fold/render
- Fingerprint stable across repeated runs (`projection_fingerprint`)

### 3. Verification coverage

| Layer | Detects |
|-------|---------|
| Schema | Missing fields, invalid types, bad `ts`, wrong `spec_version` |
| Transitions | Forbidden lifecycle moves |
| Rollback | Missing target, non-deploy target, failed target |
| Production env | Missing required key names in `env_posture` |
| Drift | Projection bytes ≠ replay bytes |

### 4. Serialization determinism

Identical event dict → identical canonical line bytes.

---

## Not Trusted (Explicit Non-Claims)

| Claim | Reality |
|-------|---------|
| Production is healthy | Payload attestation only — no endpoint probe |
| Deploy occurred | Recorded assertion — no Railway API |
| Rollback executed | Intent recorded — no redeploy |
| Secrets correct | Key **names** only in `env_posture` |
| Ledger tamper-proof | No hash chain in `osctl-core/1.0` |
| Single writer enforced | Policy only — no file lock in core |
| Actor identity authorized | Schema accepts any non-empty `actor` |

---

## Trust Boundary Diagram

```text
┌──────────────────────────────────────────┐
│ TRUSTED — OSCTL core                      │
│ • seq integrity                           │
│ • transition rules                        │
│ • projection replay                       │
│ • drift detection (ledger vs projections) │
└──────────────────┬───────────────────────┘
                   │ records assertions
┌──────────────────▼───────────────────────┐
│ UNTRUSTED — external                      │
│ • Railway runtime                         │
│ • Git remote state                        │
│ • Smoke outcomes (unless ingested)        │
│ • Secret values                           │
└──────────────────────────────────────────┘
```

---

## Trust Inheritance

| Artifact | Derives trust from |
|----------|-------------------|
| `events.jsonl` | Append discipline + ingest policy |
| `CURRENT_STATUS.md` | Ledger replay + verify pass |
| `DEPLOYMENT_STATE.md` | Ledger replay + verify pass |

**Rule:** Projections are disposable. Ledger is source of truth.

---

## Verification Command

```bash
python -m ops.osctl.core project
python -m ops.osctl.core verify
```

Exit `0` = internally consistent per spec. Exit `1` = do not rely on projections.

---

## Related

- `VERIFY_MODEL.md` — verification layers
- `REPLAY_GUARANTEES.md` — determinism contract
- `ops/osctl/validation/` — evidence artifacts
