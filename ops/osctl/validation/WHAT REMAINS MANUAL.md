# What Remains Manual

**Scope:** Explicit human-required steps that OSCTL core does **not** and **must not** automate.  
**Core status:** Deterministic, replayable, verifiable — **not** autonomous.

---

## Human Approval Steps

| Step | When | Authority | OSCTL role |
|------|------|-----------|------------|
| Production go/no-go | Before prod deploy | Human owner | Record outcome only |
| Ledger append approval | Any prod state assertion | Human owner | Validate + store event |
| Hotfix / staging waiver | Skip staging path | Human approver | Record waiver in payload/refs |
| Reconcile sign-off | After rollback execution | Human owner | `reconcile.recorded` |
| Incident resolution | SEV1/SEV2 close | Human owner | `incident.recorded` status change |
| Architecture freeze changes | Spec/boundary amendments | Human owner | Out of core scope |

**Rule:** Agents (Cursor, Claude) may **draft** event JSON; humans **approve and append**.

---

## Production Authority

| Action | Automated by core? | Owner |
|--------|------------------|-------|
| First production deploy | No | Human owner |
| Schema migration on prod | No | Human owner (+ manual `migration:run`) |
| CORS / env lockdown | No | Human owner |
| Enable CI verify gate | No | Human owner (Phase 3+) |
| Treat ledger as deploy blocker | No | Human policy decision |
| Record deploy in ledger | Append only | Human or CI after external deploy |

**Health 200 alone is not a production gate.** Checklist + human sign-off required per `ops/rituals/PRODUCTION_GO_NO_GO.md`.

---

## Rollback Authority

| Action | Owner | OSCTL role |
|--------|-------|------------|
| Decide rollback needed | Human owner | — |
| Execute Railway/VPS rollback | Human owner (or delegated ops) | — |
| Mark rollback in ledger | Human owner only | `rollback.recorded` |
| Select rollback target seq | Human owner | Validated by verify |
| Release rollback posture | Human after smoke pass | `reconcile.recorded` |
| DB `migration:revert` | Human owner | Separate from OSCTL |

OSCTL **records** rollback intent and target — it does **not** perform redeploy.

---

## Smoke Validation

| Check | Executor | Recorded in ledger? |
|-------|----------|---------------------|
| `/health` HTTP 200 | Human or CI script | Optional in deploy payload |
| Auth login smoke | Human | Via `verification_state` + reconcile summary |
| Critical path smoke | Human | Reconcile `summary` field |
| Post-rollback smoke | Human (mandatory) | `reconcile.recorded` |

Core does not run smoke tests. Ingest must reflect human/CI attestation.

---

## Deployment Execution

| Step | Executor | Core involvement |
|------|----------|------------------|
| `git push` / merge to main | Developer + CI | None |
| `railway up` | GitHub Actions | None |
| Railway dashboard redeploy (rollback) | Human | None |
| VPS / Docker deploy scripts | Human | None |
| Post-deploy event append | Human or CI | `append` command |
| Projection refresh | Human or CI | `project` command |
| Consistency check | Human or CI | `verify` command |

**Execution ≠ truth.** Deploy success does not update projections until ledger ingest + `project`.

---

## Operational Rituals (Human-Executed)

Reference: `ops/rituals/`

| Ritual | Must remain manual |
|--------|-------------------|
| `DAILY_OPERATIONS.md` | Yes |
| `DEPLOY_RITUAL.md` | Yes — deploy execution |
| `STAGING_VALIDATION.md` | Yes |
| `ROLLBACK_RITUAL.md` | Yes |
| `PRODUCTION_GO_NO_GO.md` | Yes |
| `WEEKLY_RECONCILIATION.md` | Yes |
| `HANDOFF_PROTOCOL.md` | Yes |

---

## Phase 2 Automation Candidates (Exact)

These may be automated **externally** — core already supports the data model:

| Candidate | Automation surface | Core ready? |
|-----------|-------------------|-------------|
| CI append `deploy.recorded` after GHA deploy | `python -m ops.osctl.core append --file event.json` | Yes |
| CI run `project` + `verify` on PR | CLI exit codes | Yes |
| Fingerprint gate in CI | `projection_fingerprint()` | Yes |
| Scheduled drift check | `verify` non-zero → alert | Yes |
| Event JSON generation from workflow metadata | External script → append | Yes |
| Actor ID `ci:deploy-railway:*` | Schema accepts any non-empty actor | Yes |

**Not candidates for core:** Railway API, secret fetch, deploy trigger, auto-rollback.

---

## MUST Remain Human (Non-Negotiable)

1. **Production gate decision** — go/no-go
2. **Rollback execution** — Railway/VPS action
3. **Rollback target selection** — which seq to restore
4. **Reconcile attestation** — "smoke passed" after rollback
5. **Secret creation and rotation**
6. **Ambiguous fact resolution** — conflicting CI vs local observations
7. **Incident severity and closure**
8. **Policy changes** — when ledger blocks deploy (Phase 4)
9. **Ledger conflict resolution** — git merge on `events.jsonl`
10. **Trust elevation** — granting any actor production authority

---

## Summary

OSCTL core is a **deterministic state recorder and verifier**. All consequential operational actions remain human-owned (or human-delegated CI for deploy execution only). The ledger makes history **auditable**; it does not make the system **self-driving**.
