# OSCTL Validation Matrix

**Run date:** 2026-05-24  
**Sandbox:** `D:\SYSTEM\Temp\osctl-ledger-sandbox-20260524-000347`  
**Evidence source:** `VALIDATION_REPORT.md`

---

## Coverage Matrix

| Check | Python 3.11.9 | Python 3.12.10 | Notes |
|-------|---------------|----------------|-------|
| Full tests (`run_validation.py`) | PASS (19/19) | PASS (19/19) | Serialization, replay, projections, verify engine |
| Corruption detection | PASS | PASS | Truncated JSON, field tamper, duplicate seq, out-of-order seq, concatenated JSON |
| Drift detection | PASS | PASS | Replay consistency, projection match/mismatch/missing |
| Deterministic hashes | PASS | PASS | Scenario fingerprints stable; cross-version identical |
| Windows path compatibility | PASS | PASS | Mixed separators, spaced paths, extended-length paths |
| CLI `verify` | PASS | PASS | 5 events, bundled ledger fingerprint matches |
| CLI `replay` | PASS | PASS | Projections written, fingerprint matches |
| Isolation check | PASS | PASS | No network, no Railway/Cloudflare, no CI mutation, read-only source copy |

---

## Scenario Fixtures Exercised

| Fixture | Full tests | Corruption | Drift | Hash registered |
|---------|------------|------------|-------|-----------------|
| `clean-deploy-chain` | yes | yes | yes | yes |
| `rollback-chain` | yes | — | yes | yes |
| `reconcile-flow` | yes | — | yes | yes |
| `invalid-transition` | yes | — | — | yes |
| `rollback-target-missing` | yes | — | — | yes |
| `environment-mismatch` | yes | — | — | yes |
| Bundled ledger (`ops/osctl/ledger/events.jsonl`) | yes | — | — | yes |

---

## Runners

| Runner | Location | Purpose |
|--------|----------|---------|
| `run_validation.py` | `ops/osctl/validation/` | Bundled 19-test suite |
| `isolation_validate.py` | sandbox root (not committed) | Extended corruption, drift, path, hash checks |

See `VALIDATION_REPORT.md` for full output and reproduction steps.
