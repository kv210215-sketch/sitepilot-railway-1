# OSCTL Event Schema

**Freeze ID:** `osctl-freeze/1.5`  
**Spec version:** `osctl-core/1.0`  
**Implementation:** `ops/osctl/core/schema/events.py`

---

## Event Types (Closed Enum)

| Type | Purpose |
|------|---------|
| `deploy.recorded` | Deploy outcome recorded |
| `rollback.recorded` | Rollback intent + target pointer |
| `reconcile.recorded` | Post-rollback reconciliation |
| `incident.recorded` | Incident open/update/resolve |

No other types accepted by core in Phase 1.5.

---

## Top-Level Fields (Required)

| Field | Type | Rule |
|-------|------|------|
| `spec_version` | string | Must be `osctl-core/1.0` |
| `seq` | int | Positive; must match expected on append/read |
| `ts` | string | UTC ISO8601 — see timestamp rules |
| `actor` | string | Non-empty (e.g. `human:andriy`, `ci:deploy-railway:deploy-backend`) |
| `type` | string | One of closed enum |
| `env` | string | Non-empty (e.g. `production`, `staging`) |
| `payload` | object | Schema per type |

## Optional Top-Level Fields

| Field | Type | Rule |
|-------|------|------|
| `refs` | object | External references; string values |

---

## Timestamp Format

```text
YYYY-MM-DDTHH:MM:SS[.mmm]Z
```

Examples:

- `2026-05-23T14:05:00.000Z` (preferred — milliseconds)
- `2026-05-23T14:05:00Z` (valid)

Rules:

- UTC only — suffix `Z` required
- Core validates format; does **not** generate `ts`
- No timezone offsets (`+00:00` rejected)

---

## Payload: `deploy.recorded`

| Field | Required | Type | Values |
|-------|----------|------|--------|
| `release_id` | yes | string | Non-empty |
| `git_sha` | yes | string | Non-empty |
| `service` | yes | string | Non-empty |
| `status` | yes | string | `success` \| `failed` |
| `lifecycle_state` | yes | string | See `STATE_MACHINE.md` |
| `verification_state` | yes | string | `pending` \| `in_progress` \| `passed` \| `failed` |
| `url` | no | string | |
| `health_status` | no | string | |
| `env_posture` | prod recommended | object | See below |

### `env_posture` (production)

| Field | Type | Rule |
|-------|------|------|
| `keys_present` | array | Key names only — never values |
| `keys_missing` | array | Key names only |
| `db_sync` | string | Must be `"false"` in production |

Required key names for production verify: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`.

---

## Payload: `rollback.recorded`

| Field | Required | Type | Rule |
|-------|----------|------|------|
| `release_id` | yes | string | Current release being rolled back from |
| `target_seq` | yes | int | Ledger seq of known-good deploy |
| `target_release_id` | yes | string | |
| `target_git_sha` | yes | string | |
| `reason` | yes | string | Non-empty |
| `lifecycle_state` | yes | string | Must be `rollback` |

---

## Payload: `reconcile.recorded`

| Field | Required | Type | Rule |
|-------|----------|------|------|
| `release_id` | yes | string | Restored release |
| `summary` | yes | string | Human attestation text |
| `verification_state` | yes | string | `pending` \| `in_progress` \| `passed` \| `failed` |
| `lifecycle_state` | yes | string | Must be `reconciled` |
| `rollback_target_seq` | no | int | Reference to rollback target |

---

## Payload: `incident.recorded`

| Field | Required | Type | Values |
|-------|----------|------|--------|
| `incident_id` | yes | string | |
| `title` | yes | string | |
| `severity` | yes | string | `SEV1` \| `SEV2` \| `SEV3` \| `SEV4` |
| `status` | yes | string | `open` \| `mitigating` \| `resolved` |
| `affected_layer` | yes | string | |

---

## Lifecycle Values

```text
planned | staging | validating | promoted | production |
failed | rollback | reconciled | archived
```

Transitions governed by `STATE_MACHINE.md` and `schema/transitions.py`.

---

## Example Event (Minimal Production Deploy)

```json
{
  "ts": "2026-05-23T14:05:00.000Z",
  "actor": "human:andriy",
  "type": "deploy.recorded",
  "env": "production",
  "payload": {
    "release_id": "r20260523-51eb8b1",
    "git_sha": "51eb8b17947b49ca1ac4ab2d483a432a35adcbbc",
    "lifecycle_state": "production",
    "verification_state": "passed",
    "service": "sitepilot-railway",
    "status": "success",
    "url": "https://sitepilot-railway-production.up.railway.app",
    "health_status": "ok",
    "env_posture": {
      "keys_present": ["JWT_SECRET", "JWT_REFRESH_SECRET", "DATABASE_URL", "DB_SYNC"],
      "keys_missing": [],
      "db_sync": "false"
    }
  },
  "refs": {
    "git_sha": "51eb8b17947b49ca1ac4ab2d483a432a35adcbbc"
  }
}
```

Note: `seq` and `spec_version` assigned/defaulted by core on append.

---

## Draft Spec Deprecation

`SPEC_REFERENCE.md` draft types (`deploy.observed`, `rollback.marked`, `note.human`) are **not** implemented in `osctl-core/1.0`. Use `.recorded` types above.

---

## Related

- `STATE_MACHINE.md` — lifecycle transitions
- `SERIALIZATION_RULES.md` — on-wire format
- `ops/osctl/validation/scenarios/` — fixtures
