# OSCTL Serialization Rules

**Freeze ID:** `osctl-freeze/1.5`  
**Implementation:** `ops/osctl/core/serialize.py`

---

## Purpose

Every ledger line must serialize to **identical bytes** given identical event content. This enables replay verification, diff stability, and trustworthy append.

---

## Canonical JSON Rules

| Rule | Value |
|------|-------|
| Key ordering | Lexicographic sort at all object depths (recursive) |
| Separators | `,` and `:` — no space after separators |
| ASCII | `ensure_ascii=True` — non-ASCII escaped |
| `sort_keys` | `True` at dump time (redundant with recursive sort) |
| Trailing newline in dumps | **No** — newline added only on append to file |
| File line ending | Single `\n` per event line |

---

## Stable Field Ordering

Object keys sorted recursively before dump:

```text
Input:  {"z": 1, "a": {"m": 2, "b": 3}}
Output: {"a":{"b":3,"m":2},"z":1}
```

Arrays preserve element order. Object keys within array elements are sorted.

---

## Whitespace Policy

| Context | Rule |
|---------|------|
| Ledger JSONL | No interior whitespace beyond JSON spec |
| Projection MD | `\n` line endings; single trailing `\n` on file |
| Projection lines | No trailing spaces on lines |
| Blank lines | Preserved per fixed render template |

---

## Float Policy

| Rule | Detail |
|------|--------|
| Preferred | Avoid floats in event payloads |
| If present | Python `json.dumps` default — shortest representation |
| Determinism | Identical numeric value → identical serialization within Python JSON |

**Recommendation:** Use strings for timestamps and IDs; use integers for `seq`, `target_seq`.

---

## Timestamp Normalization

| Layer | Rule |
|-------|------|
| Validation | Must match `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$` |
| Storage | Stored exactly as provided if valid |
| Core generation | **None** — caller supplies `ts` |
| Normalization | No auto-truncate to ms; no timezone conversion |

Preferred canonical form: `2026-05-23T14:05:00.000Z` (milliseconds, `Z` suffix).

---

## Hash Rules

| Hash | Scope | Algorithm |
|------|-------|-----------|
| Projection fingerprint | Full rendered projection set | SHA-256 of sorted `{name, content}` canonical bytes joined by `\n` |
| Projection drift check | Per-file | SHA-256 of file UTF-8 content |
| Event line hash chain | **Deferred** | Not in `osctl-core/1.0` |

Fingerprint computation: `ops/osctl/core/verify/reconcile.py` → `projection_fingerprint()`.

---

## Immutable Event Semantics

| Property | Rule |
|----------|------|
| Post-append mutation | Forbidden — no API |
| Re-serialization | Same logical event → same bytes if fields unchanged |
| Field injection on append | Core sets `seq`; defaults `spec_version` if null |
| Unknown fields | Preserved in payload if present at append (validation is per known schema) |

---

## Append Wire Format

```text
canonical_dumps(event) + "\n"
```

Written via `O_APPEND` in UTF-8.

---

## Verification

```bash
python ops/osctl/validation/run_validation.py
```

Tests: `serialization.stable_key_order`, `serialization.identical_input_identical_output`, `serialization.no_random_sources`.

---

## Prohibited in Serialize Path

No use of:

- `random`, `uuid`, `secrets`
- `time.time`, `datetime.now`
- Network or filesystem reads

---

## Related

- `LEDGER_MODEL.md` — storage contract
- `REPLAY_GUARANTEES.md` — replay determinism
- `DRIFT_DETECTION.md` — hash mismatch handling
