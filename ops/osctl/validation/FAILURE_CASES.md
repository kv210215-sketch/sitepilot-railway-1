# OSCTL Core — Failure Cases

**Purpose:** Document failure modes the verification engine MUST detect.  
**Engine:** `ops/osctl/core/verify/reconcile.py`  
**Validated:** 2026-05-23 — all negative cases detected

---

## Detection Matrix

| Case | Scenario fixture | Expected error class | Detected |
|------|------------------|----------------------|----------|
| Invalid lifecycle transition | `invalid-transition/` | `invalid transition` / `forbidden transition` | YES |
| Rollback target missing | `rollback-target-missing/` | `rollback target_seq N not found` | YES |
| Environment mismatch (production) | `environment-mismatch/` | `env drift: missing or invalid` | YES |
| Projection drift | `projection-mismatch/` (runtime) | `projection mismatch` | YES |
| Malformed event | `malformed-event/event-invalid.json` | schema validation errors | YES |

---

## 1. Invalid Transitions

**Fixture:** `scenarios/invalid-transition/events.jsonl`

**Trigger:** seq 2 — `staging → production` (not in `ALLOWED` set)

**Sample output:**

```text
seq 2: invalid transition: staging -> production
```

**Also forbidden (explicit highlights):**

| From | To | Reason |
|------|-----|--------|
| failed | production | skip recovery path |
| validating | production | skip promotion |
| planned | production | skip gates |
| rollback | production | must reconcile first |
| archived | production | must replan |

**Engine paths:** `verify_ledger()` + `fold_events()` both accumulate transition errors.

---

## 2. Rollback Target Missing

**Fixture:** `scenarios/rollback-target-missing/events.jsonl`

**Trigger:** seq 3 rollback with `target_seq: 99` — no matching ledger event

**Sample output:**

```text
rollback target_seq 99 not found in ledger
```

**Additional rollback checks (when target exists):**

- Target type must be `deploy.recorded`
- Target `payload.status` must be `success`

---

## 3. Environment Mismatch

**Fixture:** `scenarios/environment-mismatch/events.jsonl`

**Trigger:** production `deploy.recorded` with incomplete `env_posture`

**Sample output:**

```text
seq 1: env drift: missing or invalid JWT_REFRESH_SECRET
seq 1: env drift: missing or invalid DATABASE_URL
seq 1: env drift: missing or invalid DB_SYNC must be false in production posture
```

**Required production keys (names only):** `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, `db_sync=false`.

---

## 4. Projection Drift

**Fixture:** runtime injection (see `scenarios/projection-mismatch/README.md`)

**Trigger:** Modify `CURRENT_STATUS.md` after render without re-running `project`

**Sample output:**

```text
projection mismatch: <path>/CURRENT_STATUS.md
```

**Mechanism:** SHA-256 hash compare — on-disk vs replay-rendered content.

---

## 5. Malformed Events

**Fixture:** `scenarios/malformed-event/event-invalid.json`

**Triggers:**

| Field | Violation |
|-------|-----------|
| `ts` | `not-a-valid-timestamp` |
| `actor` | empty string |
| `type` | `deploy.observed` (not in EVENT_TYPES) |
| `env` | empty |
| `payload` | empty object |

**Result:** 11 validation errors from `validate_event()`.

**Append gate:** `append_event()` rejects before write — malformed events never enter ledger.

---

## 6. Seq Integrity Failures

**Not in fixtures** — enforced at read time:

| Condition | Error |
|-----------|-------|
| Gap in seq | `expected seq N, got M` |
| Invalid JSON line | `invalid JSON` |
| Non-object event | `event must be an object` |

---

## 7. Undetected Failures (Known Limits)

These are **not** verified by core — documented as residual risk:

| Gap | Why |
|-----|-----|
| Live Railway state vs ledger | No network calls |
| Secret value correctness | Names only in env_posture |
| Git SHA exists on remote | Refs not validated against git |
| Concurrent double-append | No file locking |
| Event hash chain / tamper evidence | `prev_hash` not implemented in core/1.0 |

---

## Run Negative Tests

```bash
python ops/osctl/validation/run_validation.py
```

Look for `[PASS] verify.detects_*` lines in output.
