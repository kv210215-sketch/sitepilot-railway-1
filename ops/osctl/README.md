# OSCTL — Operational State Control

**Freeze ID:** `osctl-freeze/1.5`  
**Core spec:** `osctl-core/1.0`  
**Status:** Architecture frozen — deterministic core validated

---

## What OSCTL Is

Deterministic operational state governance for SitePilot:

```text
Human / CI (external) → append events → ledger (source of truth)
                              ↓ replay
                         projections (CURRENT_STATUS, DEPLOYMENT_STATE)
                              ↓ verify
                         operators / agents (read — decide externally)
```

OSCTL **records**, **replays**, and **verifies** — it does not deploy, provision, or auto-recover.

---

## Quick Start

```bash
python -m ops.osctl.core project
python -m ops.osctl.core verify
python -m ops.osctl.core append --file path/to/event.json
python ops/osctl/validation/run_validation.py
```

| Artifact | Path |
|----------|------|
| Ledger | `ops/state/ledger/events.jsonl` |
| Projections | `ops/state/projections/` |
| Core | `ops/osctl/core/` |

---

## Governance Documents (Frozen)

| Document | Purpose |
|----------|---------|
| [FREEZE_v1.md](./FREEZE_v1.md) | **Official Phase 1.5 lock snapshot** |
| [ARCHITECTURE_FREEZE.md](./ARCHITECTURE_FREEZE.md) | Freeze declaration |
| [GOVERNANCE.md](./GOVERNANCE.md) | Role and authority model |
| [TRUST_MODEL.md](./TRUST_MODEL.md) | Guarantees and non-claims |
| [HUMAN_BOUNDARIES.md](./HUMAN_BOUNDARIES.md) | Human vs automatable vs forbidden |
| [LEDGER_MODEL.md](./LEDGER_MODEL.md) | Append-only store |
| [EVENT_SCHEMA.md](./EVENT_SCHEMA.md) | Event types and fields |
| [STATE_MACHINE.md](./STATE_MACHINE.md) | Lifecycle transitions |
| [SERIALIZATION_RULES.md](./SERIALIZATION_RULES.md) | Canonical bytes |
| [PROJECTION_RULES.md](./PROJECTION_RULES.md) | Ledger → MD mapping |
| [REPLAY_GUARANTEES.md](./REPLAY_GUARANTEES.md) | Determinism contract |
| [VERIFY_MODEL.md](./VERIFY_MODEL.md) | Verification layers |
| [DRIFT_DETECTION.md](./DRIFT_DETECTION.md) | Mismatch handling |
| [ROLLBACK_POLICY.md](./ROLLBACK_POLICY.md) | Rollback semantics |
| [NON_GOALS.md](./NON_GOALS.md) | Explicit exclusions |

Supporting: [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md), [BOUNDARIES.md](./BOUNDARIES.md), [validation/](./validation/)

---

## Validation

19/19 tests pass — see `ops/osctl/validation/`.

---

## Phase Status

| Phase | Status |
|-------|--------|
| 1.5 | **Frozen (now)** |
| 2 | CI observe-only ingest (not implemented) |
| 3 | CI verify gate (not implemented) |
| 4 | Ledger sync policy (not implemented) |

No automation authorized by this freeze.
