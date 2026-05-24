# OSCTL Core — Trust Model

**Version:** Phase 1 core (`osctl-core/1.0`)  
**Validated:** 2026-05-23

---

## What You Can Trust

### 1. Recorded history is append-only

- Events are written with `O_APPEND` — no update/delete API in core.
- `seq` is monotonic `1..N`; gaps rejected on read.
- Canonical JSON line format on write.

**Trust statement:** If `read_events()` succeeds, the ledger has consistent sequential numbering.

---

### 2. Projections are pure functions of the ledger

```text
events.jsonl  →  fold_events()  →  state  →  render_projections()  →  *.md
```

- No network, clock, or external file reads during fold/render.
- Same ledger bytes → same fingerprint (`projection_fingerprint`).

**Trust statement:** Regenerating projections via `python -m ops.osctl.core project` yields authoritative derived state.

---

### 3. Verification detects structural invalidity

`verify_all()` checks:

| Layer | Checks |
|-------|--------|
| Schema | Required fields, types, spec_version, ts format |
| Transitions | Lifecycle state machine |
| Rollback | Target seq exists, is successful deploy |
| Production env | Required key names in env_posture |
| Drift | On-disk projections match replay hash |

**Trust statement:** `verify` exit 0 means ledger + projections are internally consistent per spec.

---

### 4. Deterministic serialization

- Stable key order, compact separators, ASCII-only escapes.
- Identical dict content → identical bytes.

**Trust statement:** Event equality can be compared by canonical line bytes.

---

## What You Cannot Trust (Explicit Non-Claims)

| Claim | Reality |
|-------|---------|
| "Production is healthy" | Core records `health_status` from ingest payload — does not probe endpoints |
| "Deploy happened" | Core records human/CI assertion — does not call Railway |
| "Rollback executed" | Core records intent + target — does not redeploy |
| "Secrets are correct" | Only key **names** checked in env_posture |
| "Ledger is tamper-proof" | No cryptographic hash chain in v1.0 |
| "Single writer enforced" | Filesystem append only — concurrent writers not serialized |

---

## Trust Boundaries

```text
┌─────────────────────────────────────────┐
│  TRUSTED (core guarantees)               │
│  • Ledger seq integrity                  │
│  • Transition rules                      │
│  • Projection replay                     │
│  • Drift detection (ledger vs MD)        │
└─────────────────┬───────────────────────┘
                  │ records assertions
┌─────────────────▼───────────────────────┐
│  UNTRUSTED (external, human/CI owned)    │
│  • Railway runtime state                 │
│  • Actual git refs on remote             │
│  • Smoke test outcomes (unless ingested) │
│  • Secret values                         │
└─────────────────────────────────────────┘
```

---

## Actors and Authority

| Actor pattern | May append | Authority level |
|---------------|------------|-----------------|
| `human:*` | Yes (with ritual) | Production gate, rollback mark, reconcile |
| `ci:*` | Yes (Phase 2+) | Deploy observation only — no rollback |
| `agent:*` | No (direct) | Draft only — human approves ingest |

Core validates **shape and consistency**, not **actor identity policy** (future Phase 2 gate).

---

## Verification Workflow (Recommended)

```bash
# After any ledger append or manual projection edit:
python -m ops.osctl.core project
python -m ops.osctl.core verify
```

Treat non-zero verify as **blocker** for relying on projections.

---

## Trust Inheritance

| Artifact | Trust derives from |
|----------|-------------------|
| `CURRENT_STATUS.md` | Ledger replay + verify pass |
| `DEPLOYMENT_STATE.md` | Ledger replay + verify pass |
| `events.jsonl` | Append discipline + human/CI ingest policy |

Projections are **derived, disposable** — ledger is **source of truth**.
