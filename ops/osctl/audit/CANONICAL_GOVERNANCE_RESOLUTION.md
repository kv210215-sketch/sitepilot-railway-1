# Canonical Governance Resolution

**Date:** 2026-05-24  
**Agent:** OSCTL Canonical Governance Resolution Agent  
**Mode:** STRICT — read-only analysis; single deliverable file  
**Repository:** `D:\Projects\SitePilot\sitepilot-railway`  
**Branch observed:** `fix/app-module-template-compile`  
**Authority of this document:** Observation and recommendation only — **non-authoritative**. Does not amend freeze, move files, or bind the human operator. Final policy remains human-owned.

**Evidence basis:** `CANONICAL_GOVERNANCE_MAP.md`, `SOURCE_OF_TRUTH_MAP.md`, `WORKSPACE_BLOCKER_CLASSIFICATION.md`, `ARCHITECTURE_FREEZE.md`, `FREEZE_v1.md`, `LEDGER_MODEL.md`, `PROJECTION_RULES.md`, `core/ledger/paths.py`, `core/cli/main.py`, `core/projection/render.py`, `core/verify/engine.py`, byte/hash comparison of ledger and projection paths, root context files, `ops/README.md`.

---

## 1. Executive Governance Verdict

**GOVERNANCE TOPOLOGY: FRAGMENTED — RESOLVABLE WITHOUT KERNEL SEMANTIC CHANGE**

The OSCTL trust kernel (append-only ledger, pure replay, verify layers) is **sound and validated**. Governance topology is **not** sound: two physical ledger paths, two projection surfaces, three competing “status” documents (root legacy, `ops/state/projections/`, `ops/osctl/projections/`), and freeze documents that disagree with runtime defaults.

| Dimension | Verdict |
|-----------|---------|
| Single ledger authority | **NO** — split-brain (`ops/state/ledger/` declared vs `ops/osctl/ledger/` implemented) |
| Single projection authority | **NO** — `.generated.md` under `ops/osctl/` vs undecorated names under `ops/state/`; `CURRENT_STATUS` already hash-divergent |
| Canonical governance root | **YES (named)** — 15-file set in `ops/osctl/` per `CANONICAL_GOVERNANCE_MAP.md` §2 |
| Root context authority | **NO** — four untracked root MDs compete with ledger-derived truth |
| Generated vs source-of-truth separation | **PARTIAL** — principle stated everywhere; practice violated by duplicates and manual copies |
| LR-1 execution | **BLOCKED** — workspace mixed; path decisions unset |
| Human authority model | **CLEAR** — production gates remain human; agents advisory only |

**Resolution stance (analysis, not binding):** Adopt **one operational plane** under `ops/state/` for live ledger + generated projections; retain `ops/osctl/` as **frozen spec + deterministic kernel + validation fixtures**. Demote all duplicates, mirrors, and root legacy status files to **non-authoritative** roles. Reconcile code defaults via **LR-2 (Option L)** after workspace isolation — not before.

**Principle compliance:**

| Principle | Status |
|-----------|--------|
| VERIFY before ACT | Kernel verify contract exists; topology must be fixed before anchoring commits |
| CLASSIFY before STAGE | Complete (`WORKSPACE_BLOCKER_CLASSIFICATION.md` + this document) |
| SINGLE SOURCE OF TRUTH | **Violated** — must be restored by human path decision + LR-2 |
| DETERMINISTIC REPLAY | **Satisfied** by core; undermined if operators append to wrong ledger path |
| FROZEN GOVERNANCE KERNEL | **Satisfied** for semantics; **contradicted** on paths between `ARCHITECTURE_FREEZE` and `FREEZE_v1` |
| HUMAN AUTHORITY FINAL | **Satisfied** — all binding choices below require explicit human sign-off |

---

