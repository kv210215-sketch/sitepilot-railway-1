# Solomiya Energy — GO 2 Owner Inputs + GO 3 Execution Package

> **Status: PREPARATION ONLY — NOT an execution.** This document records the **GO 2 owner inputs**
> and the **ready-to-run GO 3 execution package**. It performs **no** importer run, no `--apply`, no
> DB write, no publish, no deploy, no DNS/Cloudflare/Railway/redirect change. Running GO 3 requires a
> **separate explicit owner authorization** in the exact form `go GO3 execute`.
>
> **Authoritative companions (do not duplicate):**
> [`SOLOMIYA_URL_COVERAGE_AND_REDIRECT_PLAN.md`](SOLOMIYA_URL_COVERAGE_AND_REDIRECT_PLAN.md) (§6 redirect
> map, §8 GO sequence, §9 rollback), [`IMPORT_SOLOMIYA_TILDA_PAGES.md`](IMPORT_SOLOMIYA_TILDA_PAGES.md)
> (importer flags + guardrails), [`SOLOMIYA_DOMAIN_MIGRATION.md`](SOLOMIYA_DOMAIN_MIGRATION.md) (env/CORS/cutover).
>
> **Prepared:** 2026-06-28 · read-only verification + docs-only · base `main` = `7300370`.

---

## 1. GO 2 owner inputs (recorded for preparation)

These were supplied by the owner for **GO 2 preparation**. They are recorded here as the values to be
applied **at GO 3 execution time**. They are **not yet written into draft JSON** (a draft-JSON edit is
gated and needs its own explicit go — see §4).

| GO 2 item | Value / decision | Applied where (at GO 3) |
|---|---|---|
| `/contacts` support email | `andriy555solar@gmail.com` | draft JSON `/contacts` `email` field (currently `""`) → synced via `--update-existing` |
| Sign-off `/service-warranty` | ✅ pre-confirmed | publish after import |
| Sign-off `/ses/ground` | ✅ pre-confirmed | publish after import |
| Sign-off `/contacts` | ✅ pre-confirmed (pending email fill) | publish after import |
| §6 redirect map | ✅ accepted for preparation | 301 infra PR (GO 4) — not in scope here |

