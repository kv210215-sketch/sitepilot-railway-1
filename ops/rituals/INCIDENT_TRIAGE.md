# Incident Triage

> **When:** Prod anomaly, failed deploy, or daily probe failure  
> **Output:** Severity assignment + response path + communication

## Severity Matrix

| Level | Definition | Example (SitePilot) |
|-------|------------|---------------------|
| **SEV1** | Prod down or data loss / security breach | API unreachable; DB corrupt; secret exposed |
| **SEV2** | Major feature broken, no workaround | Auth broken for all users; migrations left schema broken |
| **SEV3** | Degraded, workaround exists | Publish queue stuck; non-core module 500; stale docs |
| **SEV4** | Minor, no user impact | Typo in ops doc; dev-only issue; planned maintenance notice |

---

## Response SLA

| Severity | Acknowledge | Mitigate start | Update cadence | Resolve target |
|----------|-------------|----------------|----------------|----------------|
| SEV1 | 15 min | 30 min | Every 30 min | ASAP same day |
| SEV2 | 30 min | 1 hour | Every 1 hour | Same business day |
| SEV3 | 4 hours | Next business day | Daily | 5 business days |
| SEV4 | 1 business day | Scheduled | Weekly | Best effort |

**Acknowledge** = incident file created, owner assigned, severity set.

---

## Rollback Conditions

| Severity | Default rollback posture |
|----------|-------------------------|
| SEV1 | Rollback **unless** faster forward-fix proven <15 min with owner approval |
| SEV2 | Rollback if deploy-related within last 4 hours; else assess |
| SEV3 | Rollback rarely — forward-fix preferred |
| SEV4 | No rollback |

Rollback decision maker: **human owner** — see `ROLLBACK_RITUAL.md`.

---

## Escalation Flow

```
Operator detects
    → Assign severity (this doc)
    → SEV1/SEV2: notify owner immediately
    → Create INCIDENT_LOG instance
    → SEV1/SEV2: freeze deploys (DAILY_OPERATIONS)
    → Mitigate (rollback | forward-fix | config)
    → Smoke validate
    → Reconcile state
    → Postmortem if SEV1/SEV2
```

| Step | SEV1/SEV2 | SEV3/SEV4 |
|------|-----------|-----------|
| Notify owner | Immediate (call/chat) | Async (ticket/chat) |
| Deploy freeze | Yes | No (unless related) |
| Rollback ritual | Likely | Unlikely |
| Postmortem | Required | Optional |

---

## Communication Expectations

| Audience | SEV1 | SEV2 | SEV3/SEV4 |
|----------|------|------|-----------|
| Owner | Immediate | <30 min | Daily summary |
| Active operator | Continuous | Hourly | As needed |
| Stakeholders/users | Status when impact confirmed | If user-visible | If user-visible |

**Message template (minimal):**

```text
[SEV{N}] SitePilot — <title>
Impact: <who/what>
Status: investigating | mitigating | resolved
Action: rollback | fix in progress | monitoring
Next update: <UTC time>
```

**Do not include:** secrets, tokens, full stack traces in external comms.

---

## Triage Decision Tree

```
Prod impact?
  No  → SEV4 (or not an incident)
  Yes → Workaround?
    No  → Deploy last 4h?
      Yes → SEV2 (consider rollback)
      No  → SEV1 if total outage else SEV2
    Yes → SEV3
```

---

## Incident Artifact

Create: `ops/state/instances/inc-YYYYMMDD-NNN/INCIDENT_LOG.md` from template.

Link to release: `{{RELEASE_ID}}` if deploy-related.

---

## References

- `ops/state/INCIDENT_LOG.template.md`
- `ops/rituals/ROLLBACK_RITUAL.md`
- `ops/rituals/DAILY_OPERATIONS.md`
