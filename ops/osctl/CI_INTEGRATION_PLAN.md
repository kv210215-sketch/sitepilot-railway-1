# OSCTL CI Integration Plan (Frozen — Phase 1.5)

> **Freeze ID:** `osctl-freeze/1.5` · **Core spec:** `osctl-core/1.0`
>
> Phased path from manual discipline to CI-verified ledger sync. **No workflow changes in Phase 1.5.**

## Principles (All Phases)

- CI executes deploy; OSCTL records facts
- CI never stores secrets in ledger payloads
- Human owns production gates until Phase 4 policy
- Observe before enforce

---

## Phase 1 — Manual Discipline

**Status:** Current (pre-OSCTL tooling)

| Activity | Owner | Artifact |
|----------|-------|----------|
| Deploy via GitHub Actions | CI | Railway deployment |
| Update context MD by hand | Human | `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` |
| Run migrations manually | Human | Railway CLI |
| Verify health | Human / CI curl | HTTP 200 |

**OSCTL role:** None (governance docs only).

**Exit criteria → Phase 1.5:**

- [ ] `ARCHITECTURE_DECISIONS.md` frozen
- [ ] `ARCHITECTURE_FREEZE_CHECKLIST.md` signed off
- [ ] Boundaries understood by operators

---

## Phase 1.5 — Operational Tooling (Planning → Implementation Prep)

**Status:** Now

| Activity | Owner | Artifact |
|----------|-------|----------|
| Freeze architecture | Human | `ops/osctl/*.md` |
| Define schemas, state machine, boundaries | Human + agents | This folder |
| No CLI, no workflow edits | — | — |

**OSCTL role:** Governance only; zero runtime integration.

**Exit criteria → Phase 2:**

- [ ] Freeze sign-off (`osctl-freeze/1.0`)
- [ ] Ledger path + projection path decisions locked (checklist B1, C1)
- [ ] Event type enum frozen

---

## Phase 2 — Semi-Automation

**Goal:** Ledger exists; humans and CI can append observations; projections regenerate locally/CI.

| Component | Deliverable |
|-----------|-------------|
| CLI | `osctl ingest`, `osctl project`, `osctl verify` |
| Ledger | Git-tracked `ops/osctl/ledger/production.jsonl` |
| Projections | Regenerate root MD or `ops/osctl/projections/` |
| CI (optional slice) | Post-deploy step appends `deploy.observed` + `health.observed` |

**Workflow hook (future — not implemented yet):**

```yaml
# .github/workflows/deploy-railway.yml — Phase 2 optional tail
- name: Record operational observation
  if: success()
  run: |
    # osctl ingest --file ops/osctl/scratch/deploy-result.json
    echo "Phase 2: enable when CLI exists"
```

**CI permissions:**

| Allowed | Forbidden |
|---------|-----------|
| Append observation events | Block deploy on ledger absence |
| Fail job on ingest validation error | Auto-promote lifecycle to `production` |
| Upload ledger artifact on branch builds | Write secrets into payload |

**Human remains:** promotion, rollback marks, migration execution.

**Exit criteria → Phase 3:**

- [ ] 10+ ledger events from real deploys
- [ ] `osctl verify` green on `main`
- [ ] Projections match operator expectations

---

## Phase 3 — CI Verified Sync

**Goal:** CI proves projections derive from ledger; drift fails PR.

| Gate | Behavior |
|------|----------|
| PR check | `osctl verify` — replay + determinism hash |
| MD drift | Committed projection must match replay OR PR must include regenerated output |
| Lock check | No open `rollback` lock when merging deploy-related changes |

**Workflow additions (future):**

```yaml
- name: Verify OSCTL projections
  run: osctl verify --strict
```

**CI still does not:**

- Own truth without human-seeded ledger baseline
- Execute rollback
- Run migrations automatically

**Exit criteria → Phase 4:**

- [ ] Zero projection drift for 30 days
- [ ] Rollback drill recorded in ledger
- [ ] Owner approves CI enforcement policy

---

## Phase 4 — Trusted Deployment Ledger

**Goal:** Ledger is required evidence for prod state claims; CI enforces sync — still **not** deploy orchestration.

| Capability | Enforced by CI |
|------------|----------------|
| Every prod `deploy.observed` has matching ledger seq | Required |
| `DEPLOYMENT_STATE` journal regenerated on deploy workflow | Required |
| Missing `migration.observed` after schema release PR | Warning → block (policy) |
| Deploy job fails if ledger append fails | Required |
| Lifecycle `production` without prior validate path | Block (unless hotfix note) |

**Still forbidden (see `NON_GOALS.md`):**

- OSCTL-triggered deploy
- OSCTL-owned secrets
- Replacing Railway/GitHub/Cloudflare

**Trust model:**

```
Deploy executed (CI/Railway)
  → Observation ingested (CI)
  → Projections regenerated (CI)
  → Verify passes (CI)
  → Humans/agents trust DEPLOYMENT_STATE journal
```

Ledger becomes **trusted deployment record** — not deployment driver.

---

## Phase Summary

| Phase | CI writes ledger | CI enforces verify | Human prod gate |
|-------|------------------|--------------------|-----------------|
| 1 Manual | No | No | Yes |
| 1.5 Planning | No | No | Yes |
| 2 Semi-auto | Optional append | Optional local | Yes |
| 3 Verified sync | Yes | Yes (PR) | Yes |
| 4 Trusted ledger | Yes | Yes (deploy job) | Policy-based |

---

## SitePilot Hook Points (Reference)

| Existing step | Phase 2+ OSCTL action |
|---------------|----------------------|
| `deploy-railway.yml` → `railway up` | Pre: `deploy.requested` (optional) |
| Post health curl | `health.observed` + `deploy.observed` |
| Manual `migration:run` | Human ingests `migration.observed` |
| Railway dashboard rollback | Human ingests `rollback.marked` |

**Related:** `ARCHITECTURE_DECISIONS.md` ADR-008, `BOUNDARIES.md`, `STATE_MACHINE.md`
