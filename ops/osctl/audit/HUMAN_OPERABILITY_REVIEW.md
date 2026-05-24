# OSCTL Human Operability Review

**Date:** 2026-05-24
**Mode:** Read-only consolidation audit (strict)
**Question:** Can a single human operator (with no prior OSCTL context) read the repository in under one hour and answer:
1. *What is OSCTL for?*
2. *Where is operational truth?*
3. *What can I safely do, and what is forbidden?*
4. *What command do I run?*
5. *Who do I escalate to?*

---

## 1. Operability Test Results

| Question | Where the answer lives today | Operator-friendly? |
|----------|------------------------------|--------------------|
| What is OSCTL for? | `ops/osctl/README.md` (clear), `ops/osctl/GOVERNANCE.md` §Purpose, `MASTER_CONTEXT.md` (dilutes), `FREEZE_v1.md` (long) | **Yes** if you start at README; **No** if you start at MASTER_CONTEXT |
| Where is operational truth? | `LEDGER_MODEL.md` says `ops/state/ledger/`; `paths.py` defaults to `ops/osctl/ledger/`; both files exist | **No** — split-brain |
| What can I safely do / what is forbidden? | `BOUNDARIES.md` + `HUMAN_BOUNDARIES.md` + `NON_GOALS.md` + `snapshots/CAPABILITY_MATRIX.md` + `snapshots/AGENT_AUTHORITY_MAP.md` | **Partial** — five overlapping documents, no single page |
| What command do I run? | README says `python -m ops.osctl.core project`; CLI implements `replay`. Several docs disagree. | **No** — wrong command in canonical README |
| Who do I escalate to? | `BOUNDARIES.md`, `HUMAN_BOUNDARIES.md`, `AGENT_AUTHORITY_MAP.md` "Escalation Paths" | **Yes** — but spread across docs |

**Net:** A new operator following the README runs a non-existent command, reads stale root status, and cannot tell which ledger is canonical. **Operability is below safe threshold.**

---

## 2. Cognitive Load Inventory

### 2.1 Document fan-out from a "first day" path

A new operator opens `ops/osctl/README.md`. From there:

```
README.md
├── FREEZE_v1.md             (400+ lines)
├── ARCHITECTURE_FREEZE.md   (cross-ref to FREEZE_v1.md, ARCHITECTURE_DECISIONS.md, validation/)
├── GOVERNANCE.md            (cross-ref to 14 docs)
├── TRUST_MODEL.md           (cross-ref to VERIFY_MODEL, REPLAY_GUARANTEES, validation/)
├── HUMAN_BOUNDARIES.md      (cross-ref to GOVERNANCE, BOUNDARIES, NON_GOALS)
├── LEDGER_MODEL.md          (path conflict)
├── EVENT_SCHEMA.md
├── STATE_MACHINE.md
├── SERIALIZATION_RULES.md
├── PROJECTION_RULES.md      (path conflict)
├── REPLAY_GUARANTEES.md
├── VERIFY_MODEL.md
├── DRIFT_DETECTION.md
├── ROLLBACK_POLICY.md
├── NON_GOALS.md
└── ARCHITECTURE_DECISIONS.md (header says freeze 1.0 — drift)
```

That is **~15 mandatory reads** before the operator knows what to do. Plus snapshots/ (10), validation/ (9), audit/ (19), root governance (4). Total: **~57 documents**.

### 2.2 Time-to-first-correct-action estimate

| Task | Estimated time today | After simplification |
|------|---------------------|----------------------|
| Locate the canonical ledger | 10–20 min (must read 4 files + paths.py) | 1 min |
| Run the right CLI command | 5–10 min (must compare README vs `main.py`) | 30 sec |
| Decide if an action is allowed | 15–30 min (5 authority surfaces) | 2 min |
| Identify escalation path | 5–10 min | 1 min |
| Determine what is "Phase 3" | 10+ min (collision) | 1 min |
| Trust a projection | Currently impossible without verify; AGENT_RULES does not require verify | 30 sec |
| **Total first-task readiness** | **~60–90 min** | **~10 min** |

---

## 3. Multiple Approval Chains (Operator Confusion)

Approval chains are described in:

| Doc | Chain |
|-----|-------|
| `GOVERNANCE.md` | Human owner > CI > OSCTL > Agents |
| `BOUNDARIES.md` | Cross-boundary rules with platform owners |
| `HUMAN_BOUNDARIES.md` | Three zones with permanent / may-automate / never |
| `ops/state/GOVERNANCE.md` | Same model with draft event names |
| `snapshots/AGENT_AUTHORITY_MAP.md` | Architect / Validator / Snapshot / CI / Deploy / Human |
| `snapshots/CAPABILITY_MATRIX.md` | Read / Write / Forbidden lists |
| `MASTER_CONTEXT.md` | "Validated assumptions" + "Forbidden" |

**Same content, six entry points.** A new operator cannot tell which is binding. Recommendation: **single-page operator quickref**, *not* a new authority — a synthesis pointing to canonicals.

---

## 4. Unclear Operational Entrypoints

### 4.1 Missing single quickref

There is no one-page document answering: *"I am a human operator. I just need to know what to do today."* The closest is `ops/osctl/README.md` (good but minimal) and `ops/state/README.md` (templates, not procedures).

**Recommendation (without creating new authority):** Use `ops/osctl/README.md` as the single quickref. Keep it ≤ 100 lines. Each item links to exactly one canonical doc.

### 4.2 Rituals duplicate procedures

