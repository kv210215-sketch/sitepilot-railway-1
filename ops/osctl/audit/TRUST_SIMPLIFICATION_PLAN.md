# OSCTL Trust Simplification Plan

**Date:** 2026-05-24
**Mode:** Read-only consolidation audit (strict)
**Goal:** Reduce the number of trust surfaces, collapse overlapping trust statements, and close hidden authority paths — **without** introducing any new authority, automation, or orchestration.
**Principle:** The kernel is already trustworthy. The surface around it is too wide. Trim the surface; do not extend the kernel.

---

## 1. Trust Surface Inventory

### 1.1 Documents asserting trust rules

| File | Trust rule asserted | Overlap |
|------|---------------------|---------|
| `ops/osctl/TRUST_MODEL.md` | Core guarantees + non-claims | **CANONICAL** |
| `ops/osctl/validation/TRUST_MODEL.md` | Same content, older `project` CLI | DUPLICATE |
| `ops/osctl/BOUNDARIES.md` | Platform ownership | OVERLAPS HUMAN_BOUNDARIES on rollback authority |
| `ops/osctl/HUMAN_BOUNDARIES.md` | Three zones (must-human / may-automate / never-autonomous) | CANONICAL for human zoning |
| `ops/osctl/NON_GOALS.md` | Forbidden capabilities | CANONICAL for negative scope |
| `ops/osctl/GOVERNANCE.md` | Roles + document hierarchy | OVERLAPS BOUNDARIES on roles |
| `ops/osctl/snapshots/SNAPSHOT_TRUST_BOUNDARIES.md` | Snapshot non-authority | CANONICAL for snapshot scope |
| `ops/osctl/snapshots/AGENT_AUTHORITY_MAP.md` | Agent role diagram | OVERLAPS BOUNDARIES + HUMAN_BOUNDARIES |
| `ops/osctl/snapshots/CAPABILITY_MATRIX.md` | Read/write/forbidden capabilities | OVERLAPS HUMAN_BOUNDARIES + NON_GOALS |
| `ops/osctl/audit/TRUST_BOUNDARY_AUDIT.md` | Point-in-time audit | KEEP — observation, not rule |
| `ops/osctl/audit/TRUST_LAYER_BOUNDARIES.md` | Forbidden mixed commits | OVERLAPS BOUNDARIES; should merge |
| `ops/state/GOVERNANCE.md` | Same role model, draft event names | DUPLICATE |
| `MASTER_CONTEXT.md` §"OSCTL Snapshot Layer Status" | Trust kernel + forbidden list | DUPLICATE |
| `AGENT_RULES.md` (root) | Agent operational rules | DOES NOT REQUIRE VERIFY — trust gap |

**Trust surfaces with rule-making language:** **14**.
**Recommended canonical set:** **5** — `TRUST_MODEL.md`, `BOUNDARIES.md`, `HUMAN_BOUNDARIES.md`, `NON_GOALS.md`, `snapshots/SNAPSHOT_TRUST_BOUNDARIES.md`.

### 1.2 Implicit trust surfaces (read paths)

| Path | Treated as trusted by | Risk |
|------|----------------------|------|
| Root `CURRENT_STATUS.md` | `AGENT_RULES.md` "Read first" | HIGH — manual, stale (2026-05-02) |
| Root `DEPLOYMENT_STATE.md` | `AGENT_RULES.md` "Read first" | HIGH |
| `MASTER_CONTEXT.md` | `AGENT_RULES.md` + filename | MEDIUM |
| `ops/osctl/projections/CURRENT_STATUS.generated.md` | CLI default output | LOW (correct if verify passes) |
| `ops/state/projections/CURRENT_STATUS.md` | Freeze declares canonical | LOW (currently consistent) |
| Snapshot files (none committed) | None today | LOW |

---

## 2. Overlapping Trust Models — Resolution

### 2.1 Two `TRUST_MODEL.md` files

| File | Disposition |
|------|-------------|
| `ops/osctl/TRUST_MODEL.md` | **Keep** — single canonical |
| `ops/osctl/validation/TRUST_MODEL.md` | **Replace body** with: link to canonical + index of validation evidence files |

