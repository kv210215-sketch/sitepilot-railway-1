# OSCTL Ledger Core — Isolated Validation Report

**Date:** 2026-05-24  
**Scope:** `ops/osctl/core/` (stdlib-only, local filesystem)  
**Spec:** `osctl-core/1.0`  
**Verdict:** **PASS** — core is deterministic, replayable, and corruption-aware on Windows with Python 3.11 and 3.12.

---

## Executive Summary

The OSCTL ledger core was validated in **complete isolation** from production systems:

| Constraint | Status |
|------------|--------|
| No Railway connection | Confirmed — zero network calls |
| No Cloudflare connection | Confirmed |
| No production repo modification | Confirmed — read-only copy only |
| No CI modification | Confirmed |

All functional validation passed on **Python 3.11.9** and **Python 3.12.10** with **identical projection fingerprints** across both interpreters.

---

## Sandbox Setup

| Item | Value |
|------|-------|
| Sandbox path | `D:\SYSTEM\Temp\osctl-ledger-sandbox-20260524-000347` |
| Git initialized | Yes (empty temp repo) |
| Source (read-only copy) | `D:\Projects\SitePilot\sitepilot-railway\ops\osctl` |
| Files unpacked | 92 |
| Isolation runner | `isolation_validate.py` |
| Bundled test runner | `ops/osctl/validation/run_validation.py` |

**Unpack method:** `robocopy` of `ops/osctl/` into sandbox `ops/osctl/`, excluding `__pycache__`.

---

## Python Interpreters

| Version | Path | Used |
|---------|------|------|
| 3.11.9 | `C:\Users\Andriy\AppData\Local\Programs\Python\Python311\python.exe` | Yes (installed for this validation) |
| 3.12.10 | Windows Store Python 3.12 | Yes |

Cross-version fingerprint comparison: **IDENTICAL** (all scenario hashes match byte-for-byte between 3.11 and 3.12).

---

## 1. Full Test Suite

**Command:** `python ops/osctl/validation/run_validation.py`

| Python | Result | Passed | Failed |
|--------|--------|--------|--------|
| 3.12 | PASS | 19 | 0 |
| 3.11 | PASS | 19 | 0 |

### Tests covered

- Serialization: stable key order, identical input/output, no random sources
- Replay consistency and append-only guarantees
- Projection reproducibility (clean-deploy, rollback, reconcile)
- Verify engine: clean chains, invalid transitions, rollback target missing, env mismatch, malformed events, projection drift
- Bundled sandbox ledger verify (5 events in `ops/osctl/ledger/events.jsonl`)

---

## 2. Corruption Scenarios

All corruption cases were exercised against temp ledgers (never production).

| Scenario | Detection mechanism | 3.12 | 3.11 |
|----------|---------------------|------|------|
| Truncated JSON line | `read_events()` → `ValueError` | PASS | PASS |
| Field tamper (invalid lifecycle jump) | `verify_ledger()` transition errors | PASS | PASS |
| Duplicate seq (manual file write) | `read_events()` seq integrity check | PASS | PASS |
| Out-of-order seq (seq 1 then 99) | `read_events()` seq integrity check | PASS | PASS |
| Concatenated JSON (no newline delimiter) | `read_events()` → invalid JSON | PASS | PASS |

**Sample tamper detection output:**

```text
seq 2: invalid transition: staging -> production
seq 3: invalid transition: production -> promoted
```

**Sample seq integrity output:**

```text
bad_seq.jsonl: expected seq 2, got 99
```

---

## 3. Replay Drift Scenarios

| Scenario | Assertion | 3.12 | 3.11 |
|----------|-----------|------|------|
| Fingerprint stable — clean-deploy-chain | `replay_fingerprint()` identical across runs | PASS | PASS |
| Fingerprint stable — rollback-chain | same | PASS | PASS |
| Fingerprint stable — reconcile-flow | same | PASS | PASS |
| `verify_replay_consistency()` — all scenarios | 0 errors | PASS | PASS |
| Clean projection match | `verify_projection_match()` → 0 mismatches | PASS | PASS |
| Injected projection drift | detects `projection mismatch` | PASS | PASS |
| Missing projection file | detects `projection missing on disk` | PASS | PASS |

---

## 4. Deterministic Hashes

### Scenario projection fingerprints (stable within and across Python versions)

