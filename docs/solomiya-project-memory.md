<!-- Consolidated project memory + runbook for the SitePilot × Solomiya Energy migration.
     Single source of truth for future sessions. Review-only artifact: documenting it
     performs no deploy/DB/DNS/publish. Last consolidated: 2026-06-28. -->

# SitePilot × Solomiya Energy — Project Memory & Runbook

> **Status:** living document. Consolidated 2026-06-28 from repo docs, scratchpad reports,
> prior-session audits, and the current integration branch. **Review-only** — nothing here
> deploys, imports, publishes, or mutates production.
> Each fact is tagged **[V]** verified this session / **[A]** from prior audit (re-verify before
> acting) / **[O]** owner-stated / **[NA]** not available.

---

## 1. Executive summary

SitePilot is an AI lead-generation / CMS / SEO platform; **Solomiya Energy** (a Lviv solar-EPC
company) is its first production case. The goal is to migrate Solomiya from **Tilda**
(`solomiya-energy.com`, 31 indexed SEO pages, live production) into SitePilot's `marketing-web`
**without losing SEO** and with the **exact** design of the campaign landing
(`solomiya-energy-landing.pages.dev`). [O][V]

Current state: a **draft PR (#39)** on branch `solomiya/integration-content-design-assets`
bundles 31 review-drafts, a scoped Solomiya theme (exact landing replication), image-migration
tooling/manifest/plan, a self-hosted image/gallery renderer, and an SEO checklist. **No deploy,
DB import, publish, env, DNS, or merge has been done.** Blockers before going live: image
licensing, owner facts for `[OWNER_INPUT_REQUIRED]`, `/service-warranty` claim review, and a
gated import→publish→cutover sequence. [V]

---

## 2. Project purpose

- Move Solomiya's customer-facing site off Tilda onto SitePilot-owned infra (control of content,
  assets, leads, SEO). [O]
- Preserve the **31 indexed URLs 1:1** — no ranking/link-equity loss. [O]
- Reproduce the premium dark+gold landing design **exactly** (not an approximation). [O][V]
- Route leads to SitePilot's Leads Inbox (not Tilda CRM) once cut over. [A]
- Keep it multi-tenant-safe: a Solomiya re-skin must never repaint other SitePilot tenants. [V]

---

## 3. Architecture

| Layer | Tech | Role |
|-------|------|------|
| Backend | NestJS + TypeORM + PostgreSQL (Railway) | CMS data, SEO generation, AI, publish, leads. API prefix `/api/v1`; public API `/public/v1/*`; `/health`. [A] |
| Admin frontend | Next.js 14 (App Router) | Authenticated operator console (`frontend/`), `noindex`. [A] |
| **Marketing site** | **Next.js 14 (`marketing-web/`)** | Public, indexed, SSR catch-all `app/[...path]/page.tsx` fetching each page from the backend public API. **This is where the migration lands.** [V] |
| Ops | `ops/osctl/` | Frozen governance ledger — orthogonal to app runtime. [A] |

`marketing-web` is **one-project-per-deploy**, so theme is an **env choice**, not per-request. [V]

Key `marketing-web` files (all [V]):
- `app/globals.css` — token layer + scoped Solomiya theme.
- `app/layout.tsx` — `<html data-theme>`, conditional fonts + chrome.
- `lib/theme.ts` — `getSiteTheme()` reads `NEXT_PUBLIC_SITE_THEME` (allowlist `default|solomiya`).
- `components/SiteChrome.tsx` — Solomiya header/footer (rendered only for the theme).
- `components/BlockRenderer.tsx` — block→HTML; 18+ block types incl. new `image`/`gallery`.
- `components/{LeadForm,RoiCalculator}.tsx` — lead capture + ROI (logic unchanged; style tokens only).
- `lib/seo/*` — canonical/OG/robots/sitemap/JSON-LD, all derived from page data.
- `app/sitemap.ts` (dynamic, from published pages), `app/robots.ts`, `app/privacy/page.tsx`.

Backend scripts (all [V]):
- `backend/scripts/import-solomiya-tilda-pages.mjs` — dry-run-first importer; `--apply` needs
  `--confirm-apply` + `DATABASE_URL`; never publishes; homepage-guarded.
