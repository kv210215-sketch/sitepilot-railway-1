# Solomiya Energy — URL Coverage & 301 Redirect Plan (Tilda → SitePilot)

> **Status: PLANNING ONLY — NOT a cutover.** This document is the final URL-coverage and
> redirect strategy to run **before** the domain migration. It makes **no** DNS / Cloudflare /
> Tilda / Railway-domain / env / DB / publish / deploy changes. The actual switch requires a
> separate explicit `go domain migration` OWNER GO.
>
> **Companion docs (do not duplicate):**
> [`SOLOMIYA_DOMAIN_MIGRATION.md`](SOLOMIYA_DOMAIN_MIGRATION.md) (migration readiness, env/CORS,
> go/no-go) and [`IMPORT_SOLOMIYA_TILDA_PAGES.md`](IMPORT_SOLOMIYA_TILDA_PAGES.md)
> (draft import tooling). This file is the **per-URL coverage + 301 map** those docs reference.
>
> **Prepared:** 2026-06-28 · read-only verification · authoritative source = production public API.

---

## 1. Current state

| Layer | Finding (verified 2026-06-28, read-only) |
|---|---|
| DNS apex `solomiya-energy.com` | Cloudflare-proxied → origin **Tilda** (live production). **Not cut over.** |
| `www` | Cloudflare-proxied → Tilda / old Pages. **Not cut over.** |
| Tilda sitemap | **31 URLs** (HTTP 200, browser UA). Full list in §2. |
| SitePilot marketing-web | Railway service `marketing-web-rirw` (project `triumphant-purpose`, env `production`); reachable at `marketing-web-rirw-production.up.railway.app`. Public custom domain `solomiya-energy.com` added in Railway but DNS not pointed at it. |
| SitePilot backend public API | `sitepilot-railway-production.up.railway.app` — `/health` 200, `/public/v1/*` live (`PUBLIC_API_ENABLED=true`). Authoritative source of published pages. |
| SitePilot published pages | **5** (`/`, `/ses`, `/ses/dom`, `/ses/business`, `/installation`) + static route `/privacy`. |
| Live content quality | All 5 live pages **clean**: no fake claims, no placeholders, no `Блок: …`, all `robotsIndex:true`. Homepage clean-content fix + #37 `benefits`/`process` renderers are **already deployed**. |
| Rendering model | Marketing-web is a Next.js App Router catch-all (`app/[...path]/page.tsx`) that fetches each page from the backend public API. A path that is not a published backend page (or a static route) renders **noindex + 404** via `not-found`. **No 301 redirect infrastructure exists yet.** |
| Migration blocker | **Coverage, not code.** If DNS is switched now, only **5 of 31** Tilda URLs resolve → **26 × 404**. |

**The core problem this plan solves:** prevent the 26-URL 404 wave (and the SEO collapse / lost
Tilda link-equity that comes with it) by deciding, per Tilda URL, whether to **keep**, **publish**,
**clean-then-publish**, **301-redirect**, or **retire** — before any DNS cutover.

---

## 2. Tilda URL inventory (31 URLs)

Source: `https://solomiya-energy.com/sitemap.xml` (HTTP 200 with browser UA; Tilda returns 403 to
generic bots). All 31 currently serve from Tilda. `type` is classified from path + Tilda title.

