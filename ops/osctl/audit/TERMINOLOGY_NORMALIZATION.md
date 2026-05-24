# OSCTL Terminology Normalization

**Date:** 2026-05-24
**Mode:** Read-only consolidation audit (strict)
**Scope:** Vocabulary used across `ops/osctl/`, `ops/osctl/validation/`, `ops/osctl/snapshots/`, `ops/osctl/audit/`, `MASTER_CONTEXT.md`, `CURRENT_STATUS.md`, `AGENT_RULES.md`.
**Companion:** `audit/TERMINOLOGY_REGISTRY.md` (prior audit). This document is **not a re-run** of the registry; it is the **normalization decision plan** that resolves drift detected there.

---

## 1. Drift Findings (Critical Pairs)

| # | Term | Meaning A | Meaning B | Where conflict appears | Severity |
|---|------|-----------|-----------|------------------------|----------|
| T-1 | "Phase 3" | CI verify gate (governance roadmap) | Snapshot acceleration layer | Roadmap docs vs `snapshots/PHASE3_FINAL_REVIEW.md`, `MASTER_CONTEXT.md` | **HIGH** |
| T-2 | CLI verb `project` | Documented command in README, FREEZE, HUMAN_BOUNDARIES | Not implemented; actual is `replay` | All freeze docs vs `core/cli/main.py` | **HIGH** |
| T-3 | CLI verb `ingest` | Future ingest command in `SPEC_REFERENCE`, `IMPLEMENTATION_NOTES`, `CI_INTEGRATION_PLAN` | Not implemented; actual is `append` | Draft docs vs core | MEDIUM |
| T-4 | `deploy.observed` | Draft event name | Not in v1.0 enum (which uses `deploy.recorded`) | `SPEC_REFERENCE`, `CI_INTEGRATION_PLAN`, `ops/state/GOVERNANCE`, rituals | **HIGH** |
| T-5 | `rollback.marked` | Draft event name | Not in v1.0 enum (which uses `rollback.recorded`) | `SPEC_REFERENCE`, `ARCHITECTURE_DECISIONS` | **HIGH** |
| T-6 | `migration.observed`, `health.observed`, `env.declared`, `note.human`, `lock.acquired/released` | Draft event names | None are in v1.0 enum | `SPEC_REFERENCE`, ADRs, rituals, simulations | MEDIUM (planning only) |
| T-7 | `osctl-freeze/1.0` vs `osctl-freeze/1.5` | Freeze ID | Active freeze is 1.5 | `ARCHITECTURE_DECISIONS.md`, `CI_INTEGRATION_PLAN.md`, checklist | LOW (label drift) |
| T-8 | `osctl-spec/0.1.0-draft` | Draft spec ID | Active spec is `osctl-core/1.0` | `SPEC_REFERENCE.md` | LOW |
| T-9 | "trust kernel" | `ops/osctl/core/` | Sometimes used to mean "core + validation" | Snapshot docs, audit docs | LOW |
| T-10 | "coordination layer" | Anchoring target in hygiene plans | No directory exists | `audit/GIT_ANCHORING_PLAN.md`, `SAFE_STAGE_SEQUENCE.md`, `REPO_CLEANUP_REPORT.md` | LOW |
| T-11 | "source of truth" | Canonical machine truth (ledger) | Used loosely for projections, root MDs, MASTER_CONTEXT | Many docs | MEDIUM |
| T-12 | "production" | Event `env` value | Railway environment | "production gate" (human go/no-go) | All docs | LOW (context disambiguates) |
| T-13 | "snapshot" | OSCTL snapshot file (`snapshots/`) | Governance snapshot (`FREEZE_v1.md` is "snapshot") | `FREEZE_v1.md` header vs snapshot layer | LOW |
| T-14 | "authority" | Operational authority (who acts) | Truth authority (which file is canonical) | Audit docs especially | MEDIUM |
| T-15 | "validation" | Validation suite under `ops/osctl/validation/` | Schema-level validation in `verify` | All docs | LOW |
| T-16 | "replay" | Pure-function replay of ledger | Sometimes confused with re-execution of deploy | Rituals, simulations | MEDIUM |
| T-17 | "verify before act" / "VERIFY before ACT" | Same principle, different casing | Both forms used | Multiple docs | LOW (style) |
| T-18 | "deterministic" | Same input → same output | Sometimes used to imply "automated" | Snapshot docs | LOW |
| T-19 | "governance" | Document hierarchy + roles | Sometimes used for any non-code doc | All docs | LOW |

---

## 2. Normalization Decisions

### Canonical vocabulary (frozen by this audit, no new authority introduced)

