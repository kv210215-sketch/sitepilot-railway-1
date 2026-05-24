# Operational State (`ops/state`)

Human-operated workspace for release tracking until OSCTL CLI and ledger exist.

## Purpose

| Artifact | Role | Future (Phase 2+) |
|----------|------|-------------------|
| `CURRENT_STATUS.template.md` | Projection-style posture summary | Generated → root `CURRENT_STATUS.md` |
| `DEPLOYMENT_STATE.template.md` | Append-oriented deploy journal entry | Folded into `DEPLOYMENT_STATE.md` |
| `INCIDENT_LOG.template.md` | Incident record | Ingested as `note.human` + incident refs |
| `RELEASE_CHECKLIST.md` | Pre/post release gates | Human gate; CI observes |
| `ROLLBACK_CHECKLIST.md` | Rollback procedure | Pairs with `rollback.marked` event |
| `STATE_TRANSITIONS.md` | Allowed lifecycle moves | Mirrors `ops/osctl/STATE_MACHINE.md` |
| `GOVERNANCE.md` | Authority model | Binding for humans and agents |

## Conventions

1. **Copy templates** to dated files — do not edit templates in place.
   - Example: `ops/state/instances/2026-05-23-release-r001/CURRENT_STATUS.md`
2. **Naming:** `release-<id>` where id = `rYYYYMMDD-<short-sha>` (e.g. `r20260523-51eb8b1`)
3. **No secrets** in any file — key names only
4. **Timestamps:** ISO 8601 UTC (`2026-05-23T14:30:00Z`)
5. **Lifecycle states:** lowercase enum from `STATE_TRANSITIONS.md`
6. **Ledger seq:** use `seq: null` until Phase 2 ledger exists; then backfill

## Workflow (Manual — Phase 1)

```
RELEASE_CHECKLIST → copy templates → fill during deploy
                  → ROLLBACK_CHECKLIST if incident
                  → update root CURRENT_STATUS.md / DEPLOYMENT_STATE.md (optional)
Phase 2: osctl ingest → osctl project → verify
```

## Related

- Root context: `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md`
- OSCTL spec: `ops/osctl/SPEC_REFERENCE.md`
- Examples: `ops/osctl/examples/*.json`