**Reason:** Two files with overlapping but slightly different content (e.g. `project` vs `replay`) is the worst case — readers can't tell which is authoritative.

### 2.2 Two GOVERNANCE.md files

| File | Disposition |
|------|-------------|
| `ops/osctl/GOVERNANCE.md` | **Canonical** |
| `ops/state/GOVERNANCE.md` | **Replace body** with one-paragraph redirect to canonical; preserve as anchor since paths in older docs reference it |

### 2.3 Five overlapping authority matrices

Already enumerated in `ARCHITECTURAL_ENTROPY_REPORT.md` §E-3. Resolution:

| Matrix | Keep | Action |
|--------|------|--------|
| Platform ownership | `BOUNDARIES.md` | Canonical |
| Human/automation zones | `HUMAN_BOUNDARIES.md` | Canonical |
| Negative capabilities | `NON_GOALS.md` | Canonical |
| Agent role diagram (snapshot) | `snapshots/AGENT_AUTHORITY_MAP.md` | Scope to snapshot read flow only; cross-link osctl docs |
| Capability matrix (snapshot) | `snapshots/CAPABILITY_MATRIX.md` | Trim to **only snapshot-scoped** rows; remove rows that duplicate `HUMAN_BOUNDARIES` |
| Trust boundary audit (round 2) | `audit/TRUST_BOUNDARY_AUDIT.md` | Keep as audit observation |
| Trust layer boundaries (forbidden mixes) | `audit/TRUST_LAYER_BOUNDARIES.md` | **Merge unique rows into `BOUNDARIES.md` §Forbidden Mixed Commits**; replace remaining content with banner |

### 2.4 Repeated "ledger authoritative" statements

Cluster E in `GOVERNANCE_DEDUPLICATION_PLAN.md` lists **14+ files** restating the same axiom. Resolution: keep the assertion in `LEDGER_MODEL.md`. Every other doc must cite by reference, not restate. This is a low-risk doc edit pass.

---

## 3. Hidden Authority Path Closure

These are not trust-rule duplications; they are **read-path bypasses** that grant de-facto authority without ever appearing in a trust matrix.

### 3.1 Agent read-first contract (CRITICAL)

`AGENT_RULES.md` line 8 currently says:

> Read first: MASTER_CONTEXT.md, CURRENT_STATUS.md, DEPLOYMENT_STATE.md

Effect: An agent following the rules trusts root legacy MDs before ever running `verify`. Closure:

**Recommended replacement (human edit, no code change):**

> Read first: `MASTER_CONTEXT.md`. Before recommending operational actions, run `python -m ops.osctl.core verify`. Trust projections only when verify exits 0. Treat root `CURRENT_STATUS.md` and `DEPLOYMENT_STATE.md` as **legacy summaries** — non-authoritative, dated 2026-05-02; defer to ledger projections under `ops/state/projections/` (or `ops/osctl/projections/`, per chosen canonical).

### 3.2 Root legacy MDs

| File | Action |
|------|--------|
| `CURRENT_STATUS.md` (root) | Add header: `> NON-AUTHORITATIVE — see ops/state/projections/CURRENT_STATUS.md` |
| `DEPLOYMENT_STATE.md` (root) | Add header: `> NON-AUTHORITATIVE — see ops/state/projections/DEPLOYMENT_STATE.md` |
| `BUILD_STATUS.md`, `RAILWAY_DEPLOY.md`, `DEPLOY_CHECKLIST.md` | Add headers: `> Historical deploy report (2026-05-02). Not OSCTL ledger truth.` |

### 3.3 Snapshot acceleration without verify

`SNAPSHOT_TRUST_BOUNDARIES.md` already says "VERIFY before ACT" and "system must remain correct with zero snapshots present". This is sufficient. No new rules.

### 3.4 Future / planning docs that imply authority

`SPEC_REFERENCE.md`, `IMPLEMENTATION_NOTES.md`, `CI_INTEGRATION_PLAN.md` describe future automation hooks (`osctl ingest`, lock events, deploy.observed, snapshot writer, CI verify gate). All require:

