# OSCTL Core

Minimal deterministic append-only ledger engine — **stdlib Python 3 only**, local filesystem, no network.

## Layout

```
ops/osctl/core/
├── __main__.py          # python -m ops.osctl.core
├── schema/
│   ├── events.py        # Event types + validation
│   ├── transitions.py   # Lifecycle rules
│   └── serialize.py     # Canonical JSON + hashes + UTC normalize
├── ledger/
│   ├── paths.py         # Default ledger/projection paths
│   └── store.py         # Append-only JSONL read/write
├── projection/
│   ├── fold.py          # Ledger → state
│   └── render.py        # State → *.generated.md
├── replay/
│   └── engine.py        # replay(events) → projections
├── verify/
│   └── engine.py        # Schema, replay consistency, drift
└── cli/
    └── main.py          # append | replay | verify
```

## Paths

| Artifact | Default |
|----------|---------|
| Ledger | `ops/osctl/ledger/events.jsonl` |
| Projections | `ops/osctl/projections/CURRENT_STATUS.generated.md`, `DEPLOYMENT_STATE.generated.md` |

## CLI

```bash
python -m ops.osctl.core append --file path/to/event.json
python -m ops.osctl.core replay
python -m ops.osctl.core verify
```

## Event types

- `deploy.recorded`
- `rollback.recorded`
- `reconcile.recorded`
- `incident.recorded`

Spec version: `osctl-core/1.0`

## Non-goals

No deploy, Railway, CI, secrets, or runtime mutation — see `ops/osctl/NON_GOALS.md`.
