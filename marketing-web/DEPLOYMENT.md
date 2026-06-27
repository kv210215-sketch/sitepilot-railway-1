# marketing-web — Deployment notes & PR checklist

This app is the **public marketing site** for Solomiya Energy. It renders
published pages from the backend public read API and submits leads to it.
It is **additive** — it does not modify the backend `leads` / `public` / CRM /
dashboard implementation, and adds no database migrations.

## Deploy order (important)

1. **Deploy the backend first (or together).** This release adds two
   **additive, non-breaking** fields to the backend `PublicPageDto`
   (`projectId`, `pageId`). The marketing-web lead form requires `projectId`.
   If marketing-web runs against a backend **without** these fields,
   `projectId` is `undefined` and every lead form shows
   "Сервіс тимчасово недоступний" and submits nothing.
2. Then deploy / start marketing-web.

> **DEPLOY_ORDER:** backend (with additive `PublicPageDto`) → marketing-web.

## Backend env (existing service)

- **`CORS_ORIGINS` must include the marketing-web public origin**
  (e.g. `https://www.solomiya-energy.com`), or set `*` for open CORS.
  The lead POST is a **client-side cross-origin** request from the browser;
  without the origin allow-listed, the browser blocks it (CORS preflight) and
  the form silently fails to submit.
- `PUBLIC_API_ENABLED=true` (gates `/public/v1/*`, incl. the lead endpoint).
- `PUBLIC_DEFAULT_PROJECT_SLUG=solomiya-energy` (already the default).

## marketing-web env (this service)

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_PUBLIC_API_URL` | **yes** | Backend public API base, no trailing slash (e.g. `https://api.solomiya-energy.com`). Used for page fetch + lead POST. |
| `NEXT_PUBLIC_SITE_ORIGIN` | **yes** | Public site origin for canonical / sitemap / robots (e.g. `https://www.solomiya-energy.com`). |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | optional | GA4 measurement id. Unset → analytics off. |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | optional | Search Console verification token. Unset → no meta tag. |

## Health check

- Railway `healthcheckPath = "/health"` (see `railway.toml` + `app/health/route.ts`).
- **Do not** use `/` — the homepage is `force-dynamic` and returns **404** when
  the public API is unreachable or no homepage is published, which would fail
  the health check and trigger a restart loop.

## Content seeds (run once, after backend + project exist)

Idempotent, safe to re-run. They require the `solomiya-energy` project and a
published homepage to already exist; otherwise they no-op safely.

```
node backend/scripts/seed-solomiya-conversion-blocks.mjs   # calculator + form on homepage
node backend/scripts/seed-solomiya-city-pages.mjs          # 8 city landing pages
node backend/scripts/seed-solomiya-commercial-pages.mjs    # 6 commercial landing pages
```

## Pre-merge checklist

- [ ] Backend deploys/upgrades first (additive `PublicPageDto`).
- [ ] `CORS_ORIGINS` includes the marketing-web public origin.
- [ ] marketing-web env set: `NEXT_PUBLIC_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_ORIGIN`.
- [ ] `healthcheckPath = "/health"` (not `/`).
- [ ] Smoke: `GET /public/v1/pages/` returns `projectId`; lead POST returns 201;
      `GET /health` on marketing-web returns 200; sitemap.xml lists city/commercial pages.
