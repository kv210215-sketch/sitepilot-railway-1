# Simulation: Staging Deploy (Local Prod-Like)

> **Type:** Tabletop walkthrough · **No real deploy**  
> **Scenario:** Operator prepares release `r20260524-a1b2c3d` using local prod-like validation (no Railway staging service)  
> **Duration:** ~45 min simulated

## Scenario Setup

| Field | Value |
|-------|-------|
| Release ID | `r20260524-a1b2c3d` |
| Git SHA | `a1b2c3d4e5f6789012345678abcdef0123456789` |
| Operator | `human:andriy` |
| Release owner | `human:andriy` |
| Target | Local prod-like → promotion readiness for prod (next day) |
| Scope | Notifications module dependency fix (no migration) |

---

## Step 1 — Operator Startup

**Ritual:** `ops/rituals/DAILY_OPERATIONS.md`

| Step | Action | Result |
|------|--------|--------|
| Read CURRENT_STATUS | Open root `CURRENT_STATUS.md` | Active release: `r20260523-51eb8b1` · state: `production` |
| Baton | Holder: `none` · action: `none` | Clear |
| Incidents | No open `inc-*` folders | Clear |
| Rollback target | SHA `51eb8b1…` · deploy `aa8b5749-…` | Present |
| Env drift | `DB_SYNC=false` documented | Clear |

**Daily clear:** `daily-clear 2026-05-24 operator:andriy`

**Gap discovered:** Root CURRENT_STATUS last verified date stale (2026-05-02 in prose) — operator must trust manual Railway check anyway.

---

## Step 2 — Release Preparation

**Ritual:** `DEPLOY_RITUAL.md` § pre-checks

1. Create `ops/state/instances/r20260524-a1b2c3d/`
2. Copy `CURRENT_STATUS.template.md` → instance
3. Copy `DEPLOYMENT_STATE.template.md` → first journal entry
4. Fill release scope:

```text
commits: a1b2c3d (fix notifications deps in package.json)
migrations: none
env delta: none
```

5. Set journal: `lifecycle.state: planned` · `verification.state: pending`

**Open `RELEASE_CHECKLIST.md`** — pre-release boxes checked.

---

## Step 3 — Staging Deploy Preparation (Waiver Path)

**Ritual:** `STAGING_VALIDATION.md`

No Railway staging service. Operator records waiver in journal:

```text
hotfix_waiver: false
staging_waiver: true
reason: no staging service; local prod-like validation
approver: human:andriy
approved_at: 2026-05-24T09:00:00Z
```

**Local prod-like setup (simulated):**

```text
docker-compose up postgres (root docker-compose.yml)
cd backend && npm run build && npm run start:dev
DATABASE_URL=postgresql://sitepilot:***@localhost:5432/sitepilot
```

**Gap discovered:** Waiver text not in template — operator improvises in journal Notes. Template needs `staging_waiver` block.

---

## Step 4 — Smoke Validation

**Target:** `http://localhost:3001`

| # | Test | Simulated result |
|---|------|------------------|
| 1 | `GET /health` | 200 · `"status":"ok"` |
| 2 | `POST /api/v1/auth/register` | 201 |
| 3 | `POST /api/v1/auth/login` | 200 + token |
| 4 | `GET /api/v1/projects` + Bearer | 200 |

Update instance CURRENT_STATUS:

```text
verification_status: all pass
lifecycle.state: validating
verification.state: passed
```

**Gap discovered:** Four separate docs list smoke tests — operator copies table three times. Needs single canonical smoke manifest.

---

## Step 5 — Rollback Verification (Pre-Promotion)

Document in instance CURRENT_STATUS rollback section:

| Field | Value |
|-------|-------|
| Target release | `r20260523-51eb8b1` |
| Target SHA | `51eb8b17947b49ca1ac4ab2d483a432a35adcbbc` |
| Railway deployment ID | `aa8b5749-25e2-4214-a1b8-043edaa96e5e` |

Operator attests: rollback executable within 30 min.

---

## Step 6 — Reconciliation Update (Staging Phase)

Append DEPLOYMENT_STATE instance entry:

```text
lifecycle.state: validating
verification.state: passed
actor: human:andriy
recorded_at: 2026-05-24T10:30:00Z
notes: local prod-like smoke complete; prod GO deferred to 2026-05-25
```

**Do not** update root `CURRENT_STATUS.md` to new release yet — prod still on previous.

Set baton:

```text
holder: human:andriy
action_pending: none
release_id: r20260524-a1b2c3d
```

---

## Step 7 — Promotion Readiness

**Ritual:** `PRODUCTION_GO_NO_GO.md` — **not executed today** (dry run only)

Operator verifies G1–G12 would pass tomorrow except G4 needs prod smoke post-deploy.

Prepare promotion packet:

- [ ] Instance folder complete
- [ ] Rollback target verified
- [ ] Owner available for GO
- [ ] CI channel confirmed (`deploy-railway.yml` only)

Set journal intent: `lifecycle.state: validating` → ready for `promoted` on GO day.

---

## Simulation Outcome

| Result | Status |
|--------|--------|
| Governance usable? | **Yes**, with friction |
| Blockers hit | Stale root MD · waiver field missing · duplicate smoke tables |
| Ready for prod GO? | **Yes** after owner runs GO ritual next session |

## Gaps Found (This Simulation)

1. No `ops/state/instances/` directory convention enforced in repo (folder doesn't exist until operator creates)
2. Staging waiver not a first-class template field
3. Root vs instance CURRENT_STATUS update rules unclear mid-ritual
4. Local prod-like path not documented in rituals (only implied)
