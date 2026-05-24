# OSCTL Non-Goals

**Freeze ID:** `osctl-freeze/1.5`  
**Status:** Frozen — explicit exclusions

> If a capability appears below, it is **out of scope** unless this document is amended via freeze version bump.

---

## OSCTL Is NOT

| Category | Statement |
|----------|-----------|
| Deployment orchestrator | Does not trigger deploys |
| Infra automation | Does not provision or mutate platforms |
| AI operations layer | Agents cannot hold prod authority |
| Autonomous recovery system | No auto-rollback, auto-reconcile, or self-heal |
| Runtime controller | Does not restart services or change live config |
| Secret store | Does not read, write, or rotate secrets |
| Health probe service | Does not HTTP-check endpoints |
| Truth oracle for live infra | Records assertions — does not observe Railway |

---

## 1. Deploy Orchestration

OSCTL must **not**:

- Run `railway up`, `railway redeploy`, or Railway API calls
- Trigger GitHub Actions workflows
- Select deployment targets or promote artifacts
- Replace `.github/workflows/deploy-railway.yml`
- Block or allow deploys autonomously

**Allowed:** Record `deploy.recorded` after external deploy completes (human or CI ingest).

---

## 2. Infrastructure Provisioning

OSCTL must **not**:

- Create Railway projects, services, or Postgres plugins
- Provision VPS, DNS, TLS, or Cloudflare records
- Scale replicas or change Railway plan/tier
- Manage Terraform/Pulumi state

**Allowed:** Record `env_posture` key **names** from existing infra.

---

## 3. Secret Management

OSCTL must **not**:

- Store, read, rotate, or transmit secret values
- Integrate with Vault, Railway variables API, or GitHub Secrets
- Write `.env`, `.env.production`, or credential files
- Log JWT, DB passwords, Stripe keys, or API tokens

**Allowed:** `env_posture.keys_present` / `keys_missing` — names only.

---

## 4. Runtime Config Mutation

OSCTL must **not**:

- Change Railway environment variables
- Modify `railway.toml`, Docker compose, or nginx config
- Hot-reload application config or restart services
- Apply feature flags to running containers

**Allowed:** Document intended config via ledger; humans or CI apply externally.

---

## 5. AI / Autonomous Operations

OSCTL must **not**:

- Grant agents deploy authority based on ledger state
- Auto-promote to production on projection refresh
- Auto-mark rollback or reconcile
- Execute "fix prod" loops without human gate
- Append prod assertions as `agent:*` without human approval

**Allowed:** Agents draft event JSON for human review.

---

## 6. Autonomous Recovery

OSCTL must **not**:

- Auto-rollback on verify failure
- Auto-reconcile after external rollback
- Auto-close incidents
- Auto-repair ledger or projection drift
- Auto-re-seq ledger on conflict

**Allowed:** Detect drift via `verify`; human resolves.

---

## 7. Platform Replacement

OSCTL does **not** replace:

| Platform | Role unchanged |
|----------|----------------|
| GitHub | Source control, Actions, PR checks |
| Railway | Build, deploy, hosting, Postgres |
| Cloudflare | DNS, CDN, WAF (present or future) |

OSCTL is an **operational state layer** adjacent to these platforms.

---

## 8. Docker Orchestration

OSCTL must **not**:

- Run `docker compose up`, `docker build`, or container lifecycle
- Replace `deploy/scripts/deploy.sh` or VPS rollback scripts

**Allowed:** Record manual Docker observations in ledger events.

---

## Adjacent Non-Goals (Phase 1.5)

- Application runtime (NestJS behavior)
- TypeORM migration **execution**
- Billing, auth, product logic
- Real-time Railway webhook consumer
- Multi-tenant ledger federation
- Encrypted ledger at rest
- Hash chain tamper evidence (deferred)
- Actor authorization enforcement in core

---

## Violation Handling

If implementation or agent behavior matches any forbidden capability:

1. Stop — do not merge
2. File issue against OSCTL scope
3. Amend only via freeze version bump

---

## Related

- `HUMAN_BOUNDARIES.md` — MUST NEVER zone
- `ARCHITECTURE_FREEZE.md` — freeze declaration
- `BOUNDARIES.md` — ownership diagram
