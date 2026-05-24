# OSCTL Freeze v1 — Phase 1.5 Snapshot

**Document ID:** `FREEZE_v1`  
**Freeze ID:** `osctl-freeze/1.5`  
**Core spec:** `osctl-core/1.0`  
**Date:** 2026-05-23  
**Status:** **LOCKED**

Official governance + ledger core snapshot before Phase 2 automation. No new features authorized by this document.

---

## Snapshot Summary

| Item | Value |
|------|-------|
| Ledger | `ops/osctl/ledger/events.jsonl` (5 events) |
| Projections | `ops/osctl/projections/*.generated.md` |
| Validation | 19/19 PASS (`ops/osctl/validation/run_validation.py`) |
| Verify | PASS (`python -m ops.osctl.core verify`) |
| Projection fingerprint | `90178458ed000496df14a73fc76907094cdacfd27a4c65f75d4f1d3f7b2d6b52` |

---

## 1. Frozen Guarantees

### Deterministic serialization

| Rule | Implementation |
|------|----------------|
| Stable key ordering | Recursive lexicographic sort (`schema/serialize.py`) |
| Canonical JSON | `ensure_ascii=True`, separators `,` `:` |
| UTC normalization | `normalize_ts()` → `YYYY-MM-DDTHH:MM:SS.mmmZ` on append |
| Reproducible hashes | SHA-256 content hash + projection fingerprint |
| No random/time sources | No `random`, `uuid`, `time.time`, `datetime.now` in serialize path |

**Guarantee:** Identical event dict → identical canonical line bytes.

### Append-only semantics

| Rule | Implementation |
|------|----------------|
| Write mode | `O_APPEND` only (`ledger/store.py`) |
| Seq assignment | Monotonic `1..N`, assigned by core on append |
| Pre-write validation | Schema rejected events never enter ledger |
| No mutation API | No update, delete, or reorder |

**Guarantee:** Ledger history is append-only; gaps in seq rejected on read.

### Replay guarantees

| Rule | Implementation |
|------|----------------|
| Pure replay | `replay(events)` → `fold_events` → `render_projections` |
| No external I/O | No network, clock, or filesystem reads in replay path |
| Stability | Consecutive replays produce identical output and fingerprint |

**Guarantee:** `replay(L)` is a pure function of ledger bytes `L`.

### Projection guarantees

| Output | Path |
|--------|------|
| `CURRENT_STATUS.generated.md` | `ops/osctl/projections/` |
| `DEPLOYMENT_STATE.generated.md` | `ops/osctl/projections/` |

| Rule | Detail |
|------|--------|
| Source | Ledger events only — no hidden or memory-derived state |
| Regeneration | `python -m ops.osctl.core replay` |
| Manual edits | Invalid truth until re-replayed or reverted |

**Guarantee:** Projections are disposable derived artifacts; ledger is source of truth.

### Drift detection guarantees

| Check | Detected by |
|-------|-------------|
| Replay instability | `verify_replay_consistency()` |
| Schema / transition errors | `verify_ledger()` |
| Projection byte mismatch | `verify_projection_match()` — SHA-256 compare |
| Production env key names | `production_env_drift()` |

**Guarantee:** `verify` exit 0 means ledger + on-disk projections are internally consistent per spec.

### Immutable event model

| Property | Rule |
|----------|------|
| Post-append mutation | Forbidden — no API |
| Corrections | New compensating events only |
| Timestamp | Caller-supplied, normalized on append, stored immutably |
| Hash chain | Not implemented in v1.0 — deferred |

---

## 2. Human Authority Guarantees

The following operations are **permanently reserved for humans** (or human-delegated ops execution — never autonomous core/CI/agent):

| Operation | Authority |
|-----------|-----------|
| Production GO/NO-GO | Human owner |
| Rollback approval | Human owner |
| Rollback execution (Railway/VPS/DB) | Human owner or delegate |
| Rollback target selection | Human owner |
| Reconcile attestation ("smoke passed") | Human owner |
| Severity classification (SEV1–SEV4) | Human owner |
| Ambiguous incident resolution | Human owner |
| Secret creation and rotation | Human owner |
| Migration execution (`migration:run` / revert) | Human owner |
| Ledger append approval (prod assertions) | Human owner |
| Ledger JSONL merge conflict resolution | Human owner |
| Governance / freeze amendments | Human owner |
| Granting production authority to actors | Human owner |
| Deploy-blocking policy decisions | Human owner |

Agents may **draft** event JSON; humans **approve** production ingests.

---

## 3. Forbidden Behaviors

Explicitly forbidden — in core, CI hooks, agents, and Phase 2 integration:

