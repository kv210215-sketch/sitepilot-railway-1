# OSCTL Validation Summary

**Date:** 2026-05-24  
**Verdict:** **PASS**

---

## Sandbox

| Item | Value |
|------|-------|
| Path | `D:\SYSTEM\Temp\osctl-ledger-sandbox-20260524-000347` |
| Method | Git-init temp repo; read-only `robocopy` of `ops/osctl/` |
| Files unpacked | 92 |

---

## Tested Runtimes

| Runtime | Version | Result |
|---------|---------|--------|
| Python 3.11 | 3.11.9 | PASS |
| Python 3.12 | 3.12.10 | PASS |

Cross-version projection fingerprints: **identical**.

---

## Scenarios Tested

- **Full suite:** 19/19 tests via `run_validation.py` (both runtimes)
- **Corruption:** truncated JSON, field tamper, duplicate seq, out-of-order seq, concatenated JSON
- **Drift:** replay consistency, projection match, injected drift, missing projection
- **Deterministic hashes:** scenario fixtures + bundled ledger + canonical serialization
- **Windows paths:** mixed separators, paths with spaces, extended-length paths
- **CLI:** `verify` and `replay` on bundled ledger (5 events)

---

## Isolation Guarantees

Validation was performed with strict boundaries:

- No deploy actions
- No CI mutation
- No Railway connection
- No Cloudflare connection
- No backend integration
- No network calls
- Source copied read-only; evidence written only under `ops/osctl/validation/`

---

## Remaining Human Responsibility

The core is validated locally. Operators remain responsible for:

- **External head-hash anchoring** — recording authoritative ledger/projection fingerprints outside this repo (e.g. signed release notes, operator log, out-of-band checksum store) when operational trust is required
- Interpreting verify failures and deciding corrective action
- Ensuring production ledger append authority stays human-gated
- Re-running validation after material changes to `ops/osctl/core/` or scenario fixtures

See `WHAT REMAINS MANUAL.md` for full operator boundaries.

---

## Evidence Package

| Document | Purpose |
|----------|---------|
| [VALIDATION_REPORT.md](./VALIDATION_REPORT.md) | Full isolated validation report |
| [VALIDATION_MATRIX.md](./VALIDATION_MATRIX.md) | Runtime × check coverage matrix |
| [HASH_REGISTRY.md](./HASH_REGISTRY.md) | Observed fingerprints (evidence, not trust anchor) |
| [VALIDATION_SUMMARY.md](./VALIDATION_SUMMARY.md) | This summary |
