# OSCTL Projection Rules

**Freeze ID:** `osctl-freeze/1.5`  
**Implementation:** `ops/osctl/core/project/fold.py`, `render.py`

---

## Principle

Projections are **pure functions of ledger replay**. No hidden state, no memory-derived fields, no manual mutation as truth.

```text
events.jsonl → fold_events() → state → render_projections() → {CURRENT_STATUS.md, DEPLOYMENT_STATE.md}
```

---

## Output Paths

| Projection | Path |
|------------|------|
| `CURRENT_STATUS.md` | `ops/state/projections/CURRENT_STATUS.md` |
| `DEPLOYMENT_STATE.md` | `ops/state/projections/DEPLOYMENT_STATE.md` |

Regenerate:

```bash
python -m ops.osctl.core replay
```

(`project` subcommand aliases `replay` in `core/cli/main.py`.)

---

## Forbidden

| Action | Why |
|--------|-----|
| Manual edit to assert deploy facts | Creates drift; use ledger append + replay |
| CI direct MD write | Bypasses replay |
| Read external files during render | Breaks purity |
| Clock/time.now in render | Non-deterministic |
| Random IDs in render | Non-deterministic |

Static template labels (e.g. deploy channel string) are fixed constants — not runtime-derived.

---

## Fold: Ledger → State

`fold_events()` produces internal state dict. Key fields:

| State field | Source events |
|-------------|---------------|
| `lifecycle_state` | Latest lifecycle-bearing `.recorded` deploy/rollback/reconcile |
| `active_release_id`, `active_git_sha`, `active_seq` | Latest `deploy.recorded` |
| `active_url`, `active_health` | Latest `deploy.recorded` payload |
| `rollback_active`, `rollback_target_*` | Latest `rollback.recorded` / cleared by `reconcile.recorded` |
| `verification_state` | Latest deploy or reconcile payload |
| `open_incidents`, `resolved_incidents` | `incident.recorded` by status |
| `journal_entries` | deploy, rollback, reconcile events in order |
| `last_seq` | Highest event seq processed |
| `transition_errors` | Invalid transitions detected during fold |

No filesystem or network access during fold.

---

## Render: State → Markdown

### CURRENT_STATUS.md

| Section | Deterministic source |
|---------|---------------------|
| Header | `SPEC_VERSION`, `last_seq` |
| Active Release | `active_release_id`, `active_git_sha`, `active_service`, `lifecycle_state` |
| Environment | `active_url`, `active_health` |
| Known Blockers | `open_incidents` |
| Deployment Baton | `rollback_active` |
| Rollback Target | `rollback_target_seq`, `rollback_target_release_id`, `rollback_target_git_sha` |
| Verification Status | `verification_state`, `active_seq` |
| Metadata | `last_seq`, spec |

### DEPLOYMENT_STATE.md

| Section | Deterministic source |
|---------|---------------------|
| Header | `SPEC_VERSION`, journal entry count |
| Journal entries | One block per `journal_entries` item — ordered by seq |
| Rollback Pointers | `rollback_active`, `rollback_target_*`, `last_seq` |

Entry fields mapped directly from fold journal — no inference beyond stored payload.

---

## Projection Invalidation Rules

| Event | Invalidates |
|-------|-------------|
| Any new ledger append | All projections — must re-run `project` |
| Manual MD edit | Projections stale until `project` or git revert |
| Verify failure | Projections untrusted until fixed |

**Rule:** After append, always `project` then `verify`.

---

## Drift vs Correctness

| Condition | Meaning |
|-----------|---------|
| `verify` pass | On-disk MD = replay bytes |
| `verify` projection mismatch | Stale or hand-edited MD |
| Ledger invalid | Project may render but verify fails on transitions/schema |

---

## Section Order

Section order is **fixed in render.py**. Changes require spec bump and validation re-run.

---

## CLI Output

```bash
python -m ops.osctl.core project
# projected 2 files to ops/state/projections
# fingerprint: <sha256>
```

Fingerprint covers both files — see `SERIALIZATION_RULES.md`.

---

## Related

- `REPLAY_GUARANTEES.md` — determinism contract
- `DRIFT_DETECTION.md` — mismatch handling
- `PROJECTION_RULES.md` ← this document
