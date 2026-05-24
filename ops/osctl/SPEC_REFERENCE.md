# OSCTL Spec Reference (Draft — Phase 1.5)

> Placeholder spec. Numbers and field names may change until architecture freeze.

## Versioning

| Field | Value (planned) |
|-------|-----------------|
| Spec version | `osctl-spec/0.1.0-draft` |
| Ledger format | JSON Lines (`.jsonl`), one event per line |
| Projection format | Markdown + optional JSON sidecar |

## Core Objects

### 1. Ledger Event (append-only)

Every operational fact is an immutable event.

```json
{
  "seq": 1,
  "ts": "2026-05-23T12:00:00.000Z",
  "actor": "human:andriy | ci:deploy-railway | agent:cursor",
  "type": "deploy.observed",
  "env": "production",
  "payload": {},
  "refs": {
    "git_sha": "abc123",
    "railway_deployment_id": "aa8b5749-..."
  },
  "prev_hash": null,
  "hash": "sha256:..."
}
```

**Rules:**

- `seq` monotonic; gaps forbidden after write.
- `type` from closed enum (see below).
- `payload` schema per type; unknown fields rejected at ingest (Phase 2).
- Optional hash chain for tamper-evidence (TBD at freeze).

### 2. Event Types (closed enum — draft)

| Type | Purpose | Example payload keys |
|------|---------|----------------------|
| `repo.snapshot` | Code/layout fact | `branch`, `paths_active` |
| `deploy.requested` | Intent recorded (CI or human) | `service`, `channel` |
| `deploy.observed` | External deploy outcome | `status`, `url`, `health` |
| `migration.observed` | Migration run result | `command`, `exit_code`, `migrations_applied` |
| `env.declared` | Non-secret env posture | `keys_present`, `keys_missing` |
| `health.observed` | Probe result | `endpoint`, `http_status`, `body_status` |
| `lock.acquired` | Exclusive op started | `lock_name`, `holder`, `ttl` |
| `lock.released` | Exclusive op ended | `lock_name`, `reason` |
| `rollback.marked` | Known-good pointer set | `target_seq`, `reason` |
| `note.human` | Freeform ops note | `text` |

**Not in v0.1:** events that mutate Railway, Docker, or git remotes.

### 3. CURRENT_STATUS Projection

Derived read model: *"What is the repo and product posture right now?"*

**Sources:** latest of `repo.snapshot`, module/risk notes, `note.human`, cross-ref to `MASTER_CONTEXT.md`.

**Output:** regenerates root `CURRENT_STATUS.md` (or `ops/osctl/projections/CURRENT_STATUS.md` — TBD at freeze).

**Sections (fixed order):**

1. Repository state
2. Active infra assumptions
3. Likely deployment status
4. Unfinished areas
5. Suspected risks
6. Known blockers

Projection must cite **last ledger seq** that contributed to each section.

### 4. DEPLOYMENT_STATE Journal

Derived read model: *"What do we believe about deploy/env/runtime?"*

**Sources:** `deploy.*`, `migration.observed`, `env.declared`, `health.observed`, cross-ref to `DEPLOYMENT_STATE.md`.

**Sections (fixed order):**

1. Platform assumptions (Railway service, root dir, CI channel)
2. Env variable posture (names only — never values)
3. Health expectations
4. Startup / migration flow notes
5. Known failure patterns (from observed events)
6. Rollback pointers

Each journal entry includes `as_of_seq` and `supersedes_seq` when facts change.

### 5. Lock Management

Prevents concurrent incompatible ops (e.g. two migration runs, rollback during deploy observe).

| Lock name (draft) | Blocks |
|-------------------|--------|
| `migration` | Second migration observe / declare |
| `deploy-observe` | Conflicting deploy.observed writes |
| `projection-rebuild` | Concurrent projection regeneration |
| `rollback` | New deploy.observed until rollback complete |

Lock record (separate from ledger or as `lock.*` events — **TBD at freeze**):

```json
{
  "lock_name": "migration",
  "holder": "ci:deploy-railway",
  "acquired_seq": 42,
  "expires_at": "2026-05-23T12:30:00.000Z"
}
```

**Rules:**

- Acquire before exclusive op; release on success or failure event.
- Stale locks expire; expiry emits `lock.released` with `reason: "expired"`.
- Projections skip partial sections if lock held (mark section as stale).

### 6. Rollback Safety

Rollback is **metadata**, not automation.

| Concept | Definition |
|---------|------------|
| `rollback.marked` event | Points to ledger `target_seq` known good |
| Rollback scope | Code artifact + env posture snapshot refs — not DB schema auto-revert |
| Safety rule | No new `deploy.observed` with `status: success` without releasing `rollback` lock |

Aligns with existing manual Railway rollback (`DEPLOYMENT_STATE.md`).

### 7. Determinism Contract

Given:

- Ledger events `[1..N]` in order
- Spec version `S`
- Reference docs hash (optional)

Then:

- `project CURRENT_STATUS` → identical output
- `project DEPLOYMENT_STATE` → identical output

Non-deterministic inputs (timestamps in prose) use event `ts` only; generation `generated_at` is metadata outside hash.

## CI Compatibility (Future)

Planned ingest from GitHub Actions without OSCTL owning deploy:

```yaml
# Future step (not implemented)
- name: Record deploy observation
  run: osctl ingest --type deploy.observed --payload-file deploy-result.json
```

Requirements for CI shape:

- Stdin/JSON/file ingest; no interactive prompts
- Exit codes: `0` ok, `1` validation, `2` lock conflict, `3` ledger IO
- Secrets never in payload; use `env.declared` with key names only
- Actor auto-set to `ci:<workflow_job_id>`

## Open Questions (resolve at freeze)

- [ ] Git-track ledger vs CI artifact vs both
- [ ] Hash chain required for v0.1?
- [ ] Single ledger per env or one global ledger with `env` field
- [ ] Projection overwrites root MD files or lives under `ops/osctl/projections/`
- [ ] Lock store: events-only vs small state file

See `ARCHITECTURE_FREEZE_CHECKLIST.md`.
