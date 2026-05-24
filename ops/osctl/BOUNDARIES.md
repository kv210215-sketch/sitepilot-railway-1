# OSCTL Boundaries (Frozen — Phase 1.5)

> Who owns what in the SitePilot operational model. OSCTL sits between **execution** (CI/Railway) and **understanding** (humans/agents).

## Boundary Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Humans     │     │  CI (GHA)    │     │   Railway    │
│   Owner      │     │  Executor    │     │   Runtime    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │ ingest/approve      │ deploy/observe      │ runs app
       ▼                     ▼                     │
┌─────────────────────────────────────────────────────────┐
│  OSCTL — ledger + projections + locks (state truth)      │
└──────────────────────────┬──────────────────────────────┘
                           │ read
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Cursor     │   │   Claude     │   │  Operators   │
│   (agent)    │   │   (agent)    │   │  (read/act)  │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## What OSCTL Owns

| Asset | Ownership |
|-------|-----------|
| Append-only ledger (`ops/osctl/ledger/*.jsonl`) | OSCTL |
| Event schemas and spec version | OSCTL |
| Projection algorithms (fold + render) | OSCTL |
| Lock semantics (`lock.acquired` / `lock.released`) | OSCTL |
| Determinism verification (`osctl verify`) | OSCTL |
| Generated `CURRENT_STATUS` / `DEPLOYMENT_STATE` projections | OSCTL (derived) |

OSCTL **owns truth about recorded operational history**, not live infra state.

---

## What Humans Own

| Responsibility | Authority |
|----------------|-----------|
| Production go/no-go | Human owner |
| Rollback execution (Railway dashboard, VPS script) | Human owner |
| Rollback **marking** (`rollback.marked`) | Human owner |
| Secret creation and rotation | Human owner |
| Railway variable changes | Human owner |
| Ledger append approval for ambiguous facts | Human owner |
| Architecture freeze sign-off | Human owner |
| `MASTER_CONTEXT.md` content | Human maintainer |

Humans may delegate **drafting** to agents; humans **approve** ledger ingests that assert prod state.

---

## What CI Owns

| Responsibility | Authority |
|----------------|-----------|
| Deploy execution on push to `main` | CI (GitHub Actions) |
| `railway up --service sitepilot-railway` | CI |
| Post-deploy health curl (optional) | CI |
| Build/test/lint gates on PR | CI |

CI **does not own** (Phase 1–2):

- Ledger truth definition
- Rollback authority
- Secret values
- Projection content without ledger replay

CI **may append** observation events in Phase 2+ per `CI_INTEGRATION_PLAN.md`.

---

## What Cursor Owns

| In scope | Out of scope |
|----------|--------------|
| Code edits in `backend/`, `frontend/` when asked | Deploy, Railway CLI, Docker up |
| Draft OSCTL events / projection fixes | Append to ledger without human approval |
| Read projections + context MD for tasks | Override human rollback decisions |
| Propose `note.human` ingest payloads | Write secrets or `.env` files |

**Actor ID (future):** `agent:cursor:<session>`

Cursor follows `AGENT_RULES.md`; OSCTL boundaries add: **no autonomous prod state assertions**.

---

## What Claude Owns

Same boundary as Cursor — external agent, not a system role with elevated authority.

| In scope | Out of scope |
|----------|--------------|
| Review, planning, governance docs | Direct ledger write access |
| Draft event JSON for human ingest | Production gate approval |
| Analyze ledger/projections when provided | Deploy orchestration |

**Actor ID (future):** `agent:claude:<session>`

Agents are **read-mostly**; write path always passes human or CI actor with policy.

---

## Rollback Authority

| Action | Authority |
|--------|-----------|
| Mark rollback point in ledger | **Human owner** only |
| Execute Railway/VPS rollback | **Human owner** (or delegated ops) |
| Release rollback lock | **Human owner** after verification |
| Append `deploy.observed` during rollback lock | **Forbidden** until lock released |
| DB `migration:revert` | **Human owner**; separate from OSCTL |

OSCTL records rollback; it does not perform it.

---

## Production Gate Authority

| Gate | Who decides |
|------|-------------|
| First prod deploy | Human owner |
| Schema migration on prod | Human owner (+ manual `migration:run`) |
| CORS / env lockdown | Human owner |
| Enable CI OSCTL verify gate | Human owner (Phase 3+) |
| Treat ledger as deploy blocker | Human owner (Phase 4 policy) |

**Health 200 alone is not a production gate.** Gates require human-defined checklist + ledger events as evidence.

---

## Cross-Boundary Rules

1. **Execution ≠ truth** — CI deploy success does not auto-update human MD without ledger ingest + project.
2. **Secrets never cross into OSCTL** — see `NON_GOALS.md`.
3. **Single writer** — see ADR-007; humans resolve conflicts between CI and local ingests.
4. **Agents propose, humans dispose** — Cursor/Claude never hold production gate authority.

**Related:** `ARCHITECTURE_DECISIONS.md`, `NON_GOALS.md`, `STATE_MACHINE.md`
