# Solomiya Energy — Domain Migration Readiness (Tilda → SitePilot/Railway)

Status: **PREPARATION ONLY. NOT a cutover.** No DNS/Cloudflare/Tilda/Railway-domain/env/DB
changes are made by this branch. The actual switch needs a separate explicit
`go domain migration` OWNER GO and the gated steps below.

## 1. Current state (read-only probes)

| Layer | Finding |
|---|---|
| DNS provider | Cloudflare (`gloria/yichun.ns.cloudflare.com`) |
| apex `solomiya-energy.com` | Cloudflare-proxied A `188.114.96.11 / 188.114.97.11` (TTL 300) → origin **Tilda** (`X-Tilda-Server`) |
| `www` | Cloudflare-proxied A+AAAA (→ Tilda/Pages) |
| MX (email) | `eforward1-5.registrar-servers.com` (Namecheap fwd, pref 10/10/10/15/20) — **DO NOT TOUCH** |
| TXT | SPF `include:spf.efwd.registrar-servers.com` + google/openai verification — **preserve** |
| Tilda | live production, sitemap = **31 URLs**, forms → Tilda CRM |
| Railway prod service | **`marketing-web-rirw`** (project `triumphant-purpose` / env `production`) |
| Railway custom domain | `solomiya-energy.com` already added (`RAILWAY_PUBLIC_DOMAIN`); DNS not cut over. Exact CNAME target: read from Railway dashboard → service → Settings → Networking |
| SitePilot live | 5 pages 200 (`/`, `/ses`, `/ses/dom`, `/ses/business`, `/installation`) + `/privacy`; tested via `marketing-web-rirw-production.up.railway.app` |
| Backend public API | live (`PUBLIC_API_ENABLED=true`, `TRUST_PROXY=2`) |

## 2. Tilda URL coverage / 404-prevention plan

If the domain is switched now, **only 5 of 31 URLs resolve** on SitePilot → 26×404.
Coverage of all 31 Tilda URLs:

**LIVE (published, 5):** `/`, `/ses`, `/ses/dom`, `/ses/business`, `/installation`

**DRAFT-READY — claims cleaned, need publish (8):** `/contacts`, `/service-warranty`,
`/ses/5kw`, `/ses/10kw`, `/ses/20kw`, `/ses/30kw`, `/ses/50kw`, `/ses/ground`
→ action: owner content review → `--apply --update-existing` re-sync → publish.

**NEEDS OWNER CONTENT — still have placeholders (18):**
`/batteries`, `/batteries/{dyness,hv,lv,pytes}`, `/inverters`,
`/inverters/{backup,deye,grid,huawei,hybrid,offgrid}`, `/solar-panels`,
`/solar-panels-longi`, `/sonyachni-paneli-dlya-domu`, `/komplekty-rezervnoho-zhyvlennia`,
`/kriplennia`, `/realizovani-proekty`
→ contain `[...*]` spec placeholders / `[SEO-текст з Tilda]` / fake-or-placeholder cases.
→ action: owner provides real product specs / SEO copy / real projects, OR these URLs get
**301 redirects** to the nearest live page (e.g. `/batteries/*`→`/ses`, `/inverters/*`→`/ses`,
`/realizovani-proekty`→`/ses`) **before** cutover. **No 301 infra exists yet — must be added.**

Recommended per-URL target for redirect fallback (if not published):
`/batteries*`,`/inverters*`,`/solar-panels*`,`/sonyachni-paneli-dlya-domu`,`/komplekty-*`,`/kriplennia` → `/ses` ;
`/realizovani-proekty` → `/ses` ; `/contacts` → publish (or `/` footer) ; `/service-warranty` → publish.

## 3. Homepage `/` (demo-readiness)

The LIVE homepage (`hero, audience, benefits, process, lead_form`) lives **only in the prod DB**
(no repo source). Problems found: metaDescription + hero + benefits had fake claims
(«до 70%», «24/7», «окупність від 3–5 років»); blocks `benefits`/`process` rendered as visible
`Блок: …` because BlockRenderer lacked renderers for them.

This branch fixes:
- **`marketing-web/components/BlockRenderer.tsx`** — adds reusable `benefits` (card grid) +
  `process` (ordered steps) renderers (+ type union in `lib/public-api.ts`, + importer
  `SUPPORTED`). After deploy the homepage no longer shows `Блок: …`.