- `backend/scripts/download-solomiya-images.mjs` / `optimize-solomiya-images.mjs` — image migration.
- `backend/scripts/data/solomiya-review-drafts.json` — the 31 drafts (PR #39).
- `backend/scripts/data/solomiya-image-manifest.json` — 150-asset image manifest.

---

## 4. Environments & URLs

| Purpose | URL | Tag |
|---------|-----|-----|
| Tilda production / SEO source of truth | `https://solomiya-energy.com` | [O][V] |
| Landing — **design** source of truth | `https://solomiya-energy-landing.pages.dev/` | [O][V] |
| SitePilot frontend staging | `https://sitepilot-frontend-staging.up.railway.app` | [O] |
| SitePilot backend staging | `https://sitepilot-railway-staging.up.railway.app` | [O] |
| marketing-web prod service (prior audit) | `https://marketing-web-rirw-production.up.railway.app` | [A] re-verify |
| backend prod service (prior audit) | `https://sitepilot-railway-production.up.railway.app` | [A] re-verify |

DNS facts (prior audit, **re-verify before any cutover**): apex + `www` are **Cloudflare-proxied →
Tilda origin**; **MX = Namecheap email forwarding + SPF — MUST NOT touch**; Railway custom domain
`solomiya-energy.com` is added to the marketing-web service but **DNS not cut over**. [A]

---

## 5. Repositories / branches / PRs

- Repo (local): `D:/Projects/SitePilot/sitepilot-railway`. Remotes: `origin` =
  `github.com/andriy555solar-afk/sitepilot-railway` (base/upstream); `fork` =
  `github.com/kv210215-sketch/sitepilot-railway-1` (push target; gh authed as `kv210215-sketch`). [V]
- `origin/main` HEAD = `9ec50d0`. [V]
- Working branches:
  - `content/solomiya-review-drafts` (`9aa1b0f`) — 31 drafts. [V]
  - `design/tenant-theme-layer` (`9e51d52`→`e6bda35`) — token layer + dark/gold theme. [V]
  - **`solomiya/integration-content-design-assets`** — the integration branch (PR #39). [V]
- Prior PRs of record: **#35** (marketing-web, merged), **#36** (Tilda import tooling, merged
  `5c0d1c6`), **#37** (benefits/process renderers + homepage demo-readiness, merged `9ec50d0`),
  **#38** (URL-coverage & 301 plan, **draft, unmerged**). [A]

---

## 6. Current PR #39 status

- **[PR #39](https://github.com/andriy555solar-afk/sitepilot-railway/pull/39)** —
  `solomiya/integration-content-design-assets` → `main`. **draft / OPEN / unmerged.** Head `5eff291`. [V]
- 9 commits (3 cherry-picked base + 5 feature + 1 docs-clarify), 23 files, ~+13,215 / −46. [V]
- Contents: 31 review-drafts · tenant theme token layer · scoped Solomiya dark+gold theme (exact
  landing replication) · image migration manifest/tooling/plan/scaffold · self-hosted
  `image`/`gallery` block renderer · `/batteries` title fix · SEO migration checklist · doc
  clarifications. [V]
- Reviewed (8-point checklist) — **no blocking issues**; default theme unchanged; Solomiya fully
  scoped; 31 draft; markers intact; no secrets/env/binaries. **Keep draft; do not merge without GO.** [V]

---

## 7. Content migration facts

- 31 Tilda-sourced review-drafts in `solomiya-review-drafts.json`, **all `status: draft`**, all
  `robotsIndex: true`, paths 1:1 with Tilda. [V]
- **104 `[OWNER_INPUT_REQUIRED]` + 2 `[CLAIM_REVIEW_REQUIRED]`** markers — preserved, nothing
  fabricated. [V]
- `metaDescriptionSource`: 21 `tilda` (real indexed text — preserve 1:1), 10 `rewritten`. [V]
- Phone `+380675554000` is **real** (9× on the live landing) — not a placeholder. [V]
- Only content edit applied: `/batteries` `metaTitle` was a malformed 156-char description →
  proper ~68-char title from on-page terms (`СЕС, Львів, Deye/Dyness/Pytes | Solomiya Energy`). [V]
- Drafts are a JSON artifact **not in the DB**; importing is a separate gated step. [V]
- `reviewClassification` (approx): ~8 ready, ~20 owner-input-needed (catalog/spec/power-tier
  pages), `/service-warranty` = risky-claims, `/`+`/realizovani-proekty` = needs photos/cases. [V]
- Prod DB (prior audit) already has **5 pages**: `/` (published) + `/ses,/ses/dom,/ses/business,
  /installation` (draft). The other 26 are absent. [A]
- **Never** import Tilda system assets / "Made on Tilda" / placeholders as real content. [O]

---

## 8. The 31-URL strategy

- **Preserve all 31 indexed URLs 1:1.** No renaming, no merging, no mass 301s of indexed URLs. [O][V]
- **301 only** for non-indexed / duplicate / service / retired URLs. **No 404s.** [O]
- 301 redirect infrastructure **does not exist yet** — illustrative `next.config.js redirects()` is
  documented in the external URL-coverage plan; adding it is a separate gated code step. [A]
- Recommended cutover = **Option B** (minimal cutover + 301s → 0×404 now; publish real pages
  incrementally after, swapping 301→page since URLs are 1:1). [O]
- Per-URL keep/redirect/retire map lives in `SOLOMIYA_URL_COVERAGE_AND_REDIRECT_PLAN.md`
  (**external planning PR #38, NOT in PR #39**). [A]

---

## 9. Design system facts (exact landing replication)

Ported 1:1 from `solomiya-energy-landing.pages.dev` `css/main.css` (the source of truth). [V]

- Colors: `--bg #0A0A0A`, `#111111`, `#161616`; lines `rgba(255,255,255,.08)` / `.14`; text
  `#F5F1EA` (dim .62, mute .42); **gold `#C9A961` / `#E0C076` / deep `#8C7437`**; danger `#E07A5F`. [V]
- Fonts: **Instrument Serif (italic-only, `ital@1`)** + **Inter (400–800)** + **JetBrains Mono
  (400/500)**, loaded via Google Fonts `<link>` only for the Solomiya theme. Upright serif falls
  back to Times New Roman (matches landing); italic-gold `<em>` accents use Instrument Serif italic. [V]
- Buttons: **flat sharp gold** (radius 0), weight 600; hover → gold-2 + `translateY(-1px)` + gold
  glow `box-shadow`. (Earlier approximation used a gradient — now exact.) [V]
- Type: serif display headings, `em` = italic gold; **120px / 80px** section rhythm; hairline dividers. [V]
- Chrome: sticky blurred header with bordered **`SE` brand-mark** + `SOLOMIYA` + gold `ENERGY`,
  mono phone, gold CTA; **4-column footer** with mono headings; gold `::selection`. [V]
- Footer legal line: **`© 2026 ТОВ «Соломія енергозбереження» · ЄДРПОУ 40446535 · SOLAR EPC · MADE
  IN LVIV`** (real, from the live landing footer). Email `andriy555solar@gmail.com`. [V]
- Verified live (computed-style + screenshots): bg `#0A0A0A`, CTA `#C9A961` flat 0px, italic-gold
  accent, Instrument Serif hero, JetBrains Mono phone — exact. [V]

---

## 10. Theme activation

- **Default theme must remain unchanged.** Solomiya styling is scoped **only** under
  `[data-theme='solomiya']`; the default scope keeps the original literals. [V]
- Activate per-deploy: **`NEXT_PUBLIC_SITE_THEME=solomiya`** (unset/unknown → `default`). [V]
- Optional env overrides (Solomiya real values as defaults): `NEXT_PUBLIC_SITE_NAME`,
  `NEXT_PUBLIC_SITE_PHONE`, `NEXT_PUBLIC_SITE_EMAIL` (and `NEXT_PUBLIC_SITE_LEGAL`). [V]
- **No global re-skin.** Setting the env is a gated production action (do not flip it without GO). [O]

---

## 11. Image migration facts

Crawl (read-only, 31 live URLs, 2026-06-28): **500 image refs · 312 unique URLs · 150 logical
assets · ~38.25 MB**; 250 JPEG / 41 PNG / 21 SVG. [V]

- Plan = **Option B self-host**: 148 self-host, **2 Tilda system assets skipped** ("Made on Tilda"
  badge + sprite). Manifest: `backend/scripts/data/solomiya-image-manifest.json`. [V]
- Optimize to **AVIF (primary) + WebP (fallback)**, widths **640/960/1280/1920**, hero `priority`,
  explicit width/height (CLS-safe), lazy below fold. Est. ~38.25 MB → ~9.6 MB (~75%). Proven on a
  real hero: AVIF −82% / WebP −71%. [V]
- **Logo critical fix:** `solomiya_WEB_monochr.svg` ≈ **1.49 MB** = base64 raster inside an SVG,
  loaded on all 31 pages. **Do NOT migrate as-is** — theme uses a **text brand** instead
  (~1.45 MB/pageview saved). A real ~15–40 KB vector only if a graphical mark is later needed. [V]
- Tooling: `download-solomiya-images.mjs` (dry-run default → gitignored import dir, never the tree)
  + `optimize-solomiya-images.mjs` (sharp-optional, graceful checklist fallback). [V]
- **No permanent tildacdn dependency** for production; never leave hero/LCP external. [O][V]
- **Image binaries are gitignored** (`.avif/.webp/.png/.jpg/.jpeg` under `public/images/solomiya/`)
  until **owner confirms licensing** of stock/AI source files; only scaffold + README tracked. [V]
- `next/image` production optimizer needs **`sharp` as a marketing-web runtime dep before the first
  live image block** (`npm i sharp`); no-op until then. [V]

---

## 12. SEO strategy

- `marketing-web` auto-emits **canonical / OG / robots / sitemap / JSON-LD from page data**
  (`lib/seo/metadata.ts`, `json-ld.ts`, dynamic `app/sitemap.ts`) — no per-page code. [V]
- All 31 drafts: `robotsIndex:true`, canonical on `solomiya-energy.com`, metaTitle/Desc/h1 complete. [V]
- **Preserve real Tilda meta text** (the 21 `tilda`-sourced descriptions) — do not replace with AI
  copy without need; minor length deviations are cosmetic, not penalties. [V]
- OG is currently text-only → add per-page OG images before publish (ties to image plan). [V]
- Checklist: `docs/solomiya-seo-migration-checklist.md`. [V]

---

## 13. Validation commands (safe, local)

Run in `marketing-web/` unless noted:
```bash
npx tsc --noEmit                                   # type-check
npx next lint                                      # lint
npx next build                                     # default-theme build
NEXT_PUBLIC_SITE_THEME=solomiya npx next build     # solomiya-theme build (must match routes)
npm run validate:seo                               # SEO validator
# repo root:
node --check backend/scripts/download-solomiya-images.mjs
node --check backend/scripts/optimize-solomiya-images.mjs
node -e "require('./backend/scripts/data/solomiya-review-drafts.json')"   # drafts JSON valid
node backend/scripts/import-solomiya-tilda-pages.mjs --file=backend/scripts/data/solomiya-review-drafts.json  # importer DRY-RUN (no DB)
```
Expected: all green; identical routes/bundle between the two builds; no secrets; no `.env` changes;
no unrelated files; no DB/deploy/DNS/Railway side effects. [V]

---

## 14. Guardrails (standing)

Local-only, smallest change, stage only named files, show diff. **Never** push/deploy/merge
autonomously beyond docs/working-branch updates. Never commit secrets or image binaries. Never
remove `[OWNER_INPUT_REQUIRED]` / `[CLAIM_REVIEW_REQUIRED]` without owner-approved real content.
Keep PR #39 draft. [O]

---

## 15. Known blockers (before go-live)

1. **Image licensing** — confirm rights for stock/AI source files before self-hosting / committing
   optimized binaries. [V]
2. **~20 catalog/spec/power-tier pages** still carry `[OWNER_INPUT_REQUIRED]` (real models, specs,
   figures). [V]
3. **`/service-warranty`** — 2 `[CLAIM_REVIEW_REQUIRED]` to confirm/rewrite. [V]
4. **Drafts not in DB** — gated import required (dry-run → review → `--apply`). [V]
5. **No 301 infra** — needed for the non-indexed/duplicate set (separate gated code step). [A]
6. **DNS not cut over**; env (`SITE_THEME`, and per prior audit `SITE_ORIGIN`/`CORS_ORIGINS`) are
   gated production changes. [A]
7. **OG images** missing (text-only OG today). [V]

---

## 16. Owner facts still needed

- Image licensing confirmation (which stock/AI files may be re-hosted; prefer owned SES photos). [V]
- Real specs/figures for the ~20 `[OWNER_INPUT_REQUIRED]` catalog pages (power kW, models, prices,
  generation, payback, real cases + photos). **Do not fabricate.** [V]
- `/service-warranty` claim confirmation. [V]
- Confirmation of any graphical logo asset (else text brand stays). [V]
- Confirmed legal/contact already known: ТОВ «Соломія енергозбереження», ЄДРПОУ 40446535, office
  вул. Стрийська 45 Львів 79000, juridical вул. Степанська 115 Костопіль 35000, phone
  +380675554000, email andriy555solar@gmail.com. [A]

---

## 17. What NOT to do (without explicit, separate GO)

Production deploy · staging deploy that changes the public preview · production DB import · publish
pages · Railway env change · DNS change · merge to main · destructive migration · delete production
data · Tilda/Cloudflare production changes · handle/store secrets/tokens/passwords · any
irreversible action. [O]

---

## 18. Next safe steps

1. Owner reviews **PR #39** (read-only). [safe]
2. Owner confirms **image licensing** → then download/optimize locally, un-gitignore approved binaries. [gated]
3. Owner supplies facts for `[OWNER_INPUT_REQUIRED]` pages; fill drafts (still `draft`). [safe-content]
4. Re-run validation (section 13). [safe]
5. **Import drafts to staging only after approval** (importer dry-run first). [gated]
6. Preview on staging; QA. [gated]
7. Add `sharp` to marketing-web deps **before** wiring live image blocks. [safe-when-go]
8. Publish ready pages **only after approval**. [gated]
9. Set `NEXT_PUBLIC_SITE_THEME=solomiya` (+ optional name/phone/email) on the Solomiya deploy. [gated]
10. Add 301 infra for non-indexed/duplicate set. [gated]
11. **DNS/cutover only after final GO** (keep MX/SPF/TXT). [gated]

---

## 19. Production cutover checklist (do NOT execute without GO)

- [ ] All ready pages published in backend; `[OWNER_INPUT]`/`[CLAIM]` resolved on those pages.
- [ ] Per-URL coverage confirmed (31 keep-1:1 + 301 map for the rest); 0×404 modelled.
- [ ] `sharp` added; optimized images committed (licensing cleared); hero `priority`/preload set.
- [ ] Env set: `NEXT_PUBLIC_SITE_THEME=solomiya`, `NEXT_PUBLIC_SITE_ORIGIN=https://solomiya-energy.com`,
      backend `CORS_ORIGINS` includes apex + `www`. (`SITE_ORIGIN`/`CORS` may already be set — re-verify.) [A]
- [ ] Both builds green; canonical/OG/sitemap emit `solomiya-energy.com`.
- [ ] Backup + screenshot live Tilda site.
- [ ] In Cloudflare, repoint apex + `www` to the Railway target (**keep MX/SPF/TXT untouched**).
- [ ] SSL issued; live QA; lead POST works from apex (CORS).
- [ ] Submit refreshed sitemap to Search Console.
- [ ] Monitor; retire Cloudflare Pages, then Tilda, after a soak period.

---

## 20. Recovery / rollback notes

- **Rollback DNS cutover:** revert the Cloudflare apex/`www` records to Tilda (TTL 300 ⇒ ~5 min).
  Tilda apex stays the live production until cutover, so reverting restores it instantly. [A]
- **Rollback env (prior audit values):** `NEXT_PUBLIC_SITE_ORIGIN` →
  `https://marketing-web-rirw-production.up.railway.app`; `CORS_ORIGINS` →
  `https://sitepilot-frontend-production-b107.up.railway.app,https://marketing-web-rirw-production.up.railway.app`. [A]
- **Drafts safety:** importer never publishes and is homepage-guarded; a bad import leaves pages as
  `draft` (invisible publicly). Homepage `/` content edits must use a scoped `UPDATE … WHERE
  status='published'` (the importer's UPDATE forces `draft` = unpublish — avoid for `/`). [A]
- **PR safety:** PR #39 is draft; closing/reverting it touches no production. [V]

---

### Source index (consolidated 2026-06-28)

- Repo: `IMPORT_SOLOMIYA_TILDA_PAGES.md`, `SOLOMIYA_DOMAIN_MIGRATION.md`,
  `docs/solomiya-{image-migration-plan,seo-migration-checklist}.md`,
  `marketing-web/public/images/solomiya/README.md`. [V]
- Scratchpad (prior sessions, FOUND): `SOLOMIYA_MIGRATION_AUDIT_2026-06-28.md`,
  `OWNER_REVIEW_REPORT_2026-06-28.md`, `DESIGN_PHASE1_REPORT_2026-06-28.md`,
  `DESIGN_PHASE2_REPORT_2026-06-28.md`, `SOLOMIYA_IMAGE_CRAWL_REPORT_2026-06-28.md`,
  `solomiya-crawled-image-manifest.json`. [V — existence; content summarized above]
- External (not in this PR): `SOLOMIYA_URL_COVERAGE_AND_REDIRECT_PLAN.md` (draft PR #38). [A]
- Claude auto-memory: `project-solomiya-domain-infra.md` (+ related `project-sitepilot`,
  `project-railway-staging`, `project-pr35-marketing-web`, `feedback-working-style`). [V]
