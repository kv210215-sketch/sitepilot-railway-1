# DEPLOYMENT STATE — Journal Entry Template

> **Type:** Append-oriented journal record (one entry per release event)  
> **Do not edit prior entries** — add new entry below previous release block.

---

## Entry: `{{RELEASE_ID}}`

| Field | Value |
|-------|-------|
| **Release ID** | `{{RELEASE_ID}}` |
| **Git SHA** | `{{GIT_SHA}}` |
| **Actor** | `{{human:NAME \| ci:deploy-railway \| agent:cursor:SESSION}}` |
| **Environment** | `{{production \| staging \| local}}` |
| **Lifecycle state** | `{{planned \| staging \| validating \| promoted \| production \| failed \| rollback \| reconciled \| archived}}` |
| **Verification state** | `{{pending \| in_progress \| passed \| failed}}` |
| **Rollback reference** | `seq:{{SEQ}} release:{{RELEASE_ID}} sha:{{GIT_SHA}}` |
| **Recorded at (UTC)** | `{{ISO8601_UTC}}` |
| **Ledger seq** | `{{SEQ \| pending}}` |

---

### Platform

| Setting | Value |
|---------|-------|
| Railway project | `triumphant-purpose` |
| Service | `sitepilot-railway` |
| Root directory | `backend/` |
| Deploy trigger | GitHub Actions `deploy-railway.yml` |
| Railway deployment ID | `{{RAILWAY_DEPLOYMENT_ID \| n/a}}` |
| Backend URL | `{{BACKEND_URL}}` |

---

### Verification

| Step | Result | Timestamp (UTC) |
|------|--------|-----------------|
| Build | `{{success \| fail \| n/a}}` | |
| Deploy observe | `{{success \| fail \| n/a}}` | |
| Health `/health` | `{{200 \| other \| n/a}}` | |
| Smoke auth | `{{pass \| fail \| skip}}` | |
| Migration observe | `{{pass \| fail \| skip \| n/a}}` | |

---

### Env posture (names only)

| Key | Status |
|-----|--------|
| `JWT_SECRET` | `{{present \| missing}}` |
| `JWT_REFRESH_SECRET` | `{{present \| missing}}` |
| `DATABASE_URL` | `{{present \| missing}}` |
| `DB_SYNC` | `{{false \| true}}` |
| `CORS_ORIGINS` | `{{set \| wildcard \| missing}}` |
| `NODE_ENV` | `{{production \| other}}` |

---

### Notes

```
{{freeform operational notes — no secrets}}
```

---

### Supersedes

| Field | Value |
|-------|-------|
| Previous release ID | `{{RELEASE_ID \| none}}` |
| Previous ledger seq | `{{SEQ \| none}}` |
| Reason | `{{forward deploy \| rollback \| hotfix}}` |

---

<!-- Append next entry below this line. Do not modify entries above. -->
