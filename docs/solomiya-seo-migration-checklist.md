# Solomiya Energy — SEO Migration Checklist (content integration)

> **Scope:** SEO readiness of the **31 integrated review-drafts** (`backend/scripts/data/solomiya-review-drafts.json`)
> and how marketing-web emits sitemap / canonical / meta / OG for them.
> **In-PR companion:** `docs/solomiya-image-migration-plan.md` (image SEO).
> **External planning artifact (NOT part of this PR):** the per-URL keep/redirect/retire map + cutover options
> live in a separate planning PR as `SOLOMIYA_URL_COVERAGE_AND_REDIRECT_PLAN.md`. This checklist is self-contained
> for the content-integration scope; that redirect plan should be available/landed **before** any publish or cutover.
> Not duplicated here on purpose.
> **Status:** review-only. No publish, no DNS, no redirect infra created here.

## 1. 31 URLs preserved 1:1

Every Tilda indexed URL maps to a draft at the **same path**, all `status: draft`, `robotsIndex: true`.
Verified across all 31 drafts:

| Check | Result |
|-------|--------|
| Pages | 31 / 31 |
| `robotsIndex: true` | 31 / 31 |
| `canonical` present | 31 / 31 (all host `solomiya-energy.com`) |
| `metaTitle` present | 31 / 31 |
| `metaDescription` present | 31 / 31 |
| `h1` present | 31 / 31 |
| Path == Tilda path | 31 / 31 (no slug changes) |

No indexed URL is renamed, merged, or dropped → **no mass 301s for indexed URLs**. 301s are reserved
strictly for non-indexed / service / duplicate / retired URLs per the redirect plan §6.

## 2. How marketing-web emits SEO (already wired)

The catch-all renderer drives all of this from page data — no per-page code:

- **Canonical** — `lib/seo/metadata.ts` → `alternates.canonical` from `page.canonical` (`safeCanonical`).
- **Title / description** — `metaTitle` / `metaDescription` → `<title>` + `<meta name=description>`.
- **Robots** — `robotsIndex` / `robotsFollow` → `<meta name=robots>`; unknown paths render **noindex + 404** (`not-found`).
- **OpenGraph** — `openGraph.url` = canonical, type/title/description set in `metadata.ts`.
- **Homepage hreflang** — `uk-UA` + `x-default` alternates for `isHomepage`.
- **JSON-LD** — `lib/seo/json-ld.ts` emits Organization/WebPage using the canonical URL.
- **Sitemap** — `app/sitemap.ts` (`buildSitemapRoute`) is **dynamic**, generated from published backend
  pages — so the sitemap auto-tracks whatever is published (no hand-maintained list to drift).
- **robots.txt** — `app/robots.ts`.

**Implication:** SEO correctness for these 31 URLs needs **no extra code** — it follows automatically
once each draft is imported and published (both gated, owner-approved steps).

## 3. Content-quality SEO fixes applied (safe, no fabrication)

- `/batteries` `metaTitle` was a malformed 156-char description sentence (migration artifact). Replaced with a
  proper ~68-char title built only from terms already on the page (`СЕС`, `Львів`, `Deye/Dyness/Pytes`) following
  the sibling-page pattern `… | Solomiya Energy`. The clean `h1` was already correct and is unchanged.

## 4. Deliberately NOT changed (preserve real indexed text)

- **21 `metaDescriptionSource: tilda`** descriptions are the **real currently-indexed** text — kept **1:1**.
  Minor length deviations (a handful 161–185 chars; some titles 61–81) are **left as-is**: they're real ranking
  text, and over-Google's-display-width is a truncation cosmetic, not a penalty. Rewriting them to AI copy would
  risk ranking and violates the "don't replace real SEO text without need" rule. Flagged below as owner-optional.
- **10 `rewritten`** descriptions were already tightened during drafting; not re-touched.

## 5. Owner-optional (not blocking, not auto-changed)

`[OWNER_INPUT_REQUIRED]` length tuning — optional, only if the owner wants display-width-perfect snippets:
titles > 60 chars (≈9 pages) and meta descriptions > 158 chars (≈8 pages). Leave the real Tilda text unless
the owner explicitly asks to shorten. None block migration.

## 6. Pre-cutover checklist (ties to redirect plan)

- [ ] Import 31 drafts to backend as `draft` (gated) → review → publish (gated).
- [ ] Confirm published sitemap lists the intended indexed set (dynamic, auto-built).
- [ ] Confirm each published page's canonical = `https://solomiya-energy.com/<path>` (1:1).
- [ ] Add OG images per page (ties to `solomiya-image-migration-plan.md`; OG currently text-only).
- [ ] Stand up 301 infra for the non-indexed/duplicate set **only** (redirect plan §6, separate code PR).
- [ ] Submit refreshed sitemap to Search Console **after** DNS cutover (separate owner GO).

## 7. Guardrails honored

31 indexed URLs preserved 1:1 · no mass 301 for indexed URLs · no 404 introduced · no DNS change ·
real Tilda SEO text preserved · no publish · no DB import.
