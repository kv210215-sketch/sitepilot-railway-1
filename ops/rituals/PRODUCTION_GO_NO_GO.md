# Production GO / NO-GO

> **When:** Immediately before deploy execution (after staging validation + smoke)  
> **Authority:** Human release owner — single approver required

## Decision

```text
GO   → proceed to deploy (push main / approved CI trigger)
NO-GO → stop · document reason · do not deploy
```

Record: `approved_by`, `approved_at` (UTC), `decision: GO|NO-GO` in release instance.

---

## Required Checks (all must pass for GO)

| ID | Check | Evidence |
|----|-------|----------|
| G1 | Daily operations clear | `DAILY_OPERATIONS.md` complete today |
| G2 | RELEASE_ID assigned + templates copied | `ops/state/instances/{{RELEASE_ID}}/` |
| G3 | Release scope documented (SHA, migrations, env delta) | Journal entry |
| G4 | Staging validation pass **or** documented hotfix waiver | `STAGING_VALIDATION.md` |
| G5 | Smoke tests pass on validation target | Checklist signed |
| G6 | Rollback target documented | CURRENT_STATUS rollback section filled |
| G7 | Operator can execute rollback within 30 min | Operator attestation |
| G8 | No open SEV1 incident | Incident scan |
| G9 | No open SEV2 incident (unless hotfix for that incident) | Incident scan |
| G10 | `lifecycle.state` = `promoted` | Journal |
| G11 | Baton = named operator or CI with explicit handoff | HANDOFF_PROTOCOL |
| G12 | Migrations plan documented if schema change | Post-deploy manual step |

---

## Blockers (automatic NO-GO)

| Blocker | Action |
|---------|--------|
| Any required check G1–G12 fails | NO-GO |
| Active rollback lock / `lifecycle.state: rollback` | NO-GO until reconciled |
| Undocumented env drift vs journal | NO-GO until reconciled |
| `DB_SYNC=true` on production Railway | NO-GO — fix vars first |
| Missing JWT_* or DATABASE_URL (names) | NO-GO |
| Two concurrent release owners | NO-GO — handoff first |
| CI deploy running unexpectedly | NO-GO — wait or abort CI |

---

## Forbidden Conditions (never GO)

| Condition | Reason |
|-----------|--------|
| Agent-only approval | Humans must approve |
| Health-only pass, auth smoke skipped | Known prod failure pattern |
| No rollback target "TBD" | Rollback ritual impossible |
| Push to `main` to "see what happens" | Undisciplined deploy |
| Secrets pasted in ops docs/chat | Security |
| Railway GitHub App auto-deploy ON without journal update | Duplicate deploy channel |
| Schema release without migration plan | API 500 while health 200 |

---

## Approval Ownership

| Role | Can approve GO? |
|------|-----------------|
| Release owner (human) | **Yes** |
| Operator (non-owner) | **No** — escalate to owner |
| CI / GitHub Actions | **No** |
| Cursor / Claude | **No** |

Delegation: owner may name delegate in writing for that RELEASE_ID only.

---

## Rollback Readiness (required at GO)

| Item | Status at GO |
|------|--------------|
| Target release ID | Documented |
| Target git SHA | Documented |
| Target Railway deployment ID | Documented |
| `ROLLBACK_RITUAL.md` reviewed | Operator confirmed |
| Incident template path known | Yes |

**GO without rollback readiness = invalid decision.**

---

## NO-GO Handling

1. Record reason in release journal
2. Set `lifecycle.state: failed` or remain `validating`
3. Notify stakeholders if external impact expected
4. Schedule fix + re-run ritual from staging validation

---

## Post-GO

Deploy execution per `DEPLOY_RITUAL.md` — GO is not post-release success.

Post-release verification still required; failed verify → incident + possible rollback.

---

## References

- `ops/rituals/DEPLOY_RITUAL.md`
- `ops/state/GOVERNANCE.md`
- `ops/state/RELEASE_CHECKLIST.md`
