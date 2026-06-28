# Solomiya Energy — Image Migration Plan (Tilda → self-hosted `marketing-web`)

> **Status:** review-ready plan + tooling. **No image binary is committed; no asset is
> published.** All steps are local and owner-gated.
> **Date:** 2026-06-28 · **Decision (owner-locked):** Option B — self-host & optimize.
> **Source data:** read-only crawl of the 31 indexed live URLs (`solomiya-energy.com`, Tilda apex behind Cloudflare).

## 1. Inputs / artifacts

| Artifact | Path | What it is |
|----------|------|-----------|
| Manifest | `backend/scripts/data/solomiya-image-manifest.json` | 150 logical assets (148 self-host, 2 skip), per-asset source URL, category, dims, target path, optimize directive |
| Download | `backend/scripts/download-solomiya-images.mjs` | Dry-run-by-default fetch of originals → gitignored `/.solomiya-image-import/` |
| Optimize | `backend/scripts/optimize-solomiya-images.mjs` | AVIF+WebP responsive encode (sharp-optional; graceful fallback to checklist) |
| Target | `marketing-web/public/images/solomiya/{hero,bg,projects,equipment,brands,icons}/` | Self-hosted set, served via `next/image` |

## 2. Inventory (from crawl)

| Metric | Value |
|--------|-------|
| Pages crawled | 31 / 31 |
| Image references (url × page) | 500 |
| Unique image URLs (incl. size variants) | 312 |
| **Logical assets after dedupe** | **150** |
| Self-host | 148 |
| Skip (Tilda system) | 2 |
| Total original weight | ~38.25 MB |
| Content-types | 250 JPEG · 41 PNG · 21 SVG |
| Oversized (≥ 300 KB) | 36 |

By category: project 75 · background 41 · card 15 · icon 12 · hero 3 · logo 1 · brand 1 · system 2 (skip).

## 3. The single biggest win — the logo (RESOLVED in design)

`solomiya_WEB_monochr.svg` is **1.49 MB and loaded on all 31 pages** — an SVG wrapping an
embedded base64 bitmap, not true vector, sitting in the critical render path on 100% of pages.

**Resolution:** the Solomiya theme (`marketing-web/components/SiteChrome.tsx`, shipped on this
branch) renders a **text brand** from `NEXT_PUBLIC_SITE_NAME` — the heavy logo is **not migrated
at all**. Estimated saving: **~1.45 MB × every page view**. If a graphical mark is later required,
ship a real ~15–40 KB vector or tuned PNG into `public/images/solomiya/` — never the base64 SVG.

## 4. Optimization strategy

- **Format:** AVIF (primary) + WebP (fallback) via `next/image`; photographic PNGs are **never**
  re-hosted as PNG. True vector SVG / icons are kept as-is.
- **Widths:** 640 / 960 / 1280 / 1920, served by `next/image` `srcset`/`sizes`; never upscale.
- **Hero/LCP:** `priority` on `/`, `/ses`, `/ses/dom` heroes; fix the logo first (done).
- **CLS:** always set explicit `width`/`height` (or `aspect-ratio`) — enforced by `next/image`.
- **Lazy:** everything below the fold (`loading="lazy"`, the `next/image` default).
- **Measured result:** validated on a real hero asset — `nuno-marques…jpg` 248 KB → **AVIF 45 KB
  (−82%)**, WebP 73 KB (−71%). Manifest estimate for the whole self-host set: **~38.25 MB → ~9.6 MB
  (~75% reduction)**.

## 5. Source preference

1. **Local originals first** — prefer `D:\Photos\фото робіт СЕС` (43 real SES photos) and
   `D:\Photos\фото брендів` (7 vendor logos) over Tilda-recompressed copies where the same shot exists.
2. **Tilda originals** for everything else used by the 31 URLs (download script handles this).
3. **One original per logical asset** — do **not** migrate `/-/resize/…`, `/-/cover/…` size variants;
   `next/image` regenerates widths (312 URLs → 150 originals ≈ 52% fewer files to host).

## 6. Skip list

- `tildacopy_black.png` ("Made on Tilda" badge) — drop entirely.
- Tilda UI sprite / system SVGs — drop; use own icons.
- Duplicate Tilda size variants — keep one origin, let `next/image` regenerate.

## 7. Runbook

```bash
# 1. (already done) manifest is generated and committed
# 2. fetch originals into the gitignored import dir (review the plan first)
node backend/scripts/download-solomiya-images.mjs            # dry-run / plan
node backend/scripts/download-solomiya-images.mjs --apply    # actually download

# 3. encode AVIF+WebP into public/images/solomiya/** (sharp optional)
cd marketing-web && npm i -D sharp && cd ..
node backend/scripts/optimize-solomiya-images.mjs            # dry-run -> writes checklist
node backend/scripts/optimize-solomiya-images.mjs --apply    # actually encode

# 4. wire `image`/`gallery` blocks in CMS content (renderer already supports them)
#    BEFORE going live with image blocks: add `sharp` to marketing-web *runtime*
#    dependencies — next/image's production optimizer (next start) requires it.
cd marketing-web && npm i sharp && cd ..
```

> **next/image + sharp:** step 3's `npm i -D sharp` installs sharp only for the offline
> optimize *script*. The marketing-web `image`/`gallery` block renderer uses `next/image`,
> whose **production** image optimizer (`next start`) needs `sharp` as a regular dependency.
> No current draft emits image blocks, so nothing is required today — but **before the first
> live image block**, add `sharp` to `marketing-web` dependencies (`npm i sharp`). Until then
> this is a no-op.

## 8. Risks / owner decisions

- `[OWNER_INPUT_REQUIRED]` **Licensing** — several stock/AI files (`photo-1670…`, `ChatGPT_Image…`,
  `nuno-marques…`) need rights confirmation before re-hosting. Prefer owned SES photos for case/hero.
  Until cleared, optimized binaries stay **gitignored** (not committed, not published).
- **Broken tildacdn links (highest):** every `src=…tildacdn…` dies when the Tilda subscription/page
  is removed. Self-host **before** any cutover; **never** leave hero/LCP external.
- **SEO image indexing:** image host/path changes — refresh `<img alt>`, image sitemap, and 301 old
  indexed image URLs where feasible (ties into the URL/redirect plan).
- **CLS:** enforce width/height on every migrated image.

## 9. Guardrails honored

No DB import · no publish · no DNS · no Railway/env change · no deploy · no binary committed ·
Tilda system assets skipped · no external tildacdn left as a production hero/LCP decision.