| Forbidden | Rationale |
|-----------|-----------|
| **Autonomous deploy** | OSCTL records; does not trigger `railway up`, GHA, or push |
| **Autonomous rollback** | Rollback is human procedure; core records metadata only |
| **Infra mutation** | No Railway/Cloudflare/VPS/DNS/secret API calls |
| **AI production authority** | No agent may approve prod gate, append rollback, or release reconcile |
| **Self-healing production logic** | No auto-repair on verify failure, drift, or health mismatch |
| Deploy orchestration | `NON_GOALS.md` §1 |
| Runtime config mutation | `NON_GOALS.md` §4 |
| Secret read/write | `NON_GOALS.md` §3 |
| Ledger rewrite without governance | Append-only invariant |

---

## 4. Stable Interfaces (Frozen)

### Event schema (`osctl-core/1.0`)

| Field | Rule |
|-------|------|
| `spec_version` | Must be `osctl-core/1.0` |
| `seq` | Positive int; contiguous on read |
| `ts` | UTC ISO8601 ending `Z` |
| `actor` | Non-empty string |
| `type` | Closed enum (below) |
| `env` | Non-empty string |
| `payload` | Per-type schema |
| `refs` | Optional object |

**Event types (closed):**

- `deploy.recorded`
- `rollback.recorded`
- `reconcile.recorded`
- `incident.recorded`

Reference: `EVENT_SCHEMA.md`, `schema/events.py`

### Replay contract

```text
replay: list[Event] → dict[str, str]
  = render_projections(fold_events(events))

replay_fingerprint: list[Event] → sha256_hex
```

Reference: `replay/engine.py`, `REPLAY_GUARANTEES.md`

### Projection contract

| File | Content source |
|------|----------------|
| `CURRENT_STATUS.generated.md` | Active release, env, blockers, rollback, verification |
| `DEPLOYMENT_STATE.generated.md` | Journal entries from deploy/rollback/reconcile |

Reference: `projection/fold.py`, `projection/render.py`, `PROJECTION_RULES.md`

### Verify contract

```text
verify_all(events, projection_dir) → list[str]  # empty = pass
exit 0 | 1
```

Layers: replay consistency → schema → transitions → rollback target → prod env names → projection hash.

Reference: `verify/engine.py`, `VERIFY_MODEL.md`

### CLI surface (frozen)

```bash
python -m ops.osctl.core append --file <event.json> [--ledger <path>]
python -m ops.osctl.core replay [--ledger <path>] [--output <dir>]
python -m ops.osctl.core verify [--ledger <path>] [--output <dir>]
```

| Command | Exit 0 | Exit 1 |
|---------|--------|--------|
| `append` | Event written | Validation / IO error |
| `replay` | Projections written + fingerprint printed | Ledger read error |
| `verify` | All checks pass | Any check failure |

No other commands authorized without freeze bump.

---

## 5. Phase Boundary Lock

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1** | Manual operational governance — templates, rituals, human MD | Complete |
| **Phase 1.5** | Deterministic operational tooling — ledger core, replay, verify, governance docs | **LOCKED (this document)** |
| **Phase 2** | Semi-automated ingestion + CI verification — external callers invoke CLI only | Not started |
| **Phase 3** | CI-managed deployment truth — verify gates, fingerprint policy | Not started |
| **Phase 4** | Ledger sync policy — still not deploy orchestration | Not defined |

**Phase 1.5 → 2 gate:** Human owner approves CI observe-only plan. Core semantics unchanged.

**Hard boundary:** Phases 2–4 may call `append` / `replay` / `verify`. They may not add orchestration, infra control, or autonomous recovery to core.

---

## 6. Core Invariants

These must **NEVER** change without governance amendment + spec version bump + validation re-run:

| ID | Invariant |
|----|-----------|
| I-001 | Ledger is append-only — no in-place event mutation |
| I-002 | Seq is monotonic contiguous `1..N` after read |
| I-003 | Projections derive solely from ledger replay |
| I-004 | Fold and render are pure — no external I/O |
| I-005 | Identical ledger → identical projection fingerprint |
| I-006 | `verify` exit 0 required before trusting projections |
| I-007 | Event types are closed enum — no ad-hoc types in core |
| I-008 | Spec version pinned per event — `osctl-core/1.0` |
| I-009 | Secrets never stored in ledger payloads |
| I-010 | Core performs no network calls |
| I-011 | Core triggers no deploy, rollback, or infra action |
| I-012 | Production authority remains human — not enforced in code, enforced in governance |

Amendment process: `ARCHITECTURE_FREEZE.md` § Amendment Process.

---

## 7. Architecture Checksum

### File manifest (core source)

```
ops/osctl/core/
├── __init__.py
├── __main__.py
├── README.md
├── cli/
│   ├── __init__.py
│   └── main.py
├── ledger/
│   ├── __init__.py
│   ├── paths.py
│   └── store.py
├── projection/
│   ├── __init__.py
│   ├── fold.py
│   └── render.py
├── replay/
│   ├── __init__.py
│   └── engine.py
├── schema/
│   ├── __init__.py
│   ├── events.py
│   ├── serialize.py
│   └── transitions.py
└── verify/
    ├── __init__.py
    └── engine.py
```

