# OSCTL Architectural Entropy Report

**Date:** 2026-05-24
**Mode:** Read-only consolidation audit (strict)
**Question:** Is OSCTL accumulating structural complexity faster than it is delivering operational value?
**Principle:** SIMPLIFY before EXPAND. Entropy is anything that increases cognitive cost without adding kernel capability.

---

## 1. Document-Count Inventory

Files counted under each subtree (markdown only, excluding fixtures and `.generated.md`):

| Tree | MD files | Categories present |
|------|----------|--------------------|
| `ops/osctl/` (root spec) | **20** | Freeze, governance, schema, model, policy, ADR, plan |
| `ops/osctl/audit/` | **19** | Hygiene, anchoring, consistency, trust, invariants, terminology, phase, future-risk, two final verdicts (so far) |
| `ops/osctl/snapshots/` | **10** | Architecture, format, security, retention, failure modes, state machine boundaries, capability, agent authority, future risks, phase3 review |
| `ops/osctl/validation/` | **9** | Reports, registries, tests, trust model duplicate, "what remains manual" |
| `ops/osctl/examples/` | 1 + per-rehearsal READMEs | Rehearsal narratives |
| `ops/osctl/core/` | 1 (README) | Code-adjacent |
| **Total OSCTL governance MD** | **≈ 60+** | |

For comparison, total core source files: **18 Python files, stdlib only**.

**Doc-to-code ratio:** roughly **3.3 governance docs per source file**. This alone is not pathological for a governance kernel, but combined with §2 it signals concern.

---

## 2. Entropy Indicators

### E-1: Governance recursion (audit-of-audits)

The `audit/` tree now contains **three audit cycles**, each producing its own "FINAL_VERDICT":

| Cycle | Verdict file | Scope |
|-------|--------------|-------|
| Round 1 — Hygiene | `FINAL_HYGIENE_VERDICT.md` | git tracking + artifacts |
| Round 2 — Architecture | `FINAL_AUDIT_VERDICT.md` | path/CLI/governance consistency |
| Round 3 — Consolidation | `CONSOLIDATION_FINAL_VERDICT.md` (this run) | duplication + simplification |

Round 2 created `INVARIANT_REGISTRY.md`, `TERMINOLOGY_REGISTRY.md`, `PHASE_ALIGNMENT_MATRIX.md`, `TRUST_BOUNDARY_AUDIT.md`. This audit is now creating `GOVERNANCE_DEDUPLICATION_PLAN.md`, `SOURCE_OF_TRUTH_MAP.md`, `TERMINOLOGY_NORMALIZATION.md`, `ARCHITECTURAL_ENTROPY_REPORT.md`, `TRUST_SIMPLIFICATION_PLAN.md`, `HUMAN_OPERABILITY_REVIEW.md`, `CONSOLIDATION_FINAL_VERDICT.md`.

**This is itself an entropy signal.** Rounds 2 and 3 overlap substantially on terminology, invariants, and phase alignment. Without a stop-rule, a Round 4 audit-of-the-consolidation-audit becomes likely.

**Stop-rule recommendation (to humans):** No further audit cycles until the actions in §6 of `CONSOLIDATION_FINAL_VERDICT.md` are applied or explicitly rejected. Any future audit must declare which prior round it supersedes.

### E-2: Phase fragmentation

Phase nomenclature appears in **at least three orthogonal forms**:

| Form | Used by |
|------|---------|
| Roadmap phases (1, 1.5, 2, 3, 4) | governance, README, FREEZE_v1, ARCHITECTURE_FREEZE, CI_INTEGRATION_PLAN |
| Layer stack (L0..L5) | `audit/ARCHITECTURE_CONSISTENCY_AUDIT.md` |
| Snapshot layer phases (CREATED → VERIFIED → REFERENCED → ARCHIVED → INVALIDATED → SUPERSEDED) | `SNAPSHOT_ARCHITECTURE.md` |
| Phase 4 audit gates (P4-1..P4-8) | `CLEAN_STATE_REQUIREMENTS.md` |
| Hygiene G1..G8 | `CLEAN_STATE_REQUIREMENTS.md` |