- A "**Status: pre-implementation — not in `osctl-core/1.0`**" banner.
- Explicit statement that these designs **do not authorize** implementation until a freeze bump.

This neutralizes the "hidden future escalation" risk surfaced in `audit/FUTURE_RISK_REVIEW.md` R-04.

---

## 4. Trust Surface After Simplification

```text
┌─────────────────────────────────────────────────────────┐
│  CANONICAL TRUST RULES (5 files)                         │
│   TRUST_MODEL.md          guarantees + non-claims        │
│   BOUNDARIES.md           platform ownership             │
│   HUMAN_BOUNDARIES.md     three zones                    │
│   NON_GOALS.md            negative scope                 │
│   snapshots/SNAPSHOT_TRUST_BOUNDARIES.md (scoped)        │
└──────────────────────────┬──────────────────────────────┘
                            │ referenced by
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
   GOVERNANCE.md       FREEZE_v1.md §2     audit/* observations
   (roles)             (snapshot of human  (point-in-time, never
                        authority guarantees) authority)
```

Snapshot capability matrix and agent authority map are **scoped supplements**, not parallel rules.

---

## 5. Simplification Action Order (Human-Executed)

| # | Action | File(s) | Effect |
|---|--------|---------|--------|
| 1 | SUPERSEDED banner on draft/superseded specs | `SPEC_REFERENCE.md`, `ARCHITECTURE_FREEZE_CHECKLIST.md`, `IMPLEMENTATION_NOTES.md` | Removes 3 hidden future-escalation surfaces |
| 2 | Body redirect on duplicate trust/governance docs | `validation/TRUST_MODEL.md`, `ops/state/GOVERNANCE.md` | Collapses 2 trust surfaces |
| 3 | Trim snapshot CAPABILITY_MATRIX to snapshot-scoped rows only | `snapshots/CAPABILITY_MATRIX.md` | Removes overlap with HUMAN_BOUNDARIES |
| 4 | Merge `audit/TRUST_LAYER_BOUNDARIES.md` content into `BOUNDARIES.md` (Forbidden Mixed Commits section) | both | Single forbidden-mix list |
| 5 | Add NON-AUTHORITATIVE header to root legacy MDs | `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md`, `BUILD_STATUS.md`, etc. | Closes read-path bypass |
| 6 | Update `AGENT_RULES.md` Read-first to verify-first | root | Closes hidden agent authority |
| 7 | Trim `MASTER_CONTEXT.md` OSCTL section to ≤ 8 lines + canonical link | root | Stops MASTER_CONTEXT from becoming third truth |
| 8 | Remove restated "ledger authoritative" prose; replace with cross-link | many docs | Cluster E cleanup |
| 9 | Disambiguate "Phase 3" → "Snapshot Layer" everywhere except CI roadmap | `snapshots/PHASE3_FINAL_REVIEW.md`, `MASTER_CONTEXT.md` | Closes T-1 drift |
| 10 | Single ledger + projection path decision (Option L recommended) | `core/ledger/paths.py` (L) **or** freeze docs (O) | Closes split-brain |

**All actions are doc-only edits except #10**, which touches one Python file (`paths.py`) under Option L. None changes core semantics, ledger schema, replay, verify, or CLI behavior.

---

## 6. Trust Simplification Verdict

| Dimension | Before | After (if applied) |
|-----------|--------|--------------------|
| Trust-rule files | 14 | 5 canonical + scoped snapshot supplement |
| Authority matrices | 5 overlapping | 3 canonical |
| Hidden authority paths | 4 (legacy MDs, AGENT_RULES, MASTER_CONTEXT, draft specs) | 0 |
| Code changes required | 0 | 1 (paths.py default — Option L) |
| Freeze bump required | No | No (path defaults are not freeze invariants) |
| New authority introduced | No | No |
| New automation introduced | No | No |

**Net trust posture:** Already correct in code. **Surface area is the problem.** Surface reduction is purely editorial and reversible.

**Recommendation:** Apply §5 actions in three small human commits — (a) banners + redirects, (b) AGENT_RULES + root MD demotion, (c) path reconciliation. Each on its own branch, each verified by `run_validation.py` PASS before next.
