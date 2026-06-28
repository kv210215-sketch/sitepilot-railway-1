# Solomiya self-hosted images

Target location for Solomiya Energy's self-hosted, optimized images, served via
`next/image` from `marketing-web`. **Greenfield:** `marketing-web` ships zero images
today and references none — this scaffold is where the migrated set lands.

## Layout

| Dir | Holds |
|-----|-------|
| `hero/` | Site-wide hero / LCP photos (`priority`) |
| `bg/` | Section / background images |
| `projects/` | Real SES installation & case photos (prefer local originals) |
| `equipment/` | Per-product / category card images |
| `brands/` | Equipment vendor logos (prefer official vendor SVG) |
| `icons/` | Small UI SVGs (kept as vector) |

There is intentionally **no `logo/`**: the 1.49 MB `solomiya_WEB_monochr.svg` (an SVG
wrapping a base64 bitmap, loaded on all 31 pages) is **not migrated**. The Solomiya theme
renders a **text brand** (`NEXT_PUBLIC_SITE_NAME`) in `components/SiteChrome.tsx` instead —
saving ~1.45 MB per page view. Ship a real ~15–40 KB vector only if a graphical mark is needed.

## How assets get here (all local, owner-gated)

1. `backend/scripts/data/solomiya-image-manifest.json` — the 150-asset migration manifest
   (148 self-host, 2 Tilda system assets skipped), derived from a read-only crawl of the
   31 indexed live URLs.
2. `node backend/scripts/download-solomiya-images.mjs --apply` — fetch originals into the
   gitignored `/.solomiya-image-import/` (never into this tree).
3. `(cd marketing-web && npm i -D sharp)` then
   `node backend/scripts/optimize-solomiya-images.mjs --apply` — encode AVIF (primary) +
   WebP (fallback) at responsive widths (640/960/1280/1920) into these folders.

See `docs/solomiya-image-migration-plan.md` for the full plan, priorities, and risks.

## Why image binaries are gitignored here

`.avif/.webp/.png/.jpg/.jpeg` under this directory are **not committed** (see root
`.gitignore`). Reasons: (a) the optimized set is reproducible from the manifest + scripts;
(b) licensing of several stock/AI-generated source files is **unconfirmed**
(`[OWNER_INPUT_REQUIRED]` — see plan §Risks) — they must not be re-hosted until cleared;
(c) keeps the repo/PR lean. Only this README + `.gitkeep` placeholders are tracked.
Once the owner confirms licensing and the asset set is final, the `.gitignore` rules can be
relaxed to commit the approved optimized images.
