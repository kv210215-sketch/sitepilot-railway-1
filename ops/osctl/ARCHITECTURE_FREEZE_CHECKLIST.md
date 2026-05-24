# OSCTL Architecture Freeze Checklist (Phase 1.5)

> **SUPERSEDED — pre-freeze checklist (`osctl-freeze/0.0`)**
>
> **Canonical frozen invariants:** [`FREEZE_v1.md`](./FREEZE_v1.md) §6 · [`ARCHITECTURE_FREEZE.md`](./ARCHITECTURE_FREEZE.md)
>
> Retained for historical reference only. Do not use for implementation gates.

Complete this checklist before Phase 2 implementation. All items are planning decisions — no code required to check them off.

## Purpose

Freeze the OSCTL architecture so implementation is deterministic and does not rework fundamentals mid-build.

---

## A. Scope & Boundaries

- [ ] **A1.** Confirmed: OSCTL is operational state management, not a deploy tool.
- [ ] **A2.** Confirmed: GitHub Actions + Railway remain the deploy execution path.
- [ ] **A3.** Confirmed: OSCTL does not read or write `backend/src/**` in Phase 2 initial slice.
- [ ] **A4.** Confirmed: Secrets never enter ledger payloads (names/presence only).

## B. Ledger

- [ ] **B1.** Storage location decided: `ops/osctl/ledger/` (git-tracked) | CI artifact | hybrid
- [ ] **B2.** One ledger per: `environment` field in events | separate files per env
- [ ] **B3.** Seq allocation: single writer assumption documented (CI + local conflict policy)
- [ ] **B4.** Hash chain: required v0.1 | deferred
- [ ] **B5.** Event type enum frozen (see `SPEC_REFERENCE.md` § Event Types)
- [ ] **B6.** Correction policy: only via new events (`*.supersedes` or `note.human`), never edit lines

## C. Projections

- [ ] **C1.** CURRENT_STATUS output path: overwrite root `CURRENT_STATUS.md` | `ops/osctl/projections/` only
- [ ] **C2.** DEPLOYMENT_STATE output path: overwrite root `DEPLOYMENT_STATE.md` | projections subdir
- [ ] **C3.** Section order matches existing root MD files (agent compatibility)
- [ ] **C4.** Every section cites contributing `as_of_seq` (or explicit "static from MASTER_CONTEXT")
- [ ] **C5.** `MASTER_CONTEXT.md` remains human-maintained; not generated from ledger in v0.1
- [ ] **C6.** Projection regeneration trigger: manual CLI | CI post-deploy | both

## D. Locks

- [ ] **D1.** Lock representation: events-only | state file | both
- [ ] **D2.** Lock names frozen: `migration`, `deploy-observe`, `projection-rebuild`, `rollback`
- [ ] **D3.** TTL defaults documented and accepted
- [ ] **D4.** Stale lock recovery behavior agreed (auto-expire + audit event)
- [ ] **D5.** CI lock acquire/release pattern documented in `IMPLEMENTATION_NOTES.md`

## E. Rollback Safety

- [ ] **E1.** `rollback.marked` semantics aligned with Railway manual redeploy (no auto DB revert)
- [ ] **E2.** Rollback lock blocks conflicting `deploy.observed` — policy accepted
- [ ] **E3.** Known-good pointer uses ledger `seq` as primary key; external IDs in `refs` only
- [ ] **E4.** Forward-fix workflow documented (release rollback lock + new events)

## F. Determinism

- [ ] **F1.** Pure fold functions: no network, no clock in projection body (except event `ts`)
- [ ] **F2.** Spec version pinned in every projection footer
- [ ] **F3.** Golden fixture strategy accepted (`IMPLEMENTATION_NOTES.md` § Testing)
- [ ] **F4.** `osctl verify` defined: schema + replay + optional MD diff

## G. CI Compatibility

- [ ] **G1.** Ingest interface: JSON file | stdin | env-var payload — pick one for v0.1
- [ ] **G2.** Exit code contract frozen (0/1/2/3)
- [ ] **G3.** Actor string format: `ci:<workflow>:<job>` | simpler — decided
- [ ] **G4.** First CI hook point identified: post-health-check in `deploy-railway.yml`
- [ ] **G5.** Phase 2.1 = observe-only; no deploy gates until projections stable

## H. SitePilot Context Alignment

- [ ] **H1.** Railway facts match `DEPLOYMENT_STATE.md`: project `triumphant-purpose`, service `sitepilot-railway`
- [ ] **H2.** Health probe facts match `GET /health` contract (starting vs ok)
- [ ] **H3.** Migration manual flow reflected in `migration.observed` event shape
- [ ] **H4.** Known risks from root `CURRENT_STATUS.md` mappable to event types or `note.human`
- [ ] **H5.** `AGENT_RULES.md` updated (Phase 2) to reference OSCTL read path — noted as follow-up

## I. Open Questions Resolved

| ID | Question | Decision | Date |
|----|----------|----------|------|
| B1 | Ledger storage | _TBD_ | |
| C1 | Projection output path | _TBD_ | |
| D1 | Lock storage | _TBD_ | |
| B4 | Hash chain | _TBD_ | |
| G1 | CI ingest interface | _TBD_ | |

---

## Freeze Sign-Off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Owner | | | |
| Reviewer | | | |

**Freeze version:** `osctl-freeze/0.0` (planning) → bump to `osctl-freeze/1.0` when all required boxes checked.

**After sign-off:** Phase 2 may add `package.json`, CLI stub, schema files, and ledger directory — not before.
