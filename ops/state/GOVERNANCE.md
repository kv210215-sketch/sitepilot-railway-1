# Operational Governance

> Binding conventions for SitePilot releases until OSCTL Phase 2 automation.  
> **Frozen architecture:** `ops/osctl/ARCHITECTURE_DECISIONS.md`, `ops/osctl/BOUNDARIES.md`

---

## Role Model

| Role | Responsibility | Authority level |
|------|----------------|-----------------|
| **Humans approve production** | Go/no-go, rollback mark, secrets, migration execution | **Highest** |
| **CI verifies** | Build, deploy execute, health curl, future projection verify | Execute + observe |
| **OSCTL records** | Append-only ledger, projections, locks (Phase 2+) | Truth of record |
| **Cursor executes** | Code edits, template fills, draft events when asked | Delegated, bounded |
| **Claude reasons** | Review, planning, incident analysis, draft checklists | Advisory only |

---

## Humans Approve Production

Humans **must** explicitly approve before prod deploy is intentional:

- Sign `RELEASE_CHECKLIST.md` production gate
- Set `lifecycle.state: promoted` (manual now; ledger later)
- Own rollback decisions and lock release

Humans **own secrets** — never stored in `ops/state/` or ledger.

---

## CI Verifies

GitHub Actions (`.github/workflows/deploy-railway.yml`):

| CI does | CI does not |
|---------|-------------|
| Run `railway up` on push to `main` | Approve production gate |
| Optional health curl | Store secrets in OSCTL payloads |
| Future: `osctl verify` on PR | Trigger rollback |
| Future: append `deploy.observed` | Override human hold |

CI green ≠ operational truth (e.g. health 200 with missing migrations).

---

## OSCTL Records

Phase 2+ OSCTL is the **machine-readable record** of operational facts:

- Append-only ledger — canonical store
- `CURRENT_STATUS` — derived posture projection
- `DEPLOYMENT_STATE` — derived deploy journal
- Locks — concurrency and rollback safety

Until Phase 2: humans record equivalents via templates in `ops/state/`.

---

## Cursor Executes

Cursor may:

- Implement backend/frontend code when requested
- Fill operational templates from verified facts
- Draft ledger event JSON for human review (`ops/osctl/examples/` as shape reference)

Cursor may **not**:

- Run deploy, Railway CLI, Docker, or git push without explicit ask
- Mark production approved or ingest rollback events autonomously
- Write secrets or mutate Railway env

**Actor string (future):** `agent:cursor:<session>`

---

## Claude Reasons

Claude may:

- Analyze incidents, governance gaps, and state transitions
- Propose checklist updates and event payloads
- Review projection drift (when ledger exists)

Claude may **not**:

- Hold production gate or rollback authority
- Assert live infra state without evidence events

**Actor string (future):** `agent:claude:<session>`

---

## Rollback Authority Model

```
Detect issue → Human decides rollback? 
    → Yes: ROLLBACK_CHECKLIST + external execute (Railway/VPS)
    → OSCTL: rollback.marked + lock (Phase 2+)
    → Verify smoke → reconciled → lock release
    → Forward fix via RELEASE_CHECKLIST
```

| Action | Authority |
|--------|-----------|
| Mark rollback | Human owner |
| Execute Railway redeploy | Human owner (or delegated ops) |
| DB migration revert | Human owner (separate assessment) |
| Release rollback lock | Human owner after verification |
| Record in ledger | Human-approved ingest or CI observe |

OSCTL **never** executes rollback — see `ops/osctl/NON_GOALS.md`.

---

## No AI Autonomous Production Deploys

**Hard rule:** No agent may autonomously:

- Push to `main` to trigger deploy
- Approve production gate
- Mark `lifecycle.state: production` without human actor
- Release rollback lock
- Ingest success `deploy.observed` during active rollback lock

Agents **propose**; humans **dispose**.

---

## Document Hierarchy

| Priority | Document |
|----------|----------|
| 1 | `ops/osctl/ARCHITECTURE_DECISIONS.md` |
| 2 | `ops/osctl/NON_GOALS.md` |
| 3 | This file (`GOVERNANCE.md`) |
| 4 | `ops/state/*` templates and checklists |
| 5 | Root `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` (human/agent context) |

Conflicts: governance docs win over ad-hoc MD edits.

---

## Phase Alignment

| Phase | Governance mode |
|-------|-----------------|
| 1 | Manual templates + root MD |
| 1.5 | Templates + frozen spec (now) |
| 2 | Templates + ledger ingest + project |
| 3 | CI verify projections |
| 4 | Trusted ledger sync |

See `ops/osctl/CI_INTEGRATION_PLAN.md`.