| # | Path | Type | Tilda status |
|---|------|------|--------------|
| 1 | `/` | homepage | 200 |
| 2 | `/ses` | category hub | 200 |
| 3 | `/ses/dom` | segment (home) | 200 |
| 4 | `/ses/business` | segment (business) | 200 |
| 5 | `/ses/ground` | segment (ground-mount) | 200 |
| 6 | `/ses/5kw` | product / power tier | 200 |
| 7 | `/ses/10kw` | product / power tier | 200 |
| 8 | `/ses/20kw` | product / power tier | 200 |
| 9 | `/ses/30kw` | product / power tier | 200 |
| 10 | `/ses/50kw` | product / power tier | 200 |
| 11 | `/installation` | service | 200 |
| 12 | `/service-warranty` | service (warranty) | 200 |
| 13 | `/contacts` | contacts | 200 |
| 14 | `/realizovani-proekty` | portfolio | 200 |
| 15 | `/batteries` | category hub | 200 |
| 16 | `/batteries/hv` | subcategory | 200 |
| 17 | `/batteries/lv` | subcategory | 200 |
| 18 | `/batteries/dyness` | product (vendor) | 200 |
| 19 | `/batteries/pytes` | product (vendor) | 200 |
| 20 | `/inverters` | category hub | 200 |
| 21 | `/inverters/hybrid` | subcategory | 200 |
| 22 | `/inverters/grid` | subcategory | 200 |
| 23 | `/inverters/offgrid` | subcategory | 200 |
| 24 | `/inverters/backup` | subcategory | 200 |
| 25 | `/inverters/deye` | product (vendor) | 200 |
| 26 | `/inverters/huawei` | product (vendor) | 200 |
| 27 | `/solar-panels` | category / product | 200 |
| 28 | `/solar-panels-longi` | product (vendor) | 200 |
| 29 | `/sonyachni-paneli-dlya-domu` | product (home panels) | 200 |
| 30 | `/komplekty-rezervnoho-zhyvlennia` | product (backup kits) | 200 |
| 31 | `/kriplennia` | product (mounting) | 200 |

> Note on the task's expected paths: the live Tilda slug is `/komplekty-rezervnoho-zhyvlennia`
> (not `/komplekty`). `/solar-panels` exists plus two extra panel URLs (`/solar-panels-longi`,
> `/sonyachni-paneli-dlya-domu`). All other expected paths matched.

---

## 3. SitePilot coverage inventory

**Live (published) — 5 pages** (production `/public/v1/sitemap-entries`, all `robotsIndex:true`):
`/`, `/ses`, `/ses/dom`, `/ses/business`, `/installation`.
Plus static Next route **`/privacy`** (not a backend page; served by `app/privacy/page.tsx`).

**Draft / source — 31 pages** in `backend/scripts/data/solomiya-tilda-pages.draft.json`
(all `status:"draft"`, never published; importable only via the guarded
`import-solomiya-tilda-pages.mjs --apply --confirm-apply`). These mirror all 31 Tilda URLs 1:1
with `canonical=self`. Migration quality breakdown: **15 high · 7 medium · 9 low**.
`needsOwnerVerification`: **27 true / 4 false** (the 4 false = `/ses`, `/installation`,
`/ses/business`, `/ses/dom`, i.e. the already-live set minus the homepage).

**Per-Tilda-URL coverage status:**

| Tilda URL | Coverage status |
|---|---|
| `/`, `/ses`, `/ses/dom`, `/ses/business`, `/installation` | **already live** |
| `/privacy` *(not in Tilda set)* | live (static route) |
| `/service-warranty`, `/ses/ground` | draft exists, content-complete & safe, **not published** (owner sign-off) |
| `/contacts` | draft exists, **needs one owner datum** (email empty), not published |
| `/ses/5kw`, `/ses/10kw`, `/ses/20kw`, `/ses/30kw`, `/ses/50kw` | draft exists, **placeholder figures** (`~?`, `до −?%`), not published |
| `/batteries`, `/inverters`, `/solar-panels`, `/komplekty-rezervnoho-zhyvlennia`, `/kriplennia` | draft exists, **SEO body = `[SEO-текст з Tilda]` / `[позиція*]` placeholders**, not published |
| `/batteries/{hv,lv,dyness,pytes}`, `/inverters/{hybrid,grid,offgrid,backup,deye,huawei}`, `/solar-panels-longi`, `/sonyachni-paneli-dlya-domu` | draft exists, **`[модель N — характеристики*]` spec placeholders**, not published |
| `/realizovani-proekty` | draft exists, **placeholder cases** (`[об'єкт*][місто*][кВт*][результат*]`), not published |