> **Caveat — two draft datasets exist.** The importer reads
> `backend/scripts/data/solomiya-tilda-pages.draft.json` (the source of truth for GO 3). A separate
> `backend/scripts/data/solomiya-review-drafts.json` (PR #39) tracks `OWNER_INPUT_REQUIRED` /
> `CLAIM_REVIEW_REQUIRED` markers and is **not** what the importer ingests. Verified read-only on
> `main @ 7300370`: in the importer's file, all 3 GO 3 targets are `status:"draft"` with **0
> `OWNER_INPUT_REQUIRED` and 0 `CLAIM_REVIEW_REQUIRED`**; `/contacts` has `email:""` and `phone`
> populated. The PR #40 handoff's marker counts refer to the *other* file — no contradiction inside
> GO 3 scope.

---

## 2. Where the `/contacts` email is fixed

Per the question "docs / draft JSON / execution package":

- **Docs (now):** recorded in §1 of this file. ✅ (this PR)
- **Draft JSON (`solomiya-tilda-pages.draft.json` → `/contacts.email`):** **NOT changed here.** A
  draft-JSON edit is a gated, importer-data change requiring a separate explicit go. It is the first
  sub-step of GO 3 execution (§3, step B), because `--update-existing` syncs JSON → DB.
- **Execution package (GO 3):** captured in §3 as the exact value + the step that applies it.

Two equivalent application paths at GO 3 time (owner picks one):
- **Path A (recommended — JSON source of truth):** edit `/contacts.email` in the draft JSON → importer
  `--update-existing --apply` syncs it to the DB draft → publish. Keeps repo JSON authoritative.
- **Path B (dashboard):** publish `/contacts` first, then set the email directly via the owner
  dashboard page edit. Leaves repo JSON stale on this field.

---

## 3. GO 3 execution package (ready to run — DO NOT run without `go GO3 execute`)

Scope: publish exactly **3** pages — `/service-warranty`, `/ses/ground`, `/contacts`. No other page is
touched. The importer **never publishes** (`published_at=NULL`, plan summary always `publish:0`); a
separate explicit publish step is required after import.

### Step A — Baseline live-page snapshot (read-only, BEFORE anything)
Record the current published set so any regression is detectable.
```bash
# Expected exactly: /, /ses, /ses/dom, /ses/business, /installation
curl -s https://sitepilot-railway-production.up.railway.app/public/v1/sitemap-entries \
  | python -c "import sys,json;print('\n'.join(sorted(e['path'] for e in json.load(sys.stdin))))"
```
**Gate:** baseline MUST equal those 5 paths. If it differs, **STOP** and reconcile before proceeding.

### Step B — Fill `/contacts` email (gated draft-JSON edit — needs its own go)
Set `email` for `/contacts` in `backend/scripts/data/solomiya-tilda-pages.draft.json`:
```
"email": "andriy555solar@gmail.com"   # currently ""
```
Then re-validate JSON parses and `/contacts` stays `status:"draft"`. *(Path B users skip this and set
the email in the dashboard after publish.)*

### Step C — Importer dry-run (default; writes nothing)
```bash
cd backend
node scripts/import-solomiya-tilda-pages.mjs --only=/service-warranty,/ses/ground,/contacts
```
**Expect:** scope line "restricts run to 3 page(s)", structural validation passes,
`plan summary → create:… update:… delete:0 publish:0`. No DB writes.

### Step D — Importer apply (scoped, draft-only) — **requires `go GO3 execute`**
```bash
cd backend
node scripts/import-solomiya-tilda-pages.mjs \
  --only=/service-warranty,/ses/ground,/contacts \
  --update-existing \
  --apply \
  --confirm-apply
```
- `--only=` is a **hard scope guard applied before anything else** — refuses if a path is absent.
- `--apply` aborts unless `--confirm-apply` is also present (guard runs *before* any DB connection).
- All writes are `status='draft'`, `published_at=NULL` → **nothing is published by this step**.
- ⚠️ **NEVER** run `--update-existing --apply --confirm-apply` **without `--only=`** — that re-syncs all
  31 drafts, flips every existing page (incl. live `/ses`, `/installation`) to `draft`, and never
  republishes (`publish:0`) → mass 404.

### Step E — Explicit publish (one page at a time) — **requires `go GO3 execute`**
The importer does not publish. Publish each via the owner dashboard **"Publish"** action (calls
`PATCH /api/v1/projects/:projectId/pages/:pageId` → `status='published'`), in order:
1. publish `/service-warranty`
2. publish `/ses/ground`
3. publish `/contacts`

### Step F — After-check (read-only)
```bash
curl -s https://sitepilot-railway-production.up.railway.app/public/v1/sitemap-entries \
  | python -c "import sys,json;print('\n'.join(sorted(e['path'] for e in json.load(sys.stdin))))"
```
**Expect exactly 8 paths:** the 5 baseline + `/service-warranty`, `/ses/ground`, `/contacts`, all
`robotsIndex:true`.

### Step G — No-404 QA gate (read-only) — **must pass before GO 4**
- All **5 baseline** pages still `200` + `published` (none flipped to draft).
- All **3 new** pages `200` and indexable.
- `/contacts` renders the support email `andriy555solar@gmail.com`.
- **Zero 404 regression** on any previously-live path.
- **Gate:** if any baseline page is missing/`draft`/`404`, treat as a regression → rollback (§4).

---

## 4. Rollback / stop conditions
- **Stop before Step D/E** if: baseline ≠ 5 expected paths; dry-run shows `delete:>0` or scope ≠ 3;
  any unexpected path in plan; `--only` absent from the command.
- **Publish rollback:** unpublish the page (status → `draft`); draft import inserts are soft-delete
  reversible (per plan §9).
- **No DNS/redirect involved here** — GO 3 is DB-draft + publish only; nothing is deployed or cut over.
  DNS/redirects/CORS belong to GO 4–GO 7 and are out of this package's scope.
- **Tilda stays live** throughout — public solomiya-energy.com is unaffected by GO 3 (DNS still points
  at Tilda).

---

## 5. Position in the GO sequence
- **GO 1** — plan + scope-guard docs merged (#38/#40/#41). ✅
- **GO 2** — owner inputs (§1) recorded for preparation. ✅ *(this doc)*
- **GO 3** — execute §3 Steps B/D/E. ⛔ **Blocked pending `go GO3 execute`.**
- **GO 4+** — 301 infra PR, deploy, env/CORS, live QA, DNS cutover — separate, later, each gated.

---

## 6. Safety notes
This document and the work that produced it are **read-only + repo-docs only**. Verified: no importer
run · no `--apply` · no `--update-existing --apply` · no production DB write · no draft-JSON change ·
no CMS page create/update · no publish/unpublish · no deploy · no Railway/Cloudflare/DNS/redirect/env
change · no merge · no production action. All checks used GET requests against the public read API and
`git show` against `origin/main`. **GO 3 executes only after a separate explicit `go GO3 execute`.**
