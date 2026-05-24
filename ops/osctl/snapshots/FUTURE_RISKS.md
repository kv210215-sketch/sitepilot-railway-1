# OSCTL Snapshot Layer — Future Risks

**Purpose:** Anticipate failure modes if snapshot discipline erodes  
**Status:** Phase 3 design guardrails

---

## Autonomous Agents Consuming Stale Snapshots

| Risk | Impact | Guardrail |
|------|--------|-----------|
| Agent reads cached snapshot | Wrong lifecycle state | Mandate ledger verify before agent context load |
| Agent skips seq check | Rollback posture error | Expose `ledger_seq` in agent prompts; compare tool |
| Long-running agent session | Monotonic ledger drift | Time-box context; re-verify each session |

---

## AI Hallucinated State

| Risk | Impact | Guardrail |
|------|--------|-----------|
| Model invents release ID | False deploy confidence | Bind agent outputs to ledger seq + fingerprint |
| Paraphrase replaces projection | Subtle drift | Require verbatim projection hash match |
| “Probably reconciled” | Skips verify | Hard fail if verify CLI not run |

---

## Hidden Mutable Caches

| Risk | Impact | Guardrail |
|------|--------|-----------|
| `.cache/osctl/state` | Shadow source of truth | Forbidden — document in CAPABILITY_MATRIX |
| In-memory agent state | Diverges from ledger | Read-only; rebuild from replay |
| IDE workspace snapshot | Stale handoff | Label as non-authoritative |

**Rule:** Any mutable cache must be explicitly labeled non-authoritative and must not feed deploy decisions.

---

## Unsafe Snapshot Restore Flows

| Anti-pattern | Why forbidden |
|--------------|---------------|
| “Restore snapshot → append synthetic events” | Rewrites history semantics |
| Snapshot → Railway rollback | Grants infra authority to file |
| Snapshot merge into ledger | Breaks append-only model |

**Correct pattern:** Replay ledger → human decides → optional new append event.

---

## Snapshot-Triggered Actions

Forbidden escalations:

- CI pass/fail based only on snapshot age
- Auto-deploy when snapshot says `production`
- Auto-rollback when snapshot says `rollback_active`
- PagerDuty from snapshot without live verify

Snapshots are **read acceleration**, not **actuation inputs**.

---

## Orchestration Drift

| Drift | Symptom | Prevention |
|-------|---------|------------|
| Snapshot writer in CI | Pipeline owns state | Phase 3: no CI mutation |
| Snapshot API endpoint | Network authority | No backend integration |
| “Latest snapshot” symlink | Mutable pointer | Forbidden auto-deletion / rotation |
| Cross-repo snapshot sync | Hidden truth fork | Single ledger per operational domain |

---

## Monitoring Recommendations (Human-Operated)

- Log every `compare_snapshot` drift result
- External head-hash anchoring of ledger fingerprint (human responsibility)
- Periodic replay regression via `ops/osctl/validation/run_validation.py`

No automated remediation in Phase 3.
