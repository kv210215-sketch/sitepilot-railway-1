# CURRENT STATUS — OSCTL Projection

> **Source:** ledger only · **Spec:** `osctl-core/1.0` · **As of seq:** `5`

---

## Active Release

| Field | Value |
|-------|-------|
| Release ID | `r20260523-51eb8b1` |
| Git SHA | `51eb8b17947b49ca1ac4ab2d483a432a35adcbbc` |
| Service | `sitepilot-railway` |
| Lifecycle state | `reconciled` |
| Deploy channel | `github-actions → railway up` |

---

## Environment

| Env | Target | URL | Health |
|-----|--------|-----|--------|
| production | Railway `triumphant-purpose` | `https://sitepilot-railway-production.up.railway.app` | `ok` |

---

## Known Blockers

| ID | Blocker | Severity | Owner | Since |
|----|---------|----------|-------|-------|
| B1 | auth smoke fail after deploy | SEV2 | operator | seq 2 |

---

## Deployment Baton

| Role | Holder | Action pending |
|------|--------|----------------|
| Record state | `osctl replay` | `none` |

---

## Rollback Target

| Field | Value |
|-------|-------|
| Rollback active | `no` |
| Target ledger seq | `1` |
| Target release ID | `r20260523-51eb8b1` |
| Target git SHA | `51eb8b17947b49ca1ac4ab2d483a432a35adcbbc` |

---

## Verification Status

| Check | Status |
|-------|--------|
| Ledger verification state | `passed` |
| Active release seq | `1` |

---

## Metadata

| Field | Value |
|-------|-------|
| generated_from_seq | `5` |
| spec | `osctl-core/1.0` |