`ops/rituals/DAILY_OPERATIONS.md`, `DEPLOY_RITUAL.md`, `HANDOFF_PROTOCOL.md`, `ROLLBACK_RITUAL.md`, `WEEKLY_RECONCILIATION.md`, `INCIDENT_TRIAGE.md`, `PRODUCTION_GO_NO_GO.md`, `STAGING_VALIDATION.md` — 8 rituals. They use draft event names (`deploy.observed`) that the core rejects. An operator following them would write events the system refuses.

**Recommendation:** Single doc-edit pass to update rituals to `.recorded` event names; or banner them as "pre-implementation drafts" until Phase 2 ingest exists.

### 4.3 Simulations as risk

`ops/simulations/*.md` describe failure scenarios. They reinforce mental models but also introduce yet more event-name vocabulary that may drift. Same banner action applies.

---

## 5. Operator Burden Per Task

### 5.1 Append a deploy event (today)

Steps a careful human must take:

1. Read `EVENT_SCHEMA.md` (correct names)
2. Cross-check `SPEC_REFERENCE.md` (wrong names — must ignore)
3. Check rituals for example payload (mostly wrong names)
4. Check `ops/osctl/examples/*/events.jsonl` (correct names — finally)
5. Decide which ledger path to write to (split-brain — must pick)
6. Run `python -m ops.osctl.core append --file event.json`
7. Run `python -m ops.osctl.core replay` (not `project` even though docs say so)
8. Run `python -m ops.osctl.core verify`

**8 steps, 4 sources to reconcile.** After simplification: 3 steps, 1 source.

### 5.2 Decide if an action is allowed

Today: read 5 authority surfaces and reconcile. After simplification: read 3 (BOUNDARIES, HUMAN_BOUNDARIES, NON_GOALS).

### 5.3 Trust a projection

Today: `AGENT_RULES.md` does not require verify; cognitive overhead falls on the operator to remember the discipline. After simplification: AGENT_RULES requires verify-first; root legacy MDs are stamped non-authoritative.

---

## 6. Cognitive Overload Indicators

| Indicator | Status | Treatment |
|-----------|--------|-----------|
| > 50 governance docs | YES (≈ 60+) | Banners + redirects, not deletion |
| Multiple "FINAL_VERDICT" files | YES (3 verdicts) | Stop-rule (see entropy report §1) |
| Same matrix in > 2 docs | YES (authority ×5, phase ×6) | Cluster cleanup per `GOVERNANCE_DEDUPLICATION_PLAN.md` |
| Wrong CLI command in canonical README | YES | Single edit |
| Stale dates on agent-read docs | YES (root MDs 2026-05-02) | Banner |
| Phase numbering collisions | YES (Phase 3) | Rename to "Snapshot Layer" |
| Multiple ledger paths | YES | Choose one |
| Approval chain ambiguity | MEDIUM (6 chain descriptions) | Cross-link to single canonical |
| Forward-references to unimplemented features | YES | "Pre-implementation" banner |

---

## 7. Recommended Operator-Friendly Layout (Editorial Only)

No new files. Just editorial repositioning:

```text
START HERE
  ops/osctl/README.md            ← 100-line quickref (currently 80; almost there)
       │
       ├─ "How OSCTL works"      → GOVERNANCE.md + diagram in BOUNDARIES.md
       │
       ├─ "What I can/can't do"  → BOUNDARIES.md → HUMAN_BOUNDARIES.md → NON_GOALS.md
       │
       ├─ "Commands"              → embedded snippets, must reflect actual CLI
       │
       ├─ "Where truth lives"     → LEDGER_MODEL.md (single canonical path)
       │
       ├─ "How to verify"         → VERIFY_MODEL.md (1 doc)
       │
       └─ "Snapshot acceleration" → snapshots/SNAPSHOT_ARCHITECTURE.md (scoped)

DEEP REFERENCES (look up only when needed)
  EVENT_SCHEMA.md, STATE_MACHINE.md, REPLAY_GUARANTEES.md,
  SERIALIZATION_RULES.md, PROJECTION_RULES.md, DRIFT_DETECTION.md,
  ROLLBACK_POLICY.md, ARCHITECTURE_DECISIONS.md, ARCHITECTURE_FREEZE.md,
  FREEZE_v1.md, TRUST_MODEL.md

EVIDENCE (proof, not authority)
  validation/*

AUDIT (observations, not authority)
  audit/*

DRAFTS (pre-implementation, banner-marked)
  SPEC_REFERENCE.md, IMPLEMENTATION_NOTES.md, ARCHITECTURE_FREEZE_CHECKLIST.md
  CI_INTEGRATION_PLAN.md (partial)
```

This layout is achievable purely via banners and README edits.

---

## 8. Operability Verdict

| Dimension | Verdict |
|-----------|---------|
| Single canonical entrypoint | PARTIAL — README exists but contains wrong CLI |
| Single canonical truth path | **NO** — split-brain ledger/projection |
| Single canonical agent contract | **NO** — `AGENT_RULES.md` lacks verify-first |
| First-task readiness time | **TOO HIGH** (~ 60–90 min today) |
| Approval chain clarity | PARTIAL — 6 overlapping descriptions |
| Forbidden-action clarity | YES (NON_GOALS is canonical) |
| Cognitive overload risk | **HIGH** under current surface |

**Net human operability:** **BELOW SAFE THRESHOLD** for production reliance, but recoverable by the editorial actions in `GOVERNANCE_DEDUPLICATION_PLAN.md`, `TERMINOLOGY_NORMALIZATION.md`, and `TRUST_SIMPLIFICATION_PLAN.md`.

**Recommendation:** Treat operability as a precondition for Phase 2 entry. An operator who cannot, in 10 minutes, point to the canonical ledger, run the correct CLI, and identify forbidden actions, must not own a CI integration that appends to the ledger.