- **`backend/scripts/data/solomiya-homepage.clean.json`** — corrected homepage content
  (safe copy, individual-calc ROI wording, Net Billing described not promised) for a gated
  DB update of `/`.

> ⚠️ **SEQUENCING:** the `benefits`/`process` renderers make the homepage block CONTENT visible.
> The homepage content currently in prod DB still has fake claims. Therefore the homepage
> content fix (gated DB update from `solomiya-homepage.clean.json`) **MUST be applied before or
> in the same release as** deploying these renderers — otherwise the renderers would surface the
> existing fake claims. Apply (GATED):
> `node scripts/import-solomiya-tilda-pages.mjs --file=scripts/data/solomiya-homepage.clean.json --only=/ --include-homepage --update-existing --apply --confirm-apply`

## 4. Next-wave content cleanup done on this branch (repo-level, draft only — NOT published)

In `backend/scripts/data/solomiya-tilda-pages.draft.json` (no DB writes):
- fabricated warranty terms «25/10/2 роки» → owner-approved safe wording (same as live pages);
- «Сервіс … 24/7» (guarantees) + `trust` badge «24/7» → safe «після запуску» wording;
- metaDescription «до 70%» / «швидка окупність» (`/ses/5kw,10kw,30kw,50kw`) → individual-calc wording.

Still **needs owner content** (NOT auto-fixed — would require fabrication): `[...*]` spec
placeholders + `[SEO-текст з Tilda]` on the 18 pages above; fake cases on the stale draft `/`
(unused — live `/` uses benefits/process) and placeholder cases on `/realizovani-proekty`.

## 5. Env / CORS migration plan (GATED — do NOT change now)

| Var | Service | Current | Required for cutover |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_ORIGIN` | marketing-web-rirw | `https://marketing-web-rirw-production.up.railway.app` | `https://solomiya-energy.com` |
| `CORS_ORIGINS` | sitepilot-railway (backend) | `…frontend…,marketing-web-rirw-production.up.railway.app` | **add** `https://solomiya-energy.com`,`https://www.solomiya-energy.com` (keep existing) |

Redeploy after env change: **marketing-web-rirw** (for SITE_ORIGIN) and **backend sitepilot-railway**
(for CORS). Verify after redeploy: canonical/sitemap/OG now emit `solomiya-energy.com`; lead POST
from `https://solomiya-energy.com` passes CORS (no preflight failure); `/privacy` link works.

## 6. Go / No-Go checklist

- [ ] All Tilda URLs covered: published on SitePilot **or** 301-redirected (no 404s). *(blocker: 26 not covered)*
- [ ] Homepage `/` content cleaned in prod DB (gated re-sync from `solomiya-homepage.clean.json`).
- [ ] `benefits`/`process` renderers deployed (this PR) — **after** homepage content fix.
- [ ] No visible `Блок: …`, no fake claims on any published page.
- [ ] `NEXT_PUBLIC_SITE_ORIGIN` = `https://solomiya-energy.com` (+ marketing-web redeploy).
- [ ] `CORS_ORIGINS` includes apex + www (+ backend redeploy).
- [ ] Live QA on railway domain green (pages, forms+consent, /privacy, canonical).
- [ ] Tilda content backed up (export + screenshots).
- [ ] 301 redirect infra in place for retired URLs.

**Current verdict: NO-GO** until the boxes above are checked.

## 7. Recommended OWNER GO sequence

1. **GO 1** — review + merge this PR (`fix/solomiya-domain-readiness`).
2. **GO 2** — owner supplies content for the 18 placeholder pages **or** approves 301 map.
3. **GO 3** — gated prod-DB: re-sync homepage (`solomiya-homepage.clean.json`) + publish the
   8 draft-ready pages (and any newly completed ones).
4. **GO 4** — deploy marketing-web (renderers) + backend.
5. **GO 5** — env: `NEXT_PUBLIC_SITE_ORIGIN` + `CORS_ORIGINS` (+ redeploys).
6. **GO 6** — live QA on `marketing-web-rirw-production.up.railway.app` + Tilda backup.
7. **GO 7** — DNS cutover in Cloudflare: repoint apex + www to Railway target (CNAME-flatten),
   **keep MX/SPF/TXT untouched**; add 301s.
8. **GO 8** — post-cutover QA + keep rollback window.

**Rollback:** revert apex+www records in Cloudflare to the Tilda values (TTL 300 ⇒ ~5 min).
MX/SPF never touched ⇒ email unaffected. Tilda project stays live ⇒ instant fallback.