| Scenario | SHA-256 fingerprint |
|----------|---------------------|
| clean-deploy-chain | `ad186ecc17737696978421f34948fc0f03e72041a48073ff4f948fc5fe8715cb` |
| rollback-chain | `87f22d4523ae19ac23d8c7ea49a69b24c470ce4a7d0fb8af7253a3f3f4330bb9` |
| reconcile-flow | `2aefb2a945241f2325b299ebf7e25700582ced1f5eefcbb3f5d9a083a4a3aa17` |
| invalid-transition | `28d089a3482e0496d24146ac1944fb92c93276d2be87d34607aa40f374532b59` |
| environment-mismatch | `a41f0260d1e146423d56c6cf26cf35550f69808ef57172fb082ea561e1bb2f90` |
| rollback-target-missing | `20204b1e87db370c036c0cfa21e7a266b25ba6541e608c0666c73e399cf82b4b` |

### Bundled sandbox ledger (`ops/osctl/ledger/events.jsonl`)

| Python | Events | Fingerprint |
|--------|--------|-------------|
| 3.12 | 5 | `90178458ed000496df14a73fc76907094cdacfd27a4c65f75d4f1d3f7b2d6b52` |
| 3.11 | 5 | `90178458ed000496df14a73fc76907094cdacfd27a4c65f75d4f1d3f7b2d6b52` |

### Canonical serialization sample

- 10 consecutive `canonical_dumps()` calls: **identical**
- Sample SHA-256 prefix: `b8dbcec87ca50bdb…`

**Note:** Fingerprints differ from older prefixes documented in `validation/REPLAY_TESTS.md` (`83ce6b0b…`, etc.) because scenario fixture content has evolved. Hashes are **internally consistent and cross-version stable** — the authoritative registry for this run is the table above.

---

## 5. Windows Path Compatibility

| Test | Detail | 3.12 | 3.11 |
|------|--------|------|------|
| Mixed `\` and `/` separators | Read same ledger via 3 path forms → 4 events each | PASS | PASS |
| Paths with spaces | `ledger sandbox\ops\osctl\…` + `verify_all()` | PASS | PASS |
| Extended-length path (`\\?\` prefix) | Append + read on deep temp path | PASS | PASS |

Append uses `os.O_BINARY` on Windows for byte-stable JSONL writes.

---

## 6. CLI Smoke Tests

| Command | Python 3.12 | Python 3.11 |
|---------|-------------|-------------|
| `python -m ops.osctl.core verify` | PASS — 5 events, fingerprint matches | PASS — identical |
| `python -m ops.osctl.core replay` | PASS — projections written, same fingerprint | PASS — identical |

Available CLI commands: `append`, `replay`, `verify` (no `project` subcommand in current core).

---

## Isolation Evidence

- **No network:** validation uses stdlib + local temp files only
- **No external services:** Railway and Cloudflare not referenced at runtime
- **Production untouched:** source repo read via `robocopy` only; no writes to `D:\Projects\SitePilot\sitepilot-railway`
- **CI untouched:** no workflow or pipeline files modified

---

## Artifacts

| File | Purpose |
|------|---------|
| `VALIDATION_REPORT.md` | This report |
| `isolation_validate.py` | Extended isolation test runner |
| `isolation_results.json` | Machine-readable test results (Python 3.11 run) |
| `run-py311.log` / `run-py312.log` | Full console output |
| `fp311.json` / `fp312.json` | Cross-version fingerprint dumps |

---

## Reproduce

```powershell
$Sandbox = "D:\SYSTEM\Temp\osctl-ledger-sandbox-20260524-000347"
Set-Location $Sandbox

py -3.12 ops/osctl/validation/run_validation.py
py -3.11 ops/osctl/validation/run_validation.py
py -3.12 isolation_validate.py
py -3.11 isolation_validate.py
py -3.12 -m ops.osctl.core verify
py -3.12 -m ops.osctl.core replay
```

---

## Conclusion

The OSCTL ledger core passes isolated validation:

1. **Deterministic** — identical inputs produce identical serialization, replay output, and fingerprints on 3.11 and 3.12  
2. **Append-only integrity** — seq monotonicity enforced at read time; append assigns sequential seq  
3. **Corruption-aware** — truncated, duplicated, out-of-order, and tampered ledgers are rejected or flagged  
4. **Drift-aware** — projection mismatch and missing files detected by verify engine  
5. **Windows-compatible** — mixed separators, spaced paths, and extended-length paths work  

**Overall status: VALIDATED**
