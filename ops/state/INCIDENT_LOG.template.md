# INCIDENT LOG — Template

> **Incident ID:** `{{INCIDENT_ID}}` (format: `inc-YYYYMMDD-NNN`)  
> **Release context:** `{{RELEASE_ID}}` · **Opened:** `{{ISO8601_UTC}}`

---

## Summary

| Field | Value |
|-------|-------|
| Title | `{{short title}}` |
| Severity | `{{SEV1 \| SEV2 \| SEV3 \| SEV4}}` |
| Status | `{{open \| mitigating \| resolved \| postmortem}}` |
| Affected layer | `{{backend \| database \| frontend \| ci \| railway \| auth \| billing \| publish \| other}}` |
| Customer impact | `{{yes \| no \| unknown}}` |

### Severity guide

| Level | Definition |
|-------|------------|
| SEV1 | Prod down or data loss risk |
| SEV2 | Major feature broken, workaround none |
| SEV3 | Degraded, workaround exists |
| SEV4 | Minor, no prod impact |

---

## Timeline (UTC)

| Time | Actor | Event |
|------|-------|-------|
| `{{ISO8601_UTC}}` | `{{actor}}` | `{{detected \| deployed \| alerted \| …}}` |
| | | |

---

## Affected Layer

| Component | Impact | Evidence |
|-----------|--------|----------|
| `{{component}}` | `{{description}}` | `{{logs, health response, error rate}}` |

---

## Rollback Decision

| Field | Value |
|-------|-------|
| Rollback required | `{{yes \| no \| deferred}}` |
| Decision maker | `human:{{NAME}}` |
| Rollback target seq | `{{SEQ \| n/a}}` |
| Rollback target SHA | `{{GIT_SHA \| n/a}}` |
| Rollback executed | `{{yes \| no \| in_progress}}` |
| Rollback method | `{{railway-dashboard \| vps-script \| forward-fix \| n/a}}` |
| Lifecycle after action | `{{rollback \| reconciled \| production}}` |

---

## Smoke Validation (post-mitigation)

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| `GET /health` | `200`, `status: ok` | | ☐ |
| `POST /api/v1/auth/login` | `200` + token | | ☐ |
| Critical user path | `{{define}}` | | ☐ |

**Validated by:** `{{human:NAME}}` · **At:** `{{ISO8601_UTC}}`

---

## Root Cause

```
{{factual root cause — avoid blame; cite evidence}}
```

| Category | `{{config \| code \| migration \| infra \| process \| external}}` |
|----------|-----|

---

## Prevention Follow-up

| ID | Action | Owner | Due | Status |
|----|--------|-------|-----|--------|
| PF1 | `{{action}}` | `{{owner}}` | `{{date}}` | `{{open \| done}}` |

---

## Ledger / OSCTL (Phase 2+)

| Event to ingest | When |
|-----------------|------|
| `rollback.marked` | Rollback decision confirmed |
| `note.human` | This incident summary |
| `lock.released` | After reconciled |
| `health.observed` | Post-mitigation smoke |

**Ledger seq range:** `{{SEQ_FROM}}` – `{{SEQ_TO \| pending}}`

---

## Closure

| Field | Value |
|-------|-------|
| Resolved at (UTC) | `{{ISO8601_UTC}}` |
| Postmortem link | `{{path or n/a}}` |
| Signed off by | `human:{{NAME}}` |
