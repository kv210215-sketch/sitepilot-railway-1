# OSCTL Implementation Notes (Phase 1.5 — Planning Only)

> No code in this phase. These notes constrain Phase 2 implementation.

## Implementation Boundary

```
┌─────────────────────────────────────────────────────────┐
│  External (unchanged in Phase 2 initial slice)          │
│  GitHub Actions · Railway CLI · manual ops · dashboards │
└───────────────────────────┬─────────────────────────────┘
                            │ observe / record
                            ▼
┌─────────────────────────────────────────────────────────┐
│  OSCTL (Phase 2)                                        │
│  ingest → validate → append ledger → project → validate │
└───────────────────────────┬─────────────────────────────┘
                            │ read
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Humans · agents · CI gates (read projections)          │
└─────────────────────────────────────────────────────────┘
```

OSCTL never calls `railway`, `docker`, or `git push`.

## Suggested Phase 2 Modules (not built yet)

| Module | Responsibility |
|--------|----------------|
| `schema/` | JSON Schema per event type; spec version pin |
| `ledger/` | Append writer, seq allocator, optional hash chain |
| `project/` | Deterministic CURRENT_STATUS + DEPLOYMENT_STATE builders |
| `lock/` | Acquire, release, expire, conflict detection |
| `cli/` | Thin commands: `ingest`, `project`, `lock`, `verify` |
| `verify/` | Replay ledger, diff projections, drift detection |

**Runtime choice (TBD):** Node 20 CLI in-repo (`ops/osctl/package.json`) vs standalone binary. Prefer in-repo Node to match backend toolchain.

## Command Surface (draft — not implemented)

| Command | Action |
|---------|--------|
| `osctl ingest` | Validate + append one event |
| `osctl project` | Rebuild projections from ledger |
| `osctl lock acquire\|release` | Manage exclusive locks |
| `osctl rollback mark` | Emit `rollback.marked` + acquire rollback lock |
| `osctl verify` | Determinism check + schema validation |
| `osctl status` | Print last seq, active locks, projection age |

No `osctl deploy`.

## SitePilot-Specific Mapping

Events should capture facts already scattered across repo docs:

| Today (manual MD) | Future ledger input |
|-------------------|---------------------|
| `BUILD_STATUS.md` deploy report | `deploy.observed` + `health.observed` |
| Migration manual step | `migration.observed` |
| Railway env checklist | `env.declared` (key names) |
| Risk table in CURRENT_STATUS | Projection from events + `note.human` |
| Rollback checklist | `rollback.marked` + journal section |

**Do not duplicate secrets.** `env.declared` lists `JWT_SECRET: present|missing`, never values.

## Projection Strategy

1. Load ledger `[1..N]`.
2. Fold events into internal state structs (pure functions).
3. Render templates → Markdown sections in fixed order.
4. Write atomically (temp file + rename).
5. Embed footer: `generated_from_seq: N`, `spec: osctl-spec/0.x`.

Initial templates should mirror structure of existing root `CURRENT_STATUS.md` and `DEPLOYMENT_STATE.md` to minimize agent confusion.

## Lock Implementation Notes

- Prefer **events-only locks** (replay reconstructs active locks) for determinism.
- TTL default: 30 minutes for `migration`, 15 minutes for `deploy-observe`.
- CI job should `lock acquire` → work → `lock release` in `finally` block (future workflow).

## Rollback Implementation Notes

- `rollback.marked` stores `target_seq`, not Railway deployment ID alone (ID goes in `refs`).
- Projection adds **Rollback active** banner to DEPLOYMENT_STATE journal when lock held.
- Clearing rollback: `lock release` + optional `note.human` explaining forward fix.

Schema/code rollback remains manual per `DEPLOYMENT_STATE.md`; OSCTL documents intent and pointer only.

## CI Integration Path (Future)

Phase 2.1 — read-only:

- Action step posts `deploy.observed` after existing health curl in `deploy-railway.yml`.

Phase 2.2 — gates:

- `osctl verify` fails PR if projections drift from committed MD (optional).
- Lock conflict fails job before migration script runs.

Phase 3 — not planned here:

- Blocking deploy on projection stale state (policy decision).

## Testing Strategy (Phase 2)

| Test | Goal |
|------|------|
| Golden ledger fixtures | Same input → same projection bytes |
| Lock conflict cases | Second acquire returns exit 2 |
| Schema rejection | Invalid payload never appends |
| Replay idempotency | `project` twice → identical output |

No network tests; no Railway mocks required for core logic.

## Non-Goals (Explicit)

- Replacing TypeORM migrations or running them
- Storing production credentials
- Auto-editing `backend/` or workflow files
- Real-time sync with Railway API (optional Phase 3+ research)

## Dependencies on Architecture Freeze

Implementation starts only when `ARCHITECTURE_FREEZE_CHECKLIST.md` is complete and signed off (human checkbox).

Until then: edit spec docs only; no `package.json`, no CLI stub.