---

## 4. Gap analysis

- **Covered today:** 5 / 31 (16%). Switching DNS now ⇒ **26 × 404**.
- **Content-complete & safe, publishable after owner sign-off (no fabrication needed): 3** —
  `/service-warranty`, `/ses/ground`, `/contacts` (the last needs only the support email filled in).
  Publishing these lifts coverage to **8 / 31**.
- **Blocked on real owner data (cannot be auto-filled without fabricating): 23** — 5 power tiers
  (real generation/savings numbers), 13 category/subcategory/vendor pages (product specs + SEO
  copy), 1 panels-for-home page, 1 backup-kits page, 1 mounting page, 1 portfolio (real projects).
- **301 infrastructure:** **does not exist** and must be added (see §9 snippet) before any URL can
  be redirected instead of 404'd.

---

## 5. Unsafe-claims audit

Method: scanned all 31 draft pages + the 5 live pages for `до 70/80%`, fast-payback / `окупність
3–4 роки`, `24/7`, fabricated warranty terms (`25/10/2 роки`), fake cases/testimonials, Tilda
placeholders, raw HTML, unsupported block types, and forms without consent.

**Live pages (5): CLEAN.** No fake claims, no placeholders, no `Блок: …`, all indexable. Earlier
fake claims («до 70%», «24/7», «окупність від 3–5 років») on the homepage were already removed and
the gated clean-content update applied; verified clean on 2026-06-28.

**Draft pages — cross-cutting findings:**

