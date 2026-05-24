# OSCTL Architecture Decisions (Frozen — Phase 1.5)

> **Freeze ID:** `osctl-freeze/1.0` · **Status:** Architecture frozen · **Implementation:** Phase 2+

Decisions below are binding for OSCTL implementation. Changes require a new ADR section and freeze version bump.

---

## ADR-001: Append-Only Ledger as Canonical Store

**Decision:** All operational facts are recorded in an append-only JSONL ledger (`ops/osctl/ledger/`).

| Property | Rule |
|----------|------|
| Mutability | Events never edited, deleted, or reordered |
| Corrections | New compensating events only (`note.human`, superseding facts) |
| Sequence | Monotonic `seq`; no gaps after commit |
| Authority | Ledger is the **single machine-readable source of truth** |

**Rationale:** Auditability, replay, and conflict resolution require immutable history. Mutable files cannot be trusted under concurrent human/CI/agent writes.

**Rejected:** Git history as ledger; editable JSON arrays; database-backed event store in v0.1.

---

## ADR-002: Projection Model (Read Models)

**Decision:** Human-facing state is **derived**, never written directly as truth.

```
Ledger [1..N]  ──replay──▶  Fold functions  ──render──▶  Projections
```

| Projection | Role | Regeneration |
|------------|------|--------------|
| `CURRENT_STATUS` | Posture read model | `osctl project --target current-status` |
| `DEPLOYMENT_STATE` | Deployment journal read model | `osctl project --target deployment-state` |
| JSON sidecars (optional) | Machine diff / CI gates | Same replay pass |

**Rationale:** Separating write (ingest) from read (project) enables determinism checks and eliminates "doc drift" without losing history.

**Rejected:** Dual-write (ledger + MD simultaneously by hand); MD-first with ledger as backup.

---

## ADR-003: CURRENT_STATUS Is Projection Only

**Decision:** Root `CURRENT_STATUS.md` (or `ops/osctl/projections/CURRENT_STATUS.md`) is **never** an ingest target.

| Allowed | Forbidden |
|---------|-----------|
| Regenerate from ledger + static refs | Manual edits to assert deploy facts |
| Human `note.human` events ingested first | CI writing CURRENT_STATUS directly |
| Cite `as_of_seq` per section | Treating CURRENT_STATUS as rollback pointer |

**Content domain:** Repo layout, module posture, risks, blockers, inferred prod status — **observational summary**.

**Rationale:** CURRENT_STATUS is optimized for agents and operators scanning "where we are." It must not become a second ledger.

---

## ADR-004: DEPLOYMENT_STATE as Deployment Journal (Read Model)

**Decision:** `DEPLOYMENT_STATE.md` is the **authoritative human-readable journal for deployment-domain facts**, derived exclusively from ledger events.

| Event sources | Journal sections |
|---------------|------------------|
| `deploy.*`, `migration.observed` | Platform assumptions, migration flow |
| `env.declared`, `health.observed` | Env posture, health expectations |
| `rollback.marked` | Rollback pointers, failure patterns |

**Clarification:** "Source journal" means **source of deploy narrative for humans** — not the canonical store. Canonical store remains the append-only ledger (ADR-001).

**Rationale:** Deploy/env facts need a durable, sectioned narrative aligned with existing SitePilot docs. Operators read DEPLOYMENT_STATE; machines read ledger.

---

## ADR-005: Rollback Philosophy

**Decision:** Rollback is **metadata and procedure**, not automation.

| In scope | Out of scope |
|----------|--------------|
| `rollback.marked` → ledger `target_seq` | Auto `railway rollback` |
| Rollback lock blocks conflicting success claims | Auto `migration:revert` |
| Document known-good artifact refs in `refs` | DB schema rollback |

**Known-good pointer:** Primary key = ledger `seq` at stable state. External IDs (Railway deployment ID, git SHA) live in `refs` only.

**Forward fix:** Release rollback lock → append new events → re-project. No ledger rewrite.

**Rationale:** Matches existing Railway manual rollback (`DEPLOYMENT_STATE.md`). Schema and infra rollback stay human-governed.

---

## ADR-006: Deterministic Serialization

**Decision:** Projection output bytes must be reproducible.

| Rule | Detail |
|------|--------|
| Stable key order | JSON: sorted keys; MD: fixed section order |
| Time in body | Use event `ts` only; no `Date.now()` in fold |
| `generated_at` | Footer metadata; excluded from determinism hash |
| Spec pin | Footer includes `osctl-spec/x.y.z` |
| Locale | UTF-8, `\n` line endings, no trailing whitespace variance |

**Verification:** `osctl verify` replays ledger twice; hash of projection output must match.

**Rationale:** CI gates and agent trust require "same inputs → same outputs."

---

## ADR-007: Single-Writer Model

**Decision:** At most one writer appends to the ledger at a time.

| Writer context | Policy |
|----------------|--------|
| Local human | Acquire `ledger-write` lock (Phase 2) before ingest |
| CI job | One job per branch/env; lock in workflow |
| Agents (Cursor/Claude) | Ingest only when human approves; never concurrent with CI |

**Conflict resolution:** If seq collision detected on push, reject append; operator rebases ledger (merge events, re-seq) via explicit repair procedure — never silent overwrite.

**Rationale:** Monotonic seq without distributed consensus requires single-writer discipline until Phase 4.

---

## ADR-008: CI Does Not Own Truth Initially

**Decision:** Phase 1–2: CI **observes** and **appends**; CI does **not** define operational truth alone.

| Phase | CI role |
|-------|---------|
| 1 | No OSCTL integration |
| 1.5 | Docs + discipline only |
| 2 | Optional `deploy.observed` append post-health-check |
| 3 | Verify projections match ledger on PR |
| 4 | CI-enforced ledger sync (still not deploy orchestration) |

**Why:**

1. **Bootstrap problem** — ledger must exist before CI can validate against it.
2. **False confidence** — CI green ≠ correct operational state (health 200, missing migrations).
3. **Secret boundary** — CI must not become secret or env source of record.
4. **Human authority** — rollback and production gates stay human until Phase 4 policy defined.

**Rationale:** SitePilot already has deploy-without-state-truth gaps (manual migrations, stale MD). CI owning truth prematurely would cement wrong state.

---

## Decision Index

| ID | Summary |
|----|---------|
| ADR-001 | Append-only ledger = canonical store |
| ADR-002 | Projections derived by replay |
| ADR-003 | CURRENT_STATUS = projection only |
| ADR-004 | DEPLOYMENT_STATE = deployment journal (derived) |
| ADR-005 | Rollback = metadata, not automation |
| ADR-006 | Deterministic serialization |
| ADR-007 | Single-writer ledger |
| ADR-008 | CI observes first; does not own truth initially |

**Related:** `BOUNDARIES.md`, `NON_GOALS.md`, `STATE_MACHINE.md`, `CI_INTEGRATION_PLAN.md`
