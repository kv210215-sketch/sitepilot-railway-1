# Import Solomiya Tilda → SitePilot (DRY-RUN)

Code-only prep on branch `feature/solomiya-tilda-migration-dry-run`. **Imports nothing by default.**
Lets SitePilot accept the 31 migrated Tilda pages as **drafts** after a separate explicit approval.

## What this branch adds
1. `marketing-web/components/BlockRenderer.tsx` — two new block renderers: **`contact_info`** (structured phone/email/address/hours/messengers/map) and **`seo_text`** (safe rich text, no `dangerouslySetInnerHTML`). Plus the two types in `lib/public-api.ts` union.
2. `backend/scripts/data/solomiya-tilda-pages.draft.json` — the 31 draft pages (all `status:"draft"`, URL 1:1, canonical=self).
3. `backend/scripts/import-solomiya-tilda-pages.mjs` — dry-run-first import tool.

## Run dry-run (safe — no DB, no writes, zero deps)
```bash
cd backend
node scripts/import-solomiya-tilda-pages.mjs              # = --dry-run (default)
```
Validates structure, checks duplicate paths, confirms every block type is renderable, and prints the plan (would-create / would-skip). Writes nothing, never connects to a DB.

## Optional: read-only existence check (needs DATABASE_URL)
```bash
node scripts/import-solomiya-tilda-pages.mjs --check-existing
```
Adds a **read-only** `SELECT path FROM pages` to classify create vs already-exists. Still writes nothing.

## Real import (guarded — only after explicit go)
```bash
node scripts/import-solomiya-tilda-pages.mjs --apply --confirm-apply
```
- Requires **both** `--apply` and `--confirm-apply` (the confirm guard runs *before* any DB connection).
- Inserts missing pages as **`status='draft'`**, `published_at = NULL` → **never published**.
- **Skips homepage `/`** unless `--include-homepage`.
- **Skips existing paths** (never overwrites) unless `--update-existing`.
- Does nothing to DNS / env / Cloudflare / Tilda / deploy.

### Flags
| Flag | Effect |
|---|---|
| (none) / `--dry-run` | validate + plan, no DB |
| `--check-existing` | + read-only existing-path lookup |
| `--apply --confirm-apply` | insert missing as draft |
| `--include-homepage` | allow touching `/` |
| `--update-existing` | with apply, update existing paths |
| `--file=<path>` | override draft JSON |

## How to read the output
- **WOULD CREATE** — new pages (path not in DB). Each line: `quality  pageType  path`.
- **WOULD SKIP — already exists** — path present in DB (only with `--check-existing`/`--apply`).
- **WOULD SKIP — homepage guard** — `/` held back by default.
- **quality** — `high`/`medium`/`low` migration quality; `needsOwnerVerification` count = pages with `*`/`[…]` placeholders.

## Risks / what to check BEFORE `--apply`
- **Content is migration-grade, not final.** 31 pages have placeholders (`~?`, `[…]`) and templated copy → review per `owner_verification_notes.md`. Drafts are safe to insert, but **do not publish** before editorial QA.
- Power-page numbers, vendor specs, portfolio cases — owner must supply real data.
- `page_type` is mapped to the DB enum (`page/landing/service/category/article`); custom draft `pageType` values are mapped, not stored verbatim.
- Inserting drafts is reversible (soft-delete), but still gate behind an explicit go.

## What this branch does NOT do
No DB writes (default), no publish, no deploy, no DNS/env/Cloudflare/Tilda changes, no push to main. Pure code prep + dry-run.

## First batch — Category A resolved (2026-06-27)
Owner-confirmed contact data applied to the **5 first-wave pages** (`/`, `/ses`, `/ses/dom`, `/ses/business`, `/installation`) inside `solomiya-tilda-pages.draft.json`:
- structured **`contact_info`** block injected: phone **`+38 (067) 555-40-00`** (`tel:+380675554000`), email **`andriy555solar@gmail.com`**; homepage's temporary raw-HTML `custom` phone block replaced by it;
- page-level `contact` (responsible: «Андрій / команда Solomiya Energy», leads → SitePilot Leads Inbox + email) and `categoryAResolved: true` set **only on these 5**; the other 26 pages are unchanged.

**Still draft-only.** All 5 remain `status:"draft"` + `needsOwnerVerification:true`. **Publish is still blocked by Category B** (per `first_batch_remaining_questions.md`): guarantees figures, ROI/savings %, real cases (currently placeholder `−80%`/`~4 yr`), `/ses` SEO-hub text, `/installation` turnkey scope. **Legal: consent-to-process + Privacy Policy (and company legal requisites) are still required before any publish.**