- **Already cleaned in the draft file** (per #36/#37): metaDescriptions on power pages rewritten to
  "Індивідуальний розрахунок економії" (removed «до 70%»/«швидка окупність»); fabricated warranty
  «25/10/2 роки» → safe «згідно з умовами виробника»; `trust`/guarantee «24/7» → «після запуску».
- **Consent:** the marketing-web `LeadForm` is **consent-aware at the component level** — a
  required consent checkbox blocks submission and renders a default UA consent string regardless of
  per-page data. So **no published page can ship a form without consent.** Not a per-page blocker.
- **Block types:** every block type used across the drafts (`hero, pain, steps, benefits, process,
  numbers, audience, guarantees, offers, trust, testimonials, cases, links, cta, roi_calculator,
  lead_form, faq, contact_info, seo_text, custom`) is rendered by `BlockRenderer`. **No
  unsupported-block / `Блок: …` risk** remains post-#37. One caution: the `custom` block renders
  near-raw and appears only on the unused stale draft homepage — irrelevant since live `/` uses the
  clean `benefits`/`process` version.
- **Still placeholder / needs real data:** `~?` & `до −?%` on power pages; `[модель N —
  характеристики*]` on subcategory/vendor pages; `[позиція*]` + `[SEO-текст з Tilda]` on
  product/category pages; placeholder portfolio cases on `/realizovani-proekty`.

**Per-page classification:**

| Class | Pages |
|---|---|
| `ready_to_publish` *(safe + content-complete; owner sign-off only)* | `/service-warranty`, `/ses/ground` |
| `needs_cleanup` *(one small owner datum, then publish)* | `/contacts` (fill support email; optional map) |
| `needs_owner_content` *(real data required — fabrication forbidden)* | `/ses/5kw`, `/ses/10kw`, `/ses/20kw`, `/ses/30kw`, `/ses/50kw`, `/batteries`, `/inverters`, `/solar-panels`, `/komplekty-rezervnoho-zhyvlennia`, `/kriplennia`, `/batteries/{hv,lv,dyness,pytes}`, `/inverters/{hybrid,grid,offgrid,backup,deye,huawei}`, `/solar-panels-longi`, `/sonyachni-paneli-dlya-domu` |
| `redirect_preferred` *(fast cutover path until/unless real content lands)* | all `needs_owner_content` pages above (301 to nearest live page) |
| `retire_candidate` *(410 — only if owner confirms permanent removal & no backlinks)* | optionally the vendor pages `/batteries/{dyness,pytes}`, `/inverters/{deye,huawei}`, `/solar-panels-longi` — **but 301 is recommended over 410** to preserve link equity |

> **Note:** `/realizovani-proekty` is deliberately **not** in `ready_to_publish`. Per the rules, do
> not publish a fake portfolio and do not redirect to one. Until the owner supplies real projects it
> is `redirect_preferred` → `/ses`.

---

## 6. Redirect map (301)

Targets follow the rule "nearest relevant page, never blanket-to-homepage." Redirects take effect
**only on the marketing-web service after cutover**; they are inert while DNS points at Tilda.

| Old Tilda URL | Proposed SitePilot target | Action | Reason | Priority | Owner needed |
|---|---|---|---|---|---|
| `/` | `/` | keep/live | live, clean | — | no |
| `/ses` | `/ses` | keep/live | live, clean | — | no |
| `/ses/dom` | `/ses/dom` | keep/live | live, clean | — | no |
| `/ses/business` | `/ses/business` | keep/live | live, clean | — | no |
| `/installation` | `/installation` | keep/live | live, clean | — | no |
| `/service-warranty` | `/service-warranty` | publish existing draft | content-complete & safe | **P1** | sign-off |
| `/ses/ground` | `/ses/ground` | publish existing draft | content-complete & safe | **P1** | sign-off |
| `/contacts` | `/contacts` *(fallback 301 → `/`)* | cleanup then publish | fill support email; `/` has contact_info+lead_form as fallback | **P1** | email |
| `/ses/5kw` | publish → else 301 `/ses/dom` | owner content / 301 | real gen+savings numbers; residential intent | P2 | numbers |
| `/ses/10kw` | publish → else 301 `/ses/dom` | owner content / 301 | residential intent | P2 | numbers |
| `/ses/20kw` | publish → else 301 `/ses/business` | owner content / 301 | business-scale intent | P2 | numbers |
| `/ses/30kw` | publish → else 301 `/ses/business` | owner content / 301 | business-scale intent | P2 | numbers |
| `/ses/50kw` | publish → else 301 `/ses/business` | owner content / 301 | business-scale intent | P2 | numbers |
| `/batteries` | publish → else 301 `/ses` | owner content / 301 | SEO body placeholder; nearest hub | P3 | SEO copy |
| `/batteries/hv` | 301 `/ses` | 301 redirect | spec placeholders; nearest hub | P3 | specs (later) |
| `/batteries/lv` | 301 `/ses` | 301 redirect | spec placeholders | P3 | specs (later) |
| `/batteries/dyness` | 301 `/ses` | 301 redirect | vendor page, low quality | P3 | specs (later) |
| `/batteries/pytes` | 301 `/ses` | 301 redirect | vendor page, low quality | P3 | specs (later) |
| `/inverters` | publish → else 301 `/ses` | owner content / 301 | SEO body placeholder; nearest hub | P3 | SEO copy |
| `/inverters/hybrid` | 301 `/ses` | 301 redirect | spec placeholders | P3 | specs (later) |
| `/inverters/grid` | 301 `/ses` | 301 redirect | spec placeholders | P3 | specs (later) |
| `/inverters/offgrid` | 301 `/ses` | 301 redirect | spec placeholders | P3 | specs (later) |
| `/inverters/backup` | 301 `/ses/dom` | 301 redirect | backup ↔ home resilience | P3 | specs (later) |
| `/inverters/deye` | 301 `/ses` | 301 redirect | vendor page | P3 | specs (later) |
| `/inverters/huawei` | 301 `/ses` | 301 redirect | vendor page | P3 | specs (later) |
| `/solar-panels` | publish → else 301 `/ses` | owner content / 301 | SEO body placeholder | P3 | SEO copy |
| `/solar-panels-longi` | 301 `/ses` | 301 redirect | vendor page, spec placeholders | P3 | specs (later) |
| `/sonyachni-paneli-dlya-domu` | 301 `/ses/dom` | 301 redirect | home panels ↔ home segment | P3 | SEO copy (later) |
| `/komplekty-rezervnoho-zhyvlennia` | 301 `/ses/dom` | 301 redirect | backup kits ↔ home segment | P3 | items (later) |
| `/kriplennia` | 301 `/installation` | 301 redirect | mounting ↔ installation service | P3 | items (later) |
| `/realizovani-proekty` | 301 `/ses` | 301 redirect (owner content later) | **no real cases yet — do not fake** | P2 | real projects |

**Coverage if all redirects + the 3 P1 publishes ship:** 31/31 URLs resolve (0 × 404).
8 pages live, 23 pages 301 to a relevant live page.

---

## 7. Implementation options

### Option A — Full coverage before cutover
Clean & publish all important pages so almost every Tilda URL has its own SitePilot page.

- **Pros:** minimal 404s, lowest SEO risk, every URL keeps a dedicated indexable page, strongest
  demo ("31 real pages").
- **Risks:** large owner-content dependency (23 pages need real numbers/specs/cases); slow; risk of
  publishing thin/placeholder pages if rushed (worse for SEO than a clean 301).
- **Work:** owner supplies power-tier figures, product specs, category SEO copy, real projects →
  `--update-existing` re-sync → publish 23+ pages → QA each.
- **OWNER GO needed:** content for all 23 pages; publish approval.
- **Verdict:** ideal end-state, but **not achievable quickly** — gated on substantial owner content.

### Option B — Minimal cutover with redirects (recommended)
Publish only what is genuinely ready; 301 the rest to the nearest relevant live page.

- **Pros:** fast; zero placeholder pages exposed; 0 × 404 at cutover; preserves Tilda link-equity
  via 301; demo shows 8 clean pages + correct redirects.
- **Risks:** redirected URLs lose their own ranking (mitigated — targets are topically relevant);
  requires a correct redirect map (this doc) and 301 infra (none today).
- **Work:** add 301 infra (§9); fill `/contacts` email; owner sign-off on `/service-warranty`,
  `/ses/ground`, `/contacts`; owner approves redirect map; publish the 3; deploy; QA.
- **OWNER GO needed:** sign-off on 3 pages + redirect-map approval (much smaller surface than A).
- **Verdict:** **GO-able** after the small checklist above — recommended cutover path.

### Recommended strategy: **Option B now, Option A incrementally after.**
Cut over with Option B (8 live + 23 relevant 301s → 0 × 404). Then, post-cutover, convert
`needs_owner_content` pages from 301 → real published page **one at a time** as the owner supplies
data. Because every draft URL is 1:1 with its Tilda path and `canonical=self`, swapping a 301 for a
real page later is safe and non-disruptive (just remove that redirect entry and publish).

---

## 8. OWNER GO sequence

1. **GO 1** — review + merge this plan + the 301 infra PR (docs/code only; no deploy).
2. **GO 2** — owner fills `/contacts` support email; signs off `/service-warranty`, `/ses/ground`,
   `/contacts`; **approves the §6 redirect map**.
3. **GO 3** — gated prod-DB publish of the 3 ready pages
   (`import-solomiya-tilda-pages.mjs --update-existing --apply --confirm-apply` for those paths).
4. **GO 4** — deploy marketing-web with the 301 redirects (§9) + any backend changes.
5. **GO 5** — env: set `NEXT_PUBLIC_SITE_ORIGIN=https://solomiya-energy.com`; add apex+www to
   backend `CORS_ORIGINS` (per `SOLOMIYA_DOMAIN_MIGRATION.md` §5); redeploy both.
6. **GO 6** — live QA on `marketing-web-rirw-production.up.railway.app`: 8 pages 200, 23 paths 301
   to the right targets, forms+consent, `/privacy`, canonical/sitemap/OG = apex. Back up Tilda
   (export + screenshots of all 31 pages).
7. **GO 7** — **`go domain migration`**: Cloudflare repoint apex + www to the Railway target
   (CNAME-flatten). **Keep MX / SPF / TXT untouched.**
8. **GO 8** — post-cutover QA; monitor 404/redirect logs + Search Console; keep rollback window.
9. **(ongoing)** — convert `needs_owner_content` URLs from 301 → real published page as content
   arrives (Option A tail).

---

## 9. Rollback notes

- **DNS rollback:** revert apex + www records in Cloudflare to the current Tilda values
  (TTL 300 ⇒ ~5 min propagation). Capture the exact pre-cutover record values during GO 7.
- **Tilda stays live** throughout ⇒ instant fallback origin; do not delete the Tilda project until
  a post-cutover stabilization window passes.
- **Email unaffected:** MX / SPF / TXT are never touched, so rollback has no email impact.
- **Redirect rollback:** redirects live in `marketing-web` code — reverting the deploy (or removing
  entries from `next.config.js`) removes them; they are inert until DNS points at Railway anyway.
- **Publish rollback:** draft import inserts are soft-delete reversible; unpublish restores draft.

### 301 infrastructure (to be added in a separate code PR — not in this docs PR)
No redirect layer exists today. Recommended: a build-time redirect table in
`marketing-web/next.config.js` (evaluated before the dynamic catch-all):

```js
// marketing-web/next.config.js — ADD (illustrative; final list per §6, gate behind OWNER GO)
async redirects() {
  const to = (source, destination) => ({ source, destination, permanent: true }); // 308 ≈ 301 for SEO
  return [
    to('/batteries', '/ses'), to('/batteries/hv', '/ses'), to('/batteries/lv', '/ses'),
    to('/batteries/dyness', '/ses'), to('/batteries/pytes', '/ses'),
    to('/inverters', '/ses'), to('/inverters/hybrid', '/ses'), to('/inverters/grid', '/ses'),
    to('/inverters/offgrid', '/ses'), to('/inverters/backup', '/ses/dom'),
    to('/inverters/deye', '/ses'), to('/inverters/huawei', '/ses'),
    to('/solar-panels', '/ses'), to('/solar-panels-longi', '/ses'),
    to('/sonyachni-paneli-dlya-domu', '/ses/dom'),
    to('/komplekty-rezervnoho-zhyvlennia', '/ses/dom'), to('/kriplennia', '/installation'),
    to('/realizovani-proekty', '/ses'),
    to('/ses/5kw', '/ses/dom'), to('/ses/10kw', '/ses/dom'),
    to('/ses/20kw', '/ses/business'), to('/ses/30kw', '/ses/business'), to('/ses/50kw', '/ses/business'),
  ];
  // Remove an entry when its real page is published (URL is 1:1, so the swap is clean).
}
```
> Use `permanent: true` (Next emits HTTP 308, treated as a permanent redirect by Google). If a
> classic 301 status is required, use `{ source, destination, statusCode: 301 }` instead (do not set
> both `permanent` and `statusCode`).

---

## 10. Safety notes

This document and the work that produced it are **read-only + repo-docs only**. Verified:
no DNS changes · no Cloudflare changes · no Tilda changes · no Railway custom-domain changes ·
no env/secrets changes · no production DB writes · no DB re-sync · no publish/unpublish ·
no deploy · no merge · no production page create/delete · no homepage/content changes ·
no real redirects in production.

All read-only checks used GET requests against public sitemaps and the public read API. The 301
infra snippet in §9 is **illustrative** and intentionally **not** added to code in this PR — it is
gated behind GO 1 + GO 4. **Domain migration happens only after a separate explicit OWNER GO.**
