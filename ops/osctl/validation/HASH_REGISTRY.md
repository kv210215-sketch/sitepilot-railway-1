# OSCTL Hash Registry — Validation Evidence

**Run date:** 2026-05-24  
**Purpose:** Record deterministic fingerprints observed during isolated validation.  
**Status:** Validation evidence only — **not** an external trust anchor.

---

## Bundled Ledger Fingerprint

**Ledger:** `ops/osctl/ledger/events.jsonl`  
**Events:** 5  
**SHA-256 projection fingerprint:**

```text
90178458ed000496df14a73fc76907094cdacfd27a4c65f75d4f1d3f7b2d6b52
```

---

## Runtime Comparison Result

Fingerprints were computed independently on Python 3.11.9 and Python 3.12.10:

| Runtime | Bundled ledger fingerprint | Match |
|---------|---------------------------|-------|
| Python 3.11.9 | `90178458ed000496df14a73fc76907094cdacfd27a4c65f75d4f1d3f7b2d6b52` | yes |
| Python 3.12.10 | `90178458ed000496df14a73fc76907094cdacfd27a4c65f75d4f1d3f7b2d6b52` | yes |

**Cross-version scenario comparison:** all six scenario fixture fingerprints were **byte-identical** between 3.11 and 3.12.

---

## Scenario Fixture Fingerprints

| Scenario | SHA-256 |
|----------|---------|
| clean-deploy-chain | `ad186ecc17737696978421f34948fc0f03e72041a48073ff4f948fc5fe8715cb` |
| rollback-chain | `87f22d4523ae19ac23d8c7ea49a69b24c470ce4a7d0fb8af7253a3f3f4330bb9` |
| reconcile-flow | `2aefb2a945241f2325b299ebf7e25700582ced1f5eefcbb3f5d9a083a4a3aa17` |
| invalid-transition | `28d089a3482e0496d24146ac1944fb92c93276d2be87d34607aa40f374532b59` |
| environment-mismatch | `a41f0260d1e146423d56c6cf26cf35550f69808ef57172fb082ea561e1bb2f90` |
| rollback-target-missing | `20204b1e87db370c036c0cfa21e7a266b25ba6541e608c0666c73e399cf82b4b` |

---

## Canonical Serialization Sample

- 10 consecutive `canonical_dumps()` calls on a fixed sample event: **identical output**
- Sample SHA-256 prefix: `b8dbcec87ca50bdb…`

---

## Evidence Boundary

This registry documents **what was observed** during local, isolated validation on 2026-05-24. It does **not**:

- Anchor trust in an external system (git tag, CI artifact, HSM, etc.)
- Certify production ledger state at any point in time
- Replace operator verification before operational decisions

For trust boundaries, see `TRUST_MODEL.md` and `WHAT REMAINS MANUAL.md`.