These are not contradictory but they **fragment cognitive maps**. A new operator must learn five separate numbering schemes. Recommendation: keep only the roadmap (1..4) and the snapshot lifecycle. Demote layer stack to one informal diagram in `BOUNDARIES.md`. Demote G1..G8 to a single hygiene checklist, not a phase model.

### E-3: Redundant matrices

Matrices found:

| Matrix | File | Notes |
|--------|------|-------|
| Authority matrix | `BOUNDARIES.md`, `HUMAN_BOUNDARIES.md`, `snapshots/AGENT_AUTHORITY_MAP.md`, `snapshots/CAPABILITY_MATRIX.md`, `audit/TRUST_BOUNDARY_AUDIT.md` | **5 overlapping matrices** |
| Phase matrix | `GOVERNANCE.md`, `README.md`, `FREEZE_v1.md`, `ARCHITECTURE_FREEZE.md`, `CI_INTEGRATION_PLAN.md`, `audit/PHASE_ALIGNMENT_MATRIX.md` | **6 overlapping matrices** |
| Invariant matrix | `FREEZE_v1.md` §6, `audit/INVARIANT_REGISTRY.md` | 2 |
| Trust boundary matrix | `TRUST_MODEL.md`, `validation/TRUST_MODEL.md`, `audit/TRUST_BOUNDARY_AUDIT.md`, `snapshots/SNAPSHOT_TRUST_BOUNDARIES.md` | 4 |
| Terminology matrix | `audit/TERMINOLOGY_REGISTRY.md`, `audit/TERMINOLOGY_NORMALIZATION.md` (this round) | 2 (companion — acceptable) |

**Recommendation:** Each concept gets **one canonical matrix**; everywhere else uses prose + cross-link. See `GOVERNANCE_DEDUPLICATION_PLAN.md`.

### E-4: Duplicated audit registries

| Registry | Round 2 file | Status |
|----------|--------------|--------|
| Invariants | `INVARIANT_REGISTRY.md` | Duplicates `FREEZE_v1.md` §6 |
| Terminology | `TERMINOLOGY_REGISTRY.md` | Companion to canonical sources — acceptable; do not promote to spec |
| Phase alignment | `PHASE_ALIGNMENT_MATRIX.md` | Resolves T-1 drift; should be retired once `MASTER_CONTEXT.md` and snapshot docs are renamed |
| Future risk | `FUTURE_RISK_REVIEW.md` + `snapshots/FUTURE_RISKS.md` | Two future-risk registries — should merge |

### E-5: Unnecessary phase layering

`SNAPSHOT_ARCHITECTURE.md` defines six lifecycle states (CREATED → VERIFIED → REFERENCED → ARCHIVED → INVALIDATED → SUPERSEDED) for an artifact whose CLI cannot **create** snapshots in v1.0. The lifecycle is mostly aspirational. Acceptable as design, but should be explicitly labeled "design — not implemented in `osctl-core/1.0`".

### E-6: Document proliferation in audit/

19 audit files were produced across two prior cycles. Several have overlapping content (cleanup vs hygiene plan vs anchoring plan vs commit strategy vs stage sequence — five files describing roughly the same git workflow). Without consolidation these will continue to expand on each cycle.

### E-7: Forward-references to unimplemented features

| Doc | Forward reference | In v1.0 core? |
|-----|-------------------|---------------|
| `IMPLEMENTATION_NOTES.md` | `osctl status`, lock CLI, lock TTLs | No |
| `SPEC_REFERENCE.md` | `osctl ingest`, lock events, hash chain | No |
| `CI_INTEGRATION_PLAN.md` | Phase 4 enforcement | No |
| `SNAPSHOT_ARCHITECTURE.md` | Snapshot writer | No (read-only scripts only) |
| Rituals | `deploy.observed`, `migration.observed` | No |

Forward references are not entropy in themselves but **become entropy when followed literally** by automation or new operators. Mitigation: standard "**Status: Pre-implementation — not in `osctl-core/1.0`**" banner.

### E-8: Layer ambiguity (coordination, audit-as-layer)

