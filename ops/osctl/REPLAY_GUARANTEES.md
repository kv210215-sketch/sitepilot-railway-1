# OSCTL Replay Guarantees

**Freeze ID:** `osctl-freeze/1.5`  
**Core spec:** `osctl-core/1.0`  
**Validated:** 19/19 PASS

---

## Replay Contract

```text
∀ ledger L with events [e₁…eₙ] in order:
  fold_events(L) = S
  render_projections(S) = P
  projection_fingerprint(L) = SHA256(P) = F

Replay(L) twice → identical S, P, F
```

**Input:** Fixed byte content of `events.jsonl`  
**Output:** Deterministic state dict and projection files  
**No side effects:** Pure computation

---

## Deterministic Replay Functions

| Function | Pure | Location |
|----------|------|----------|
| `read_events(path)` | Yes* | `ledger/store.py` |
| `fold_events(events)` | Yes | `project/fold.py` |
| `render_projections(state)` | Yes | `project/render.py` |
| `projection_fingerprint(events)` | Yes | `verify/reconcile.py` |

*Read is deterministic given fixed file bytes.

---

## Projection Rebuild Guarantee

```bash
python -m ops.osctl.core project
```

Given valid ledger:

1. Folds all events in seq order
2. Renders both projections
3. Writes UTF-8 files with `\n` endings
4. Prints fingerprint

**Guarantee:** Same ledger → same file bytes → same fingerprint.

---

## Projection Invalidation Rules

| Trigger | Required action |
|---------|-----------------|
| New event appended | Re-run `project` |
| Ledger git merge resolved | Re-run `project` |
| Manual projection edit | Re-run `project` or revert MD |
| Core version change (spec bump) | Re-run `project` + validation suite |

Stale projections are **invalid truth** — even if readable.

---

## Replay Failure Behavior

| Failure | Behavior | Exit |
|---------|----------|------|
| Invalid JSON line | `read_events` raises | CLI exit 1 |
| Seq gap | `read_events` raises | CLI exit 1 |
| Schema invalid on append | `append_event` rejects write | CLI exit 1 |
| Invalid transition in ledger | Fold records error; `verify_ledger` reports | verify exit 1 |
| Missing projection file | `verify_projection_match` reports missing | verify exit 1 |
| Projection byte mismatch | `verify_projection_match` reports mismatch | verify exit 1 |

**No auto-repair.** Human fixes ledger or re-runs `project`.

---

## Evidence Scenarios

| Scenario | Events | verify | Fingerprint stable |
|----------|--------|--------|-------------------|
| clean-deploy-chain | 4 | 0 errors | PASS |
| rollback-chain | 3 | 0 errors | PASS |
| reconcile-flow | 4 | 0 errors | PASS |
| production ledger | 5 | 0 errors | PASS |

Fixtures: `ops/osctl/validation/scenarios/`

---

## Non-Deterministic Inputs (Excluded)

These are **outside** replay guarantee:

| Input | Owner |
|-------|-------|
| Caller-supplied `ts` | Human/CI at append time |
| Manual MD edits | Operator |
| Concurrent append race | Operator policy |
| External runtime state | Railway/infra |

---

## Verification Command

```bash
python ops/osctl/validation/run_validation.py
python -m ops.osctl.core verify
```

---

## Related

- `SERIALIZATION_RULES.md` — byte identity
- `PROJECTION_RULES.md` — field mapping
- `ops/osctl/validation/REPLAY_TESTS.md` — test matrix