| Concept | **Use this** | **Stop using** |
|---------|--------------|----------------|
| Snapshot work label | **Snapshot Layer** or **P1.5-S** | "Phase 3" |
| CI verify gate phase | **Phase 3 (CI verify gate)** | (no change) |
| CLI: regenerate projections | **`replay`** | `project` (in docs/scripts), `osctl project` |
| CLI: append event | **`append`** | `ingest`, `osctl ingest` |
| Deploy event name | **`deploy.recorded`** | `deploy.observed` (allowed only in `SPEC_REFERENCE.md` history banner) |
| Rollback event name | **`rollback.recorded`** | `rollback.marked` |
| Reconcile event name | **`reconcile.recorded`** | (no change) |
| Health observation | (field on `deploy.recorded` payload) | `health.observed` event type |
| Migration observation | (deferred — not in v1.0) | `migration.observed` (must be banner-marked draft) |
| Env posture | `env_posture` (payload field) | `env.declared` event type |
| Notes | (deferred — not in v1.0) | `note.human` event type |
| Locks | (deferred — not in v1.0) | `lock.acquired` / `lock.released` |
| Freeze ID | **`osctl-freeze/1.5`** | `osctl-freeze/1.0`, `osctl-freeze/0.0` (banner only) |
| Spec version | **`osctl-core/1.0`** | `osctl-spec/0.1.0-draft` (banner only) |
| Trust kernel | **`ops/osctl/core/` (and only this)** | "core + validation" usage |
| Source of truth | **Ledger only** | Projections, root MDs, MASTER_CONTEXT |
| Authority (operational) | **"operational authority"** | unqualified "authority" near doc-canonical discussions |
| Authority (canonical doc) | **"canonical doc"** or **"canonical source"** | unqualified "authority" |
| Verification principle | **"VERIFY before ACT"** (uppercase, hyphen-free) | "verify before act", "Verify-before-Act" |

### Coordination layer

There is no `ops/osctl/coordination/` and no `ops/coordination/` directory. The term in hygiene plans is **unimplemented**. Two acceptable resolutions, both human:

1. **Drop the term.** Replace each occurrence with the actual referenced directory (`ops/rituals/`, `ops/state/`, or `ops/simulations/`).
2. **Define it once.** If a coordination directory is genuinely planned, add a one-line definition to `ops/README.md` or `BOUNDARIES.md`. Do **not** create the directory in this audit.

**Recommendation:** Option 1. Adding a new layer violates the SIMPLIFY-before-EXPAND principle.

---

## 3. Documents Requiring Vocabulary Sweep

| File | Replacements needed |
|------|---------------------|
| `ops/osctl/README.md` | `project` → `replay` (Quick Start) |
| `ops/osctl/HUMAN_BOUNDARIES.md` | `project` → `replay` (CLI table) |
| `ops/osctl/ARCHITECTURE_FREEZE.md` | `{append, project, verify}` → `{append, replay, verify}` |
| `ops/osctl/ARCHITECTURE_DECISIONS.md` | Header `osctl-freeze/1.0` → `osctl-freeze/1.5`; `deploy.observed`/`rollback.marked`/`note.human` flagged as draft |
| `ops/osctl/CI_INTEGRATION_PLAN.md` | Freeze ID 1.0 → 1.5; `deploy.observed` → `deploy.recorded`; `osctl ingest` → `osctl append`; `production.jsonl` → `events.jsonl` |
| `ops/osctl/SPEC_REFERENCE.md` | SUPERSEDED banner only — content kept for history |
| `ops/osctl/IMPLEMENTATION_NOTES.md` | Pre-implementation banner — vocabulary may stay as draft |
| `ops/state/GOVERNANCE.md` | `deploy.observed` → `deploy.recorded`; remove duplicated role table; redirect to `ops/osctl/GOVERNANCE.md` |
| `ops/rituals/*.md`, `ops/simulations/*.md` | `.observed`/`.marked` → `.recorded` where they refer to OSCTL events |
| `ops/osctl/snapshots/PHASE3_FINAL_REVIEW.md` | Title and references: "Phase 3" → "Snapshot Layer" |
| `MASTER_CONTEXT.md` | "Phase 3 artifacts" → "Snapshot Layer artifacts (P1.5-S)" |
| `AGENT_RULES.md` | Add VERIFY-before-ACT requirement; explicit demotion of root legacy MDs |
| `audit/TERMINOLOGY_REGISTRY.md` | Already reflects this normalization; no edits needed |

---

## 4. Non-Drift Cases (Already Coherent)

The following terms are **consistent** across the corpus and need no normalization:

- `ledger`, `event`, `seq`, `actor`, `payload`, `refs`, `env_posture`
- `fingerprint`, `replay_fingerprint`, `projection_fingerprint`
- `append-only`, `monotonic`, `pure function`
- `human:`, `ci:`, `agent:` actor prefixes
- `O_APPEND`, `JSONL`, `UTC`, `Z` suffix
- `CURRENT_STATUS`, `DEPLOYMENT_STATE` projection names
- `verify` exit codes (0 / 1)

---

## 5. Style / Casing Standard (Light)

| Form | Use |
|------|-----|
| Headings | Title Case |
| Principle | `VERIFY before ACT` (this exact form) |
| Code/CLI | Backticks for commands and paths |
| Spec / freeze IDs | Backticks: `osctl-core/1.0`, `osctl-freeze/1.5` |
| Doc cross-link | Bracketed filename + path: `[FREEZE_v1.md](./FREEZE_v1.md)` |
| Phase numbers | `Phase 1`, `Phase 1.5`, `Phase 2`, `Phase 3`, `Phase 4`, `P1.5-S` |

No other style mandates introduced.

---

## 6. Normalization Verdict

| Dimension | Verdict |
|-----------|---------|
| Drift items detected | **19 (T-1..T-19)** |
| HIGH-severity drift items | **3** — Phase 3 collision, `project` CLI, `deploy.observed` schema |
| Drift fixable by doc edits only | **17** of 19 |
| Drift requiring code change | **0** (all CLI vocabulary mismatches are docs-side) |
| Risk if untreated | MEDIUM — operator/agent confusion; broken automation if drafts followed literally |

**Recommendation:** Apply §3 vocabulary sweep in a single human-led docs-only commit, separate from path reconciliation and from any code change. No new terms introduced.