The strict-mode prompt mentioned a "coordination layer". The repository has no such directory or canonical definition; the term appears only in audit/hygiene plans. Treat as **non-existent**. Adding a new layer is forbidden by SIMPLIFY-before-EXPAND.

The `audit/` directory itself is now treated by some prior plans as a **trust layer**. It is not — audit files are point-in-time observations. They must be explicitly marked non-authoritative (`audit/CONSOLIDATION_FINAL_VERDICT.md` will state this).

---

## 3. Entropy Heatmap

| Area | Pages | Distinct concepts | Entropy density |
|------|-------|-------------------|-----------------|
| `core/` | 1 | 1 (the kernel) | LOW |
| Spec docs (root osctl) | 12 | 12 (one per file) | LOW |
| Governance docs (root osctl) | 5 | 4 (Governance, Boundaries, Human, Trust, Non-Goals) | LOW-MED |
| Freeze docs | 3 | 1 (the freeze) | MED — three views of one fact |
| Snapshots | 10 | 7 (most concepts unique to layer) | MED |
| Validation | 9 | 6 | MED — TRUST_MODEL duplicate |
| **Audit** | 19 | ≈ 8 (concepts repeated across rounds) | **HIGH** |
| Adjacent (`ops/state/`, `ops/rituals/`, `ops/simulations/`) | 30+ | Mostly templates | MED — `ops/state/GOVERNANCE.md` duplicates osctl |

**Top contributors to entropy:** `audit/` (round-on-round growth) and freeze-vs-snapshot phase collision.

---

## 4. Entropy Growth Vectors (If Untreated)

| Vector | Likely outcome in 3 months |
|--------|---------------------------|
| Round-4 audit | New `XYZ_FINAL_VERDICT.md`, deeper recursion |
| Phase 2 implementation | Each draft term in `SPEC_REFERENCE.md` resurfaces; new conflict cluster |
| Snapshot writer added | `SNAPSHOT_ARCHITECTURE.md` lifecycle becomes binding; new freeze bump |
| Backend coupling | `MASTER_CONTEXT.md` grows; OSCTL section bleeds into product docs |
| New agent type | New "AGENT_AUTHORITY_MAP" variant under `audit/` or `snapshots/` |
| External head-hash anchoring | New `ANCHORING_LEDGER.md` — risk of becoming third truth surface |

**Mitigation:** Treat the §6 actions in `CONSOLIDATION_FINAL_VERDICT.md` as a precondition for any new architectural work.

---

## 5. Hard Limits Recommended (No New Authority)

These are recommendations, not enforcement. They go to a human owner.

| Limit | Value |
|-------|-------|
| Max `audit/*` files | **20** (currently 19) — block growth without explicit retirement |
| Max distinct authority matrices | **3** (BOUNDARIES, HUMAN_BOUNDARIES, TRUST_MODEL) |
| Max phase numbering schemes | **2** (roadmap 1..4, snapshot lifecycle) |
| New layer creation | **Blocked** until §6 of `CONSOLIDATION_FINAL_VERDICT.md` complete |
| New `_REGISTRY.md` files | **Blocked** unless replacing an existing one |
| New `_PLAN.md` in audit/ | **Blocked** unless replacing existing plan |

---

## 6. Entropy Verdict

| Dimension | Verdict |
|-----------|---------|
| Core code complexity | **LOW** — 18 stdlib files, no growth pressure |
| Spec doc complexity | **LOW-MED** — well-scoped per topic |
| Governance recursion | **HIGH** — 3 audit rounds, overlapping registries |
| Phase fragmentation | **MED-HIGH** — 5 numbering schemes |
| Document proliferation | **MED-HIGH** — audit/ doubled in prior round |
| Forward-reference creep | **MED** — drafts persist alongside frozen specs |

**Net architectural entropy:** **ELEVATED but reversible.** The core is clean; the surrounding governance + audit surface is over-grown. SIMPLIFY actions in companion docs (`GOVERNANCE_DEDUPLICATION_PLAN.md`, `TRUST_SIMPLIFICATION_PLAN.md`, `TERMINOLOGY_NORMALIZATION.md`) reduce surface without changing the kernel.

**No new architecture phase, no new layer, and no new authority introduced by this report.**
