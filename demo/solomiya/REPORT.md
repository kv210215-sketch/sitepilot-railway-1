# Solomiya Energy — SitePilot Staging Customer Demo

**Date:** 2026-06-15 · **Environment:** Railway `triumphant-purpose` → `staging` (as deployed, unchanged)
**Operator account:** `solomiya.demo@sitepilot.dev` / `Solomiya!Demo2026`

## Staging endpoints used
| Service | URL | State |
|---|---|---|
| Backend API | https://sitepilot-railway-staging.up.railway.app | healthy (`/health` 200, `env: staging`) |
| Admin frontend | https://sitepilot-frontend-staging.up.railway.app | live |
| Public read API | `…/public/v1/pages/*` | enabled (`PUBLIC_API_ENABLED=true`) |

No new services were provisioned. No product code was changed. Everything below was done against the live deployment.

## What was built
- **Organization:** Solomiya Energy (`solomiya-energy`)
- **Project:** **Solomiya Energy Commercial Solar** — type `solar_commercial`, slug `solomiya-energy`, domain `solomiya-energy.com`
- **Landing page:** **«Сонячні електростанції для бізнесу у Львові»**, path `/ses-dlya-biznesu-lviv`
- **Ukrainian content:** 6 conversion-structured blocks the live renderer supports — `hero → numbers → pain → steps → guarantees → cta` (audience/offers/faq block types render empty on the currently-deployed renderer, so they were intentionally omitted for a clean page).
- **SEO:** UA meta title/description, OG tags, keywords, `robotsIndex/Follow=true`, canonical `https://solomiya-energy.com/ses-dlya-biznesu-lviv`. Editor SEO score: **90**.

## Publish (real flow)
- `POST /api/v1/projects/:id/publish` (scope=project) → job **success**, **1/1 pages**, ~0.5s.
- Page status → **Опубліковано (published)**, `publishedAt` set, appears in sitemap.
- Publish queue: **2 jobs, 100% success rate** (page was re-published once during content iteration).

## Public URL verification
- **Live public JSON API:** `GET https://sitepilot-railway-staging.up.railway.app/public/v1/pages/ses-dlya-biznesu-lviv` → **200**, returns title, SEO, canonical, and content blocks.
- **Rendered HTML:** verified via the backend page renderer (in-app preview + standalone HTML). Title, layout, and all 6 sections render correctly in Ukrainian.
- **Sitemap:** `GET /public/v1/sitemap-entries` → 1 entry for the published page.

> Note: a styled *public website* (the `marketing-web` service) is **not** deployed in this staging environment, so the published page's public surface here is the backend public API + the rendered HTML, not a separate public domain.

## Lead flow — WORKS (correction to earlier scoping)
Earlier I scoped lead capture as not demonstrable, believing it required the undeployed `marketing-web` site. **That was wrong.** The deployed staging actually ships a complete leads feature:
- **`POST /public/v1/leads` → 201** — public, no-auth lead capture (exactly what a page form posts to).
- **`GET /api/v1/projects/:id/leads` → 200** — admin **Ліди** inbox with a status pipeline (Нові / На зв'язку / Кваліфіковані / Конвертовані / Архів / Спам).

Demo lead submitted through the public endpoint and verified in the Leads inbox:
- **Олександр Петренко**, +380671234567, o.petrenko@lvivsklad.ua
- Message: «Цікавить СЕС ~120 кВт для складського комплексу у Львові. Який строк окупності та чи є фінансування?»
- Source `public_form`, page `/ses-dlya-biznesu-lviv`, status **Новий**.

The Leads inbox also shows 2 earlier test/probe records (one bare connectivity probe, one with mangled encoding from a shell submission). The deployed leads controller exposes only list + public-submit (no delete/patch), so those test records can't be removed from staging.

## Activity & metrics
- **Activity (audit) feed:** `publish_started` + `publish_success` entries (×2 cycles), attributed to the operator.
- **Dashboard:** Проєкти 1 · Сторінки 1 · Публікацій 2 · Помилки 0 · Успішність публ. 100% · Середній час 0.5s.

## Screenshots (`artifacts/shots/`)
1. `01-login` — staging login
2. `02-dashboard` — live metrics
3. `03-projects` — project list
4. `04-pages` — page list (Опубліковано, SEO 90)
5. `05-editor` — block editor (Hero/Numbers/Pain + SEO tab)
6. `06-app-preview` — in-app rendered preview (Desktop/Tablet/Mobile)
7. `07-publish` — publish queue (2 jobs, 100%)
8. `08-activity` — activity log
9. `09-rendered-public-page` — full rendered Ukrainian landing page
10. `10-public-api-json` — live public API response
11. `11-leads` — Leads inbox with the captured Ukrainian lead

## Reproduce
- `node demo/solomiya/run-demo.mjs` — full backend flow (auth → org → project → page → content → publish → verify).
- `node demo/solomiya/screenshots.mjs` — UI + rendered-page screenshots.

## Result
| Field | Value |
|---|---|
| DEMO_READY | YES |
| PUBLIC_URL | https://sitepilot-railway-staging.up.railway.app/public/v1/pages/ses-dlya-biznesu-lviv |
| LEAD_FLOW | WORKING (public submit → Leads inbox) — *was scoped N/A, corrected* |
| SCREENSHOTS | 11 in `demo/solomiya/artifacts/shots/` |