**Total:** 18 source files (stdlib Python 3 only).

### Runtime artifacts

```
ops/osctl/ledger/events.jsonl
ops/osctl/projections/CURRENT_STATUS.generated.md
ops/osctl/projections/DEPLOYMENT_STATE.generated.md
```

### Module inventory

| Module | Responsibility |
|--------|----------------|
| `schema/events.py` | Event types, validation, env drift names |
| `schema/transitions.py` | Lifecycle state machine |
| `schema/serialize.py` | Canonical JSON, UTC normalize, hashes |
| `ledger/store.py` | Append-only JSONL read/write |
| `ledger/paths.py` | Default ledger and projection paths |
| `projection/fold.py` | Ledger → operational state |
| `projection/render.py` | State → markdown projections |
| `replay/engine.py` | Pure replay + write projections |
| `verify/engine.py` | Schema, replay, drift verification |
| `cli/main.py` | append / replay / verify commands |

### Trust boundary summary

```text
┌─────────────────────────────────────────┐
│ TRUSTED — OSCTL core (this freeze)       │
│ append · replay · verify · fingerprint   │
└──────────────────┬──────────────────────┘
                   │ records assertions
┌──────────────────▼──────────────────────┐
│ UNTRUSTED — external (human/CI/infra)    │
│ Railway · GHA · secrets · smoke · git    │
└──────────────────────────────────────────┘
```

### Validation checksum

| Suite | Result |
|-------|--------|
| `ops/osctl/validation/run_validation.py` | 19/19 PASS |
| Production ledger verify | PASS |
| Fingerprint (5 events) | `90178458ed000496df14a73fc76907094cdacfd27a4c65f75d4f1d3f7b2d6b52` |

### Governance document index

| Document | Role |
|----------|------|
| `FREEZE_v1.md` | **This snapshot** |
| `GOVERNANCE.md` | Role model |
| `TRUST_MODEL.md` | Guarantees / non-claims |
| `HUMAN_BOUNDARIES.md` | Human vs automatable |
| `NON_GOALS.md` | Forbidden capabilities |
| `EVENT_SCHEMA.md` | Event contract |
| `LEDGER_MODEL.md` | Ledger contract |
| `SERIALIZATION_RULES.md` | Byte identity |
| `PROJECTION_RULES.md` | MD mapping |
| `REPLAY_GUARANTEES.md` | Replay contract |
| `VERIFY_MODEL.md` | Verify layers |
| `DRIFT_DETECTION.md` | Mismatch taxonomy |
| `ROLLBACK_POLICY.md` | Rollback semantics |
| `STATE_MACHINE.md` | Lifecycle transitions |
| `validation/` | Evidence and scenarios |

---

## 8. Remaining Manual Operations (Permanent)

| Category | Operations |
|----------|------------|
| **Gates** | Production GO/NO-GO; staging waiver approval |
| **Execution** | Deploy (`railway up`), rollback redeploy, migration run/revert |
| **Attestation** | Smoke validation; reconcile sign-off |
| **Incidents** | Severity assignment; open/close decisions |
| **Secrets** | Create, rotate, verify Railway variables |
| **Ledger** | Approve prod event ingests; resolve JSONL merge conflicts |
| **Projections** | Run `replay` + `verify` after append (operator discipline) |
| **Drift** | Investigate unrecorded deploys; reconcile runtime vs ledger |
| **Governance** | Freeze amendments; Phase 2/3 policy approval |

Core provides **verify** — humans provide **judgment and action**.

---

## 9. Phase 2 Readiness Verdict

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| Deterministic core stable | **YES** | 19/19 validation; stable fingerprint |
| Replay model stable | **YES** | Pure replay; consecutive-run consistency pass |
| Projections stable | **YES** | Fixed render templates; hash-verified output |
| Governance frozen | **YES** | 14 governance docs + this snapshot |
| Automation can safely begin later | **YES — observe-only** | Phase 2 may call CLI; must not alter core invariants |

### Explicitly NOT ready for (by design)

- Autonomous deploy or rollback
- CI as production authority
- Self-healing on verify failure
- Actor authorization enforcement in core

### Phase 2 entry conditions

1. Human owner sign-off on this freeze (`FREEZE_v1`)
2. CI integration plan approved (`CI_INTEGRATION_PLAN.md`)
3. First hook: post-deploy `append` + `replay` + `verify` (observe-only, non-blocking)

---

## Sign-Off

| Role | Name | Date |
|------|------|------|
| Owner | _pending_ | |
| Reviewer | _pending_ | |

**Next authorized work:** Phase 2 external integration calling frozen CLI — not core semantic changes.

---

## Amendment

Changes to invariants (§6), stable interfaces (§4), or CLI surface require:

1. New freeze document (e.g. `FREEZE_v2`)
2. Spec version bump (e.g. `osctl-core/1.1`)
3. Full validation suite pass
4. Human owner approval

Clarifications that do not alter behavior may update governance docs without bump.
