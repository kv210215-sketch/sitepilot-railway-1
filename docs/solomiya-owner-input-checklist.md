<!-- Pre-import / pre-publish gate checklist for the Solomiya migration (PR #39).
     Documentation only — creating/reading this performs no import/publish/deploy/DNS.
     Source of truth for markers: backend/scripts/data/solomiya-review-drafts.json. -->

# Solomiya Energy — Owner Input Checklist

> Pre-import / pre-publish artifact for **PR #39** (`solomiya/integration-content-design-assets`).
> Companion docs: [`solomiya-project-memory.md`](./solomiya-project-memory.md) (runbook),
> [`solomiya-image-migration-plan.md`](./solomiya-image-migration-plan.md),
> [`solomiya-seo-migration-checklist.md`](./solomiya-seo-migration-checklist.md).
> **Nothing here imports, publishes, deploys, or mutates production.** Compiled from the actual
> markers in `backend/scripts/data/solomiya-review-drafts.json` — no facts invented.

## 1. Current PR status

- **PR #39 is ready-for-review / OPEN / unmerged.** Base `main` ← `solomiya/integration-content-design-assets`.
- Current known head: **`c3ab415`** (later docs-only commits may advance it — check `git log`).
- **No import, publish, deploy, Railway/env, DNS, redirect, DB, or staging/production action has been taken.**
- This checklist is a **pre-import / pre-publish** artifact: it lists exactly what the owner must
  supply or confirm before any page can move from `draft` → published.

### Marker reconciliation (accurate counts)

| Measure | Count | Notes |
|---------|------:|-------|
| Raw `OWNER_INPUT_REQUIRED` token occurrences | 104 | = **57** in page `content` + **47** mirrored in per-page `ownerInputs` summary arrays |
| **Actionable owner-input markers (in page content)** | **57** | across **21 pages** |
| Raw `CLAIM_REVIEW_REQUIRED` token occurrences | 2 | = **1** in `content` + **1** in `ownerInputs` summary |
| **Actionable claim-review markers** | **1** | on `/service-warranty` |
| Pages with **no** markers (content-complete; sign-off only) | **9** | `/ses`, `/ses/dom`, `/ses/business`, `/installation`, `/ses/ground`, `/inverters`, `/batteries`, `/solar-panels`, `/contacts` |
| **Total drafts** | **31** | all `status: draft`, all `robotsIndex: true` |

So **21 pages are blocked on owner facts, 1 page on a claim, and 9 pages are ready pending owner sign-off.**

## 2. Non-negotiable safety gates

- **No fabrication of facts** (no invented power, generation, area, savings, payback, prices, models, cases, photos, certificates).
- **No replacing `OWNER_INPUT_REQUIRED`** with guessed/placeholder data.
- **No resolving `CLAIM_REVIEW_REQUIRED`** without owner confirmation or documentary evidence.
- **No importing pages into the DB** without explicit owner GO.
- **No publishing pages** without explicit owner GO.
- **No redirects / DNS / cutover** without explicit owner GO.
- **No image binaries committed** until licensing is confirmed.
- **No `sharp` dependency** added until the first live `image`/`gallery` block actually ships.
- **Markers stay in source** — this task does not remove `OWNER_INPUT_REQUIRED` / `CLAIM_REVIEW_REQUIRED`.

## 3. Page-by-page owner input table

Marker text below is quoted from `content` blocks. Grouped by archetype where markers repeat
identically. Publish readiness: **Blocked** (needs owner facts), **Needs review** (claim/sign-off),
**Ready after confirmation** (content complete, owner sign-off only).

### 3a. Homepage — featured case

| Page | Markers | Missing fact | Why it matters | Required owner answer | Safe fallback (no answer) | Readiness |
|------|--------:|--------------|----------------|-----------------------|---------------------------|-----------|
| `/` | 4 | реальний реалізований проєкт — тип об'єкта · місто/район · потужність, кВт · підтверджений результат + фото | Homepage case block needs ONE real project; fake cases = trust/legal risk | 1 real project: object type, city/district, kW, confirmed result, photo | Remove the case block (or show "проєкти — за запитом") until a real case + photo exists | **Blocked** (needs-photos-cases) |

### 3b. Power tiers — `/ses/{5,10,20,30,50}kw` (4 markers each, same pattern)

| Pages | Markers (per page) | Missing fact | Why it matters | Required owner answer | Safe fallback | Readiness |
|-------|-------------------|--------------|----------------|-----------------------|---------------|-----------|
| `/ses/5kw`, `/ses/10kw`, `/ses/20kw`, `/ses/30kw`, `/ses/50kw` | реальна річна генерація кВт·год · реальна площа панелей/даху · реальна економія/зниження рахунку · конкретні моделі панелей+інвертора+АКБ у комплекті + ціна | Per-kW generation, roof area, savings, kit components & price | Specific kWh/area/savings/prices are conversion-critical AND high-risk if wrong (ROI/payback claims) | Per tier: real annual kWh, panel/roof area, savings basis, kit models (panel/inverter/battery) + price | Keep figures as "за індивідуальним розрахунком" / "склад комплекту уточнюйте у менеджера"; do NOT publish specific kWh/price until confirmed | **Blocked** ×5 |

### 3c. Inverter subcategories — `/inverters/{hybrid,grid,offgrid,backup}` (1 marker each)

| Pages | Marker | Missing fact | Why it matters | Required owner answer | Safe fallback | Readiness |
|-------|--------|--------------|----------------|-----------------------|---------------|-----------|
| `/inverters/hybrid`, `/inverters/grid`, `/inverters/offgrid`, `/inverters/backup` | моделі та характеристики [type] інверторів у наявності | In-stock models + specs per inverter type | Catalog credibility; avoid listing models not actually sold | Models actually offered per type + key specs + availability | "Моделі та наявність уточнюйте у менеджера" (generic, no fake model list) | **Blocked** ×4 |

### 3d. Inverter vendor pages — `/inverters/{deye,huawei}` (1 marker each)

| Pages | Marker | Required owner answer | Safe fallback | Readiness |
|-------|--------|-----------------------|---------------|-----------|
| `/inverters/deye`, `/inverters/huawei` | конкретні моделі [Deye/Huawei] + характеристики + наявність | Specific Deye/Huawei models + specs + availability | Generic brand description + "моделі уточнюйте у менеджера" | **Blocked** ×2 |

### 3e. Battery subcategories — `/batteries/{lv,hv}` (1 marker each)

| Pages | Marker | Required owner answer | Safe fallback | Readiness |
|-------|--------|-----------------------|---------------|-----------|
| `/batteries/lv`, `/batteries/hv` | моделі та характеристики [LV/HV] акумуляторів у наявності | In-stock LV/HV battery models + specs | "Моделі та ємності уточнюйте у менеджера" | **Blocked** ×2 |

### 3f. Battery vendor pages — `/batteries/{dyness,pytes}` (1 marker each)

| Pages | Marker | Required owner answer | Safe fallback | Readiness |
|-------|--------|-----------------------|---------------|-----------|
| `/batteries/dyness`, `/batteries/pytes` | конкретні моделі [Dyness/Pytes] + ємність + характеристики + наявність | Specific models + capacity + specs + availability | Generic brand description + "уточнюйте у менеджера" | **Blocked** ×2 |

### 3g. Panels & mounting & kits

| Page | # | Markers | Required owner answer | Safe fallback | Readiness |
|------|--:|---------|-----------------------|---------------|-----------|
| `/solar-panels-longi` | 3 | моделі Longi у наявності + потужність (Вт) · ключові характеристики (тип елемента, ККД, габарити) · наявність та орієнтовна ціна за панель/кВт | Real Longi models + Wp + specs + price/availability | Generic Longi description; price "за запитом"; no specific Wp/price | **Blocked** |
| `/sonyachni-paneli-dlya-domu` | 2 | рекомендовані моделі для дому (бренд + Вт + характеристики) · наявність та орієнтовна ціна | Recommended home-panel models + Wp + price/availability | "Підбір панелей — за індивідуальною консультацією" | **Blocked** |
| `/kriplennia` | 3 | системи кріплення для скатного даху · для плаского/баластні + сумісність · наземні конструкції + наявність | Mounting systems (mfr/series) per roof type + ground + compatibility | Generic mounting description; "сумісність уточнюйте у менеджера" | **Blocked** |
| `/komplekty-rezervnoho-zhyvlennia` | 3 | склад базового комплекту (інвертор+АКБ+автоматика) + ціна · склад розширеного + потужність/ємність + ціна · наявність та строки | Base + extended kit composition, power/capacity, price, lead time | Describe kits generically; price/lead-time "за запитом"; no fixed price | **Blocked** |

### 3h. Portfolio — `/realizovani-proekty` (12 markers)

| Page | # | Marker (repeated) | Required owner answer | Safe fallback | Readiness |
|------|--:|-------------------|-----------------------|---------------|-----------|
| `/realizovani-proekty` | 12 | реальний проєкт — об'єкт, місто, потужність кВт, результат, фото | Up to 12 real projects: object, city, kW, result, photo (real photos only) | Show fewer real cases, or "галерея проєктів — у процесі наповнення"; never fabricate cases/photos | **Blocked** (needs-photos-cases) |

### 3i. Ready-after-sign-off (no markers, content-complete)

| Pages | Readiness |
|-------|-----------|
| `/ses`, `/ses/dom`, `/ses/business`, `/installation`, `/ses/ground`, `/inverters`, `/batteries`, `/solar-panels`, `/contacts` | **Ready after confirmation** — owner sign-off only; no missing facts. (`/` and the catalog leaves above still depend on these hubs for internal links.) |

## 4. Claim review section

| Page | Claim (paraphrase) | Confirmation needed | Type of proof | Safe replacement if unverifiable |
|------|--------------------|---------------------|---------------|----------------------------------|
| `/service-warranty` | FAQ answer "Чи можливий ремонт без демонтажу пристрою?" → marker: **"підтвердити перелік випадків ремонту без демонтажу"** | Confirm which repair cases are genuinely done **without dismantling** the device | **Owner / technical confirmation** (service practice); supplier/warranty documentation if it asserts on-site repair terms | Keep the already-safe hedge: *"Можливість ремонту на місці залежить від характеру несправності. Це визначається за результатами діагностики."* — and **drop the specific "перелік випадків"** until confirmed. Do not assert specific on-site-repair guarantees. |

> The surrounding answer is already conservatively worded; the marker only asks to confirm a
> specific list of "repair-without-dismantling" cases. **Do not delete the marker from source in
> this task** — resolution requires owner/technical confirmation.

## 5. Image licensing section

- **Folders/placeholders present (tracked):** `marketing-web/public/images/solomiya/{hero,bg,projects,equipment,brands,icons}/` — each a `.gitkeep` (0 bytes) + a `README.md`. **No image binaries committed.**
- **Manifest:** `backend/scripts/data/solomiya-image-manifest.json` — 150 logical assets (148 self-host, 2 Tilda system assets skipped). Metadata only (no embedded image data).
- **Scripts (previously audited safe):** `download-solomiya-images.mjs` (dry-run by default; `--apply` is GET-only fetch into a **gitignored** import dir, never the tree) and `optimize-solomiya-images.mjs` (local AVIF/WebP, sharp-optional with checklist fallback). **No upload / publish / deploy.**
- **Licensing confirmation needed before any binary is committed/self-hosted:**
  - Which sources are owner-owned vs stock/AI (the crawl flagged stock/AI files: `photo-1670…`, `ChatGPT_Image…`, `nuno-marques…`).
  - **Acceptable sources:** owner's own SES installation photos (preferred), vendor-official brand logos, properly-licensed stock with proof.
  - **Proof to store:** license/receipt or "owned by Solomiya" attestation per asset (keep alongside the manifest).
- **Still blocked until licensing is confirmed:** committing optimized AVIF/WebP binaries; relaxing the `.gitignore` image rules; using hero/case images. **Logo:** the 1.49 MB base64-in-SVG logo is **not** migrated — a text brand is used (no action needed unless a real vector logo is supplied).
- **Do not:** upload, publish, or deploy any image; do not commit any image binary until licensing is confirmed.

## 6. SEO & redirect / cutover section

- **31 indexed URLs stay 1:1** — all drafts `robotsIndex: true`, canonical on `solomiya-energy.com`, paths == Tilda. No renaming/merging.
- **No redirect / 404 code exists in PR #39** — the 301 strategy is **docs-only**. 301s are reserved for non-indexed / duplicate / service / retired URLs.
- **External dependency:** `SOLOMIYA_URL_COVERAGE_AND_REDIRECT_PLAN.md` (the per-URL keep/redirect/retire map) lives in **separate planning PR #38** — **not** modified by this task and **not** part of PR #39. It must be aligned/landed **before** any DNS cutover.
- **Do not create 301 redirects from this task.**

### Pre-cutover checklist (do NOT execute without explicit GO)
- [ ] Owner facts complete (Section 3 resolved on pages to be published).
- [ ] Claim resolved (`/service-warranty`, Section 4).
- [ ] Images licensed + optimized + committed; OG images added.
- [ ] Draft import to staging done and **preview QA** passed.
- [ ] Redirect/coverage map (PR #38) confirmed; 0×404 modelled.
- [ ] Canonical / robots / sitemap verified to emit `solomiya-energy.com`.
- [ ] DNS / cutover **explicitly approved** (keep MX / SPF / TXT untouched).

## 7. Import / publish readiness matrix

| Area | Current status | Blocker? | Required action | Owner needed? |
|------|----------------|:--------:|-----------------|:-------------:|
| Owner facts | 21 pages, 57 markers open | **Yes** | Provide facts per Section 3 | **Yes** |
| Claim review | 1 open (`/service-warranty`) | **Yes** | Confirm repair-without-dismantling cases | **Yes** |
| Images / licensing | binaries gitignored; unconfirmed | **Yes** | Confirm licensing → download/optimize/commit | **Yes** |
| OG images | text-only OG today | Soft | Add per-page OG before publish | Partly (assets) |
| `sharp` | not a dep | Soft | Add only when first live image block ships | No |
| Redirect / cutover plan | external (PR #38), docs-only | **Yes (for cutover)** | Align/land PR #38 before DNS | **Yes (GO)** |
| Draft import (→ staging) | not done | Gated | Importer dry-run → review → `--apply` | **Yes (GO)** |
| Preview QA | not done | Gated | Preview on staging, QA | **Yes (GO)** |
| Publish | none | Gated | Publish ready pages only | **Yes (GO)** |
| DNS / cutover | not done | Gated | Cloudflare repoint (keep MX/SPF/TXT) | **Yes (GO)** |

## 8. Recommended next autonomous (safe) steps

- ✅ Done here: gather all owner markers into one table (Section 3).
- Prepare an **owner questionnaire** (one question per marker group) for fast turnaround. *[docs, safe]*
- Prepare **safe fallback copy** snippets (the "Safe fallback" column) so ready pages can publish
  without specific claims if the owner defers. *[docs, safe]*
- Prepare a **preview QA checklist** (theme renders, lead form works, canonical/robots, no
  `Блок: …`, no markers visible). *[docs, safe]*
- **Monitor PR #39 review comments**; summarize any that appear. *[read-only]*

> **Not** recommended autonomously: merge, draft import, publish, DNS/cutover — all require explicit owner GO.

## 9. Forbidden actions (reminder)

No merge · no deploy · no Railway/env change · no DNS change · no DB import · no publish · no
redirect creation · no staging/production change · no speculative content replacement · no
fabrication of owner facts · no image-licensing assumptions · do not remove
`OWNER_INPUT_REQUIRED` / `CLAIM_REVIEW_REQUIRED` markers from source.
