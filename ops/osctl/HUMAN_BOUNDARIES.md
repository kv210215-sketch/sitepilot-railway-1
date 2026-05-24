# OSCTL Human Boundaries

**Freeze ID:** `osctl-freeze/1.5`  
**Status:** Frozen

---

## Three Zones

| Zone | Definition | Examples |
|------|------------|----------|
| **MUST remain human** | Never autonomous; permanent human authority | Production go/no-go, rollback execution |
| **MAY automate later** | External automation may call core CLI; core unchanged | CI append, CI verify, fingerprint gate |
| **MUST NEVER become autonomous** | Forbidden regardless of phase | Auto-deploy, auto-rollback, AI prod gate |

---

## MUST Remain Human (Permanent)

| Responsibility | Why permanent |
|----------------|---------------|
| Production GO/NO-GO | Business and risk authority |
| Rollback approval | Irreversible operational decision |
| Rollback execution | Railway/VPS/DB actions outside core |
| Severity classification (SEV1–SEV4) | Incident judgment |
| Ambiguous incident handling | Conflicting observations require human resolution |
| Secret rotation | Secret values never enter OSCTL |
| Migration execution | `migration:run` / revert are runtime actions |
| Reconcile attestation | "Smoke passed" after rollback |
| Ledger conflict resolution | Git merge on `events.jsonl` |
| Freeze version bump approval | Governance change control |
| Granting production authority to actors | Policy, not code |

---

## MAY Become Automated Later (Phase 2+)

External systems may invoke core — **core does not invoke them**:

| Candidate | Interface | Human gate retained |
|-----------|-----------|---------------------|
| Post-deploy event append | `python -m ops.osctl.core append` | Prod assertions still human-approved initially |
| Projection regeneration | `python -m ops.osctl.core replay` | None — pure replay (`project` aliases `replay`) |
| Drift check | `python -m ops.osctl.core verify` | Alert only; no auto-fix |
| Fingerprint comparison | `projection_fingerprint()` | CI policy decision by human |
| Event JSON generation | External script → append file | Human reviews prod payloads |

Automation **records** and **verifies** — it does not **decide**.

---

## MUST NEVER Become Autonomous

| Forbidden | Rationale |
|-----------|-----------|
| Deploy orchestration | `NON_GOALS.md` §1 |
| Railway/Cloudflare API control | `NON_GOALS.md` §2, §7 |
| Secret read/write | `NON_GOALS.md` §3 |
| Runtime config mutation | `NON_GOALS.md` §4 |
| AI production deploy | `NON_GOALS.md` §5 |
| Auto-rollback on verify failure | Rollback is human procedure |
| Auto-reconcile | Reconcile requires human attestation |
| Auto-close incidents | Severity/closure is human judgment |
| Self-healing prod loops | No "fix prod" without human gate |
| Ledger rewrite / seq repair without human | Append-only invariant |

---

## Actor Authority Matrix

| Actor pattern | Append ledger | Prod gate | Rollback mark | Rollback execute |
|---------------|---------------|-----------|---------------|------------------|
| `human:*` | Yes | Yes | Yes | Yes (or delegate) |
| `ci:*` | Phase 2+ observe | No | No | No |
| `agent:*` | No (direct) | No | No | No |

Agents **draft** event JSON; humans **approve** prod ingests.

---

## Agent Rules (Cursor / Claude)

| Allowed | Forbidden |
|---------|-----------|
| Read projections and governance docs | Append ledger without human approval |
| Draft event JSON from verified facts | Mark production approved |
| Propose projection fixes via `replay` instruction | Execute deploy, Railway CLI, Docker |
| Analyze verify failures | Release rollback posture autonomously |

---

## Cross-Boundary Rules

1. **Execution ≠ truth** — deploy success ≠ ledger truth until ingest
2. **Verify ≠ heal** — verify detects drift; human reconciles
3. **Record ≠ act** — `rollback.recorded` ≠ rollback executed
4. **Replay ≠ edit** — manual projection edits are invalid until re-replayed or reverted

---

## Related

- `GOVERNANCE.md` — role model
- `BOUNDARIES.md` — platform ownership diagram
- `NON_GOALS.md` — forbidden capabilities