## 2. Canonical Authority Map

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  CANONICAL GOVERNANCE (rules only) — ops/osctl/ 15-file kernel + README │
│  ARCHITECTURE_FREEZE · FREEZE_v1 · EVENT_SCHEMA · STATE_MACHINE · …     │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ defines contracts
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  DETERMINISTIC KERNEL (implementation) — ops/osctl/core/**              │
│  append · replay · verify · fold · render · serialize                   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ reads/writes (today: wrong default paths)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  OPERATIONAL STATE (live truth plane) — RECOMMENDED: ops/state/         │
│  ledger/events.jsonl          ← single append-only canonical ledger      │
│  projections/CURRENT_STATUS.md, DEPLOYMENT_STATE.md  ← generated only   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ human reads; agents read after verify
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ADJACENT OPS (non-kernel) — ops/rituals · ops/simulations · templates  │
│  ops/state/*.template.md · checklists · STATE_TRANSITIONS.md            │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ separate from recorded truth
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ROOT CONTEXT (backend + agent discipline) — NOT ledger truth             │
│  MASTER_CONTEXT.md · AGENT_RULES.md · legacy status MDs (bannered)      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Layer table

| Layer | Path(s) | Authority class | Role |
|-------|---------|-----------------|------|
| Governance kernel | `ops/osctl/{ARCHITECTURE_FREEZE,FREEZE_v1,…}.md` (15 + `NON_GOALS.md`) | **Canonical (rules)** | Sole declarative policy for OSCTL |
| Navigation | `ops/osctl/README.md` | **Canonical (index only)** | Entrypoint; asserts no rules |
| Implementation | `ops/osctl/core/**` | **Canonical (behavior)** | Code conforms to spec after LR-2 path alignment |
| Live operational state | `ops/state/ledger/`, `ops/state/projections/` | **Operational (recommended canonical data plane)** | Append target + verify target for production-class ledger |
| Kernel runtime defaults (today) | `ops/osctl/ledger/`, `ops/osctl/projections/*.generated.md` | **Generated / fixture (today)** | CLI defaults; validated fingerprint; **must not remain parallel authority** |
| Validation evidence | `ops/osctl/validation/**` | **Generated evidence** | Reproducible proof; not policy |
| Rehearsal fixtures | `ops/osctl/examples/**`, `validation/scenarios/**` | **Fixture** | Deterministic scenarios; not production ledger |
| Snapshot layer | `ops/osctl/snapshots/**` | **Scoped supplement** | Acceleration artifacts; never orchestration authority |
| Audit | `ops/osctl/audit/**` | **Observation** | Dated analysis including this file |
| Human templates | `ops/state/*.template.md`, checklists | **Human-controlled** | Phase 1 patterns; not truth after ledger adoption |
| Adjacent governance | `ops/state/GOVERNANCE.md` | **Operational (human)** | Must not merge silently with `ops/osctl/GOVERNANCE.md` |
| Root legacy status | `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` | **Legacy / non-authoritative (recommended)** | Pre-OSCTL manual summaries |
| Backend context | `MASTER_CONTEXT.md` | **Operational documentation (recommended)** | Backend architecture; not OSCTL kernel |
| Agent discipline | `AGENT_RULES.md` | **Human-controlled (agent policy)** | Cursor/agent rules; cross-ref `HUMAN_BOUNDARIES.md` |
| Runtime infra | `docker-compose.yml` | **Runtime — out of OSCTL scope** | Must never enter OSCTL commits |

### 2.2 Internal freeze contradiction (must be human-resolved)

| Source | Ledger path | Projection path |
|--------|-------------|-----------------|
| `ARCHITECTURE_FREEZE.md` F-001/F-002, `LEDGER_MODEL.md`, `PROJECTION_RULES.md` | `ops/state/ledger/events.jsonl` | `ops/state/projections/{CURRENT_STATUS,DEPLOYMENT_STATE}.md` |
| `FREEZE_v1.md` §Snapshot, validation fingerprint | `ops/osctl/ledger/events.jsonl` | `ops/osctl/projections/*.generated.md` |
| `core/ledger/paths.py`, `render.py`, `verify` | `ops/osctl/ledger/` | `ops/osctl/projections/*.generated.md` |
| `BOUNDARIES.md`, `ARCHITECTURE_DECISIONS.md` ADR-001 | `ops/osctl/ledger/` | (generated under OSCTL) |

**Observation:** Ledgers are **byte-identical today** (SHA-256 match). `DEPLOYMENT_STATE` projections match across paths. `CURRENT_STATUS` **hash-mismatches** between `ops/osctl/projections/CURRENT_STATUS.generated.md` and `ops/state/projections/CURRENT_STATUS.md` — early projection drift despite identical ledgers.

---

## 3. Ledger Authority Decision Recommendation (H1)

### Question

Should canonical ledger authority live in `ops/osctl/ledger/` **or** `ops/state/ledger/`?

### Analysis

| Criterion | `ops/state/ledger/` | `ops/osctl/ledger/` |
|-----------|---------------------|---------------------|
| Binding freeze declaration (`ARCHITECTURE_FREEZE` F-001) | **Yes** | No |
| `LEDGER_MODEL.md`, `GOVERNANCE.md`, `osctl/README.md` | **Yes** | No |
| Validated runtime snapshot (`FREEZE_v1`) | No | **Yes** |
| `paths.py` CLI default | No | **Yes** |
| Semantic fit (“operational state” vs “tooling”) | **Operational plane** | Kernel/fixture adjacency |
| Risk if both kept | Divergence on next append | Divergence on next append |

Dual-path is **unacceptable** per `SOURCE_OF_TRUTH_MAP.md` §3 and `INVARIANT_REGISTRY.md` P-001 (**CONFLICT**).

### Recommendation (requires human confirmation)

**Canonical ledger authority: `ops/state/ledger/events.jsonl`**

| Action class | Detail |
|--------------|--------|
| **Retain** | Single git-tracked production-class ledger at `ops/state/ledger/events.jsonl` |
| **Demote** | `ops/osctl/ledger/events.jsonl` → validation fixture only (e.g. `ops/osctl/examples/freeze_v1_fixture/events.jsonl` or explicit `--ledger` in validation) after LR-2 |
| **Implement** | LR-2: update `core/ledger/paths.py` defaults to `ops/state/ledger/` (Option L per Round 3 §10) |
| **Do not** | Stage both paths as co-canonical in one anchor commit |

**Rationale:** Document hierarchy places `ARCHITECTURE_FREEZE.md` above runtime snapshot text; operational truth belongs in `ops/state/`, not inside the kernel package tree. Validation history in `FREEZE_v1` is evidence of a **point-in-time run**, not a competing path declaration.

**Alternative (Option O):** Human may instead elevate `ops/osctl/ledger/` and amend F-001/F-002 + bump freeze to `1.5.1`. Higher governance cost; not recommended in prior audits.

---

## 4. Projection Authority Recommendation (H2)

### Question

Should projections be generated-only, manually editable, dual-mode, or frozen snapshots?

### Analysis

| Mode | Consistency with kernel | Current repo state |
|------|-------------------------|-------------------|
| **Generated-only** | **Required** by I-003, `PROJECTION_RULES.md`, `GOVERNANCE.md` | Violated: manual copy at `ops/state/projections/`; legacy root MDs |
| Manually editable | Forbidden as truth | Root `CURRENT_STATUS.md` / `DEPLOYMENT_STATE.md` are manual |
| Dual-mode | **Forbidden** — guarantees drift | Two projection dirs + root legacy |
| Frozen snapshots | Allowed for **snapshots/** only | Not a substitute for live projections |

CLI writes `CURRENT_STATUS.generated.md` / `DEPLOYMENT_STATE.generated.md`; freeze docs name undecorated files under `ops/state/projections/`.

### Recommendation (requires human confirmation)

**Projection model: generated-only, single output directory**

| Rule | Specification |
|------|----------------|
| **Authority** | Projections are **derived only** from ledger replay |
| **Canonical output dir** | `ops/state/projections/` (paired with recommended ledger path) |
| **Filenames** | `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` (align `render.py` + verify with `PROJECTION_RULES.md` in LR-2) |
| **Suffix** | Drop `.generated.md` for operational plane OR treat suffix as **mandatory** everywhere — **pick one**; mixing suffixes is a classification bug |
| **Manual edit** | Forbidden for deploy facts; corrections via ledger append + `replay` + `verify` |
| **Verify gate** | `verify` exit 0 required before trusting on-disk projections |
| **Snapshots** | `ops/osctl/snapshots/examples/*.json` remain **disposable acceleration** — never production projection authority |

**Not recommended:** dual-mode (human mirror + generated), or maintaining `ops/osctl/projections/` as a second live surface after path reconciliation.

**Drift note:** Re-run `replay` + `verify` after LR-2; do not hand-merge `ops/state/projections/CURRENT_STATUS.md` with `.generated.md` content.

---

## 5. Root Context Authority Recommendation (H3, H4)

### H3 — Should `CURRENT_STATUS.md` and `DEPLOYMENT_STATE.md` exist at root, under `ops/state/`, both, or generated only?

### Recommendation (requires human confirmation)

| Location | Role |
|----------|------|
| **`ops/state/projections/CURRENT_STATUS.md`** | **Yes** — sole **operational** projection (generated-only) |
| **`ops/state/projections/DEPLOYMENT_STATE.md`** | **Yes** — sole **operational** deployment journal projection (generated-only) |
| **Repository root copies** | **No as authority** — retain only with **LEGACY / NON-AUTHORITATIVE** banner + pointer to `ops/state/projections/`; or archive |
| **Generated-only everywhere** | **Yes** as truth model — no third manual “status” surface |

**Do not** treat root + `ops/state/projections/` + `ops/osctl/projections/` as co-equal. Agents instructed via `AGENT_RULES.md` to “read first” root files must be updated (LR-1 scope) to read **verified** projections or accept non-authoritative legacy banners.

### H4 — Should `MASTER_CONTEXT.md` remain canonical governance anchor, operational doc, archive, or split?

### Recommendation (requires human confirmation)

| Disposition | Detail |
|-------------|--------|
| **Not** OSCTL canonical governance anchor | OSCTL anchor = `ops/osctl/` 15-file kernel + `README.md` |
| **Yes** operational backend documentation at root | Trim backend-focused content; remove trust-kernel restatements (`CANONICAL_GOVERNANCE_MAP.md` §7) |
| **Split (soft)** | Backend sections stay in `MASTER_CONTEXT.md`; OSCTL operational rules live only under `ops/osctl/` |
| **Do not archive** entirely — still valuable for module map, Railway model, env contract |
| **Cross-reference** | OSCTL trust claims → `ops/osctl/TRUST_MODEL.md` only |

`AGENT_RULES.md`: keep as **agent policy** at root; add explicit **verify-before-act** for operational status reads; cross-ref `ops/osctl/HUMAN_BOUNDARIES.md`.

---

## 6. Generated Artifact Policy

| Artifact class | Location | Policy |
|----------------|----------|--------|
| **Ledger (canonical)** | `ops/state/ledger/events.jsonl` (recommended) | Append-only; human-approved prod ingests; never hand-edited |
| **Projections (canonical)** | `ops/state/projections/*.md` (recommended) | Regenerate via `replay`; never assert new deploy facts by edit |
| **Kernel fixture ledger** | `ops/osctl/ledger/` (until LR-2) | Treat as **validation default** only; demote after path fix |
| **Kernel projection output** | `ops/osctl/projections/*.generated.md` | Regenerable; exclude from blind `git add ops/` |
| **Example projections** | `ops/osctl/examples/**/projections/*.generated.md` | **Never stage** as truth; rehearsal only |
| **Validation reports** | `ops/osctl/validation/*.md` | Regenerate via `run_validation.py`; evidence not policy |
| **`__pycache__`** | under `ops/` | **Never stage** |
| **Duplicate ledger** | second copy at `ops/osctl/ledger/` after reconciliation | **Delete or relocate** to fixture — never two append targets |
| **Root legacy status** | `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` | Banner as non-authoritative or archive; not regenerated truth |
| **Templates** | `ops/state/*.template.md` | Human-controlled copies; not projections |
| **Snapshots** | `ops/osctl/snapshots/examples/*.json` | Optional acceleration; verify/compare scripts read-only |

**Fingerprint policy:** Record verify fingerprints in `validation/HASH_REGISTRY.md` only after path decision and LR-2; treat prior `FREEZE_v1` fingerprint as tied to `ops/osctl/` fixture run, not as dual authority.

---

## 7. Archive Policy

Per `ARCHIVE_RECOMMENDATIONS.md` (observation, not execution):

| Rule | Detail |
|------|--------|
| **Archive ≠ delete** | Move to `ops/osctl/archive/{drafts,hygiene,consolidation}/` |
| **Archive ≠ authority** | Archived files are not in trust chain |
| **When** | After corresponding LR actions applied (LR-5..LR-8), not before initial anchor |
| **Draft specs** | `SPEC_REFERENCE.md`, `ARCHITECTURE_FREEZE_CHECKLIST.md`, `IMPLEMENTATION_NOTES.md` → `archive/drafts/` with SUPERSEDED banner |
| **Hygiene one-shots** | Post-anchoring → `archive/hygiene/` |
| **Consolidation plans** | Post-LR-1..LR-4 application → `archive/consolidation/` |
| **Verdict files** | `FINAL_*_VERDICT.md` — frozen in place per `FREEZE_CANDIDATES.md`, not archived prematurely |
| **Root legacy MDs** | Optional **logical** archive (banner) without move — or move to `docs/archive/` only if human creates that tree |
| **Never archive** | `ops/state/ledger/events.jsonl`, canonical projections, `ops/osctl/core/**` |

**Boundary:** Archive policy applies to **governance surface reduction**, not to operational ledger bytes.

---

## 8. Human Authority Boundaries

| Domain | Human owner | Agent / CI | OSCTL core |
|--------|-------------|------------|------------|
| Production GO/NO-GO | **Decides** | Observes | Records if ingested |
| Rollback execution | **Executes** | Must not | Records metadata only |
| Ledger append (prod assertions) | **Approves** | Draft JSON (Phase 2+) | Validates + appends |
| Path reconciliation (H1/H2) | **Decides** Option L vs O | Must not | N/A |
| Git anchor / staging `ops/**` | **Decides** granularity | Must not | N/A |
| `docker-compose.yml` disposition | **Decides** restore/stash/branch | Must not | **Excluded** |
| Freeze / invariant amendments | **Sign-off** | Must not | N/A |
| LR-1 entry | **Explicit approval** after clean workspace | Blocked until granted | N/A |
| Trust claims in docs | **Owns** canonical 15-file edits | Read-only | N/A |
| Generated projection bytes | **Operator runs** `replay` + `verify` | May draft events only | **Derives** |

**This agent:** classification and recommendation only — **no** binding policy selection.

---

## 9. LR-1 Blocking Status

**LR-1: BLOCKED**

LR-1 is defined as: apply Round 3 §6 actions 1–8 as a single docs-only governance entrypoint commit (`GOVERNANCE_OPERATIONALIZATION_VERDICT.md`).

| Gate | Status |
|------|--------|
| Backend compile clean | ✓ |
| Backend feature trees stashed | ✓ |
| `docker-compose.yml` isolated from OSCTL workspace | ✗ Modified (runtime track) |
| `ops/**` anchored with human staging plan | ✗ Entire tree untracked (~197 files) |
| H1/H2 path decision made | ✗ Pending human confirmation |
| Root context disposition (banners / pointers) | ✗ Pending |
| Workspace OSCTL-only | ✗ Mixed |
| Explicit human approval to begin LR-1 | ✗ Not granted |
| Validation re-run on commit candidate | ✗ Not this session |

**Dependency:** LR-1 is **downstream** of workspace isolation and **precedes** LR-2 in recommended order, but **H1/H2 should be decided before LR-2** so docs-only LR-1 banners point at the correct canonical paths.

---

## 10. Safe Next Human Step

**Exactly one step (unchanged from classification, still highest leverage):**

> Isolate `docker-compose.yml` from the working tree — `git restore docker-compose.yml` **or** `git stash push -m "local-dev compose rewrite" -- docker-compose.yml` — then `git status --short` and confirm only untracked `ops/**` and root context files remain as blockers.

**Immediately after (human decision, not automatic):**

1. **Confirm H1/H2** using §3–§4 of this document (recommend Option L: `ops/state/` operational plane).
2. **Choose root context disposition** (banners vs defer staging) per §5.
3. **Stage `ops/**` with path-level review** per `HUMAN_COMMIT_SEQUENCE.md` — never `git add ops/` blindly.
4. **Re-run** `python ops/osctl/validation/run_validation.py` and `python -m ops.osctl.core verify` with chosen paths after LR-2.
5. **Only then** consider LR-1 on an OSCTL-only branch with explicit approval.

---

## 11. Explicit Forbidden Actions

| Forbidden | Reason |
|-----------|--------|
| `git add .` or blind `git add ops/` | Mixes runtime, duplicates, artifacts |
| Dual ledger append targets | Guaranteed divergence |
| Manual projection edits for deploy truth | Drift; violates I-003 |
| Staging root `CURRENT_STATUS.md` / `DEPLOYMENT_STATE.md` as truth without banner | Dual source-of-truth |
| LR-1 in mixed workspace | Trust boundary violation |
| Including `docker-compose.yml` in OSCTL commit | Runtime artifact |
| Commits / push / merge / stash / discard **by agents** without explicit human request | Strict mode |
| Deploy, Railway, Cloudflare, CI mutation | Out of scope |
| Backend / `package.json` / `docker-compose` edits by governance agents | Out of scope |
| Rewriting canonical 15-file kernel semantics in audit docs | Audit is non-authoritative |
| Choosing Option L vs O **as binding** without human sign-off | HUMAN AUTHORITY FINAL |
| New governance audit rounds without charter | `CANONICAL_GOVERNANCE_MAP.md` §10 stop-rule |

---

## Appendix A — Specific Question Index (H1–H5)

| ID | Question | Recommendation summary |
|----|----------|------------------------|
| **H1** | Ledger: `ops/osctl/ledger/` vs `ops/state/ledger/`? | **`ops/state/ledger/events.jsonl`** canonical; demote `ops/osctl/ledger/` to fixture after LR-2 |
| **H2** | Projection mode? | **Generated-only**; single dir `ops/state/projections/`; align filenames in LR-2 |
| **H3** | Where do status MDs live? | **Operational projections under `ops/state/projections/` only**; root copies legacy/bannered, not authority |
| **H4** | `MASTER_CONTEXT.md`? | **Operational backend doc** (trimmed); **not** OSCTL governance anchor; OSCTL anchor = `ops/osctl/` kernel |
| **H5** | Path classification | See §12 |

---

## Appendix B — Path Classification (H5)

| Path | Class |
|------|-------|
| `ops/osctl/ARCHITECTURE_FREEZE.md` … `TRUST_MODEL.md` (15) | **Canonical** |
| `ops/osctl/NON_GOALS.md` | **Canonical** (negative scope) |
| `ops/osctl/README.md` | **Canonical** (navigation only) |
| `ops/osctl/core/**` | **Canonical** (implementation) |
| `ops/state/ledger/events.jsonl` | **Operational** (recommended **canonical data**) |
| `ops/state/projections/*.md` | **Generated** (recommended **canonical operational output**) |
| `ops/osctl/ledger/events.jsonl` | **Generated/fixture** (demote after LR-2) |
| `ops/osctl/projections/*.generated.md` | **Generated** (demote as live surface after LR-2) |
| `ops/osctl/validation/**` | **Generated evidence** |
| `ops/osctl/examples/**` (excl. example projections) | **Operational fixtures** |
| `ops/osctl/examples/**/projections/*.generated.md` | **Generated** — **never-stage** |
| `ops/osctl/snapshots/**` | **Scoped supplement** |
| `ops/osctl/audit/**` | **Archive-only** (observations; keep until archive policy applied) |
| `ops/osctl/archive/**` (if created) | **Archive-only** |
| `ops/rituals/**`, `ops/simulations/**` | **Operational** (human playbooks) |
| `ops/state/*.template.md`, checklists | **Human-controlled** |
| `ops/state/GOVERNANCE.md` | **Operational** (human-adjacent; not kernel) |
| `ops/README.md` | **Operational** (stale — update on anchor) |
| `MASTER_CONTEXT.md` | **Operational** (backend) |
| `AGENT_RULES.md` | **Human-controlled** (agent policy) |
| `CURRENT_STATUS.md`, `DEPLOYMENT_STATE.md` (root) | **Legacy** → banner or **archive** |
| `docker-compose.yml` | **Runtime** — isolate; **never-stage** with OSCTL |
| `.claude/settings*.json` | **Never-stage** (local IDE) |
| `backend/**` (stashed trees) | **Out of scope** for OSCTL anchor |

---

## Appendix C — Compliance

| Constraint | Complied |
|------------|----------|
| Read-only governance resolution | ✓ (inspection only) |
| Single output file created | ✓ |
| No deploy / Railway / Cloudflare / CI / backend / compose edits | ✓ |
| No commits / git mutations | ✓ |
| Recommendations labeled; human confirmation required | ✓ |

---

**Resolution analysis complete.** Human operator owns path confirmation (H1/H2), root context banners (H3/H4), workspace isolation (§10), and LR-1 approval (§9).
