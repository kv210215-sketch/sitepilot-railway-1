# Operator Handoff — Rehearsal

**Environment:** production (+ staging context in refs)  
**Events:** 3  
**Fingerprint:** `74033f5e153586996d72262bf4d61eff7c8575166297f146d623cf03178e16fe`

---

## 1. Scenario Description

| Field | Value |
|-------|-------|
| What happened | End-of-shift handoff: stable prod, mitigating SEV3, next release context in refs |
| Environment | `production` |
| Expected lifecycle end | `production` |
| Expected ledger events | 1 × deploy, 2 × incident (same ID, mitigating) |

Simulates `HANDOFF_PROTOCOL.md` using ledger-only artifacts. No `note.human` event type — handoff via `refs`.

---

## 2. Event Sequence

```text
None → production  (seq 1, current prod state)
(incident mitigating) (seq 2, SEV3 opened)
(incident update)     (seq 3, handoff refs to operator-b)
```

Lifecycle remains `production` throughout — incidents do not change lifecycle.

---

## 3. Example Ledger

See `events.jsonl`.

---

## 4. Replay Result

```bash
python -m ops.osctl.core replay \
  --ledger ops/osctl/examples/operator_handoff/events.jsonl \
  --output ops/osctl/examples/operator_handoff/projections
```

| Output | Key fields |
|--------|------------|
| `CURRENT_STATUS.generated.md` | lifecycle `production`, blocker B1 (SEV3 mitigating), seq 3 |
| `DEPLOYMENT_STATE.generated.md` | 1 deploy journal entry |

Excerpt — Known Blockers:

```markdown
| B1 | elevated latency on /api/projects — cache warming in progress | SEV3 | operator | seq 3 |
```

Handoff refs (seq 3, not in projection body):

```json
"refs": {
  "handoff_to": "human:operator-b",
  "next_release_candidate": "r20260528-stg-next",
  "staging_sha": "f6f6f6f6..."
}
```

---

## 5. Verify Result

| Check | Result |
|-------|--------|
| Schema | PASS |
| Transitions | PASS |
| Replay consistency | PASS |
| **Overall** | **PASS** |

---

## 6. Human Checkpoints

| Checkpoint | Actor | This scenario |
|------------|-------|---------------|
| GO/NO-GO | Human | Prod stable — no new deploy |
| Rollback approval | Human | N/A |
| **Severity classification** | **Human** | **SEV3** at seq 2 |
| Reconcile attestation | Human | N/A |
| **Handoff acceptance** | **Human** | operator-b reads projections + refs |

---

## 7. Drift Scenarios

| Drift type | Risk |
|------------|------|
| Handoff refs not in projection | Incoming operator must read ledger JSON for `handoff_to` |
| Stale incident | seq 2 status mitigating; reality may have changed |
| Unrecorded staging progress | `staging_sha` in refs but no staging deploy event |

---

## 8. Recovery Semantics

Incoming operator:

1. `replay` + `verify` on canonical ledger
2. Read CURRENT_STATUS blockers
3. Read seq 3 refs for next release candidate
4. Append new events for shift activity — never edit existing lines

---

## 9. Operator Ergonomics

| Area | Observation |
|------|-------------|
| Confusing steps | Handoff data split between projection and raw ledger refs |
| Naming friction | No dedicated handoff event type; incident reuse |
| Replay readability | Blockers visible; refs invisible in MD |
| Projection usability | Good for blockers; poor for handoff metadata |
| Reconciliation complexity | Medium — single global lifecycle cannot represent parallel staging work |

---

## 10. Final Assessment

| | |
|-|-|
| **Worked** | Incident blockers in CURRENT_STATUS; stable prod lifecycle |
| **Ambiguous** | Cannot record in-flight staging deploy without lifecycle conflict |
| **Improve before Phase 2** | Handoff runbook: always append incident update with refs; consider future `note.recorded` type |
