<!-- Post-merge handoff/status for the SitePilot × Solomiya migration after PR #39.
     Documentation only — records state; performs no import/publish/deploy/DNS/redirect. -->

# Solomiya Energy — Post-Merge Handoff

> Status snapshot after **PR #39** merged into `main`. **Review/record only** — nothing here
> imports, publishes, deploys, or mutates production. Companion: [`solomiya-project-memory.md`](./solomiya-project-memory.md).
> Date: 2026-06-28.

## 1. Technical state

- **PR #39:** merged / closed (squash) by `andriy555solar-afk`.
- **`main` head / merge commit:** `2335566180` — *"Solomiya × SitePilot: content + exact design + image migration (review-only) (#39)"* (advanced from `9ec50d0`).
- **Backend (`sitepilot-railway`):** auto-deployed via the `Deploy to Railway` workflow on push to `main` — **success**, health check passed. *(PR #39 backend changes are scripts/data/docs only — non-runtime — so this was effectively a no-op redeploy.)*
- **marketing-web (`marketing-web-rirw`):** deployed successfully and healthy (Railway native integration; not driven by the GitHub workflow, whose frontend job is `if: false`).
- **No manual deploy** performed (the deploys were the repo's automated workflow/integration reacting to the merge).
- **No DB import · no publish · no DNS · no redirects · no Railway/env changes** after verification.

## 2. Current safety state

- **31 Solomiya pages remain `status: draft`** in `main` (`backend/scripts/data/solomiya-review-drafts.json`).
- **31/31 pages remain indexed in draft metadata** (`robotsIndex: true`, canonical 1:1 on `solomiya-energy.com`).
- **`NEXT_PUBLIC_SITE_THEME` not set** → **default theme active** on the live marketing-web service.
- **Solomiya theme/code is present but gated** (renders only under `[data-theme='solomiya']`, activated by the env var) — no global re-skin.
- **No image binaries committed** (only `public/images/solomiya/README.md` + `.gitkeep` placeholders; binaries gitignored).
- **No public Solomiya content went live from this work** — public behavior is unchanged (drafts are not served; only the previously-published 5 pages remain as before).

## 3. Remaining gates before import / publish

| Gate | Status |
|------|--------|
| **57 actionable `OWNER_INPUT_REQUIRED`** across **21 pages** | ⛔ pending owner facts |
| **1 `CLAIM_REVIEW_REQUIRED`** on `/service-warranty` | ⛔ pending owner/technical confirmation |
| **Image / photo rights** | ⛔ unconfirmed (no binaries; no licensing assumed) |
| **9 sign-off-only pages** (`/ses`, `/ses/dom`, `/ses/business`, `/installation`, `/ses/ground`, `/inverters`, `/batteries`, `/solar-panels`, `/contacts`) | ⛔ awaiting owner sign-off |
| **PR #38 redirect/coverage plan** | ⛔ required before any cutover (separate PR) |
| **`sharp` runtime dep** in `marketing-web` | ⏳ add only when the first live `image`/`gallery` block ships (no-op until then) |
| **OG images** (per-page) | ⏳ add before publish (text-only OG today) |

## 4. Owner package ready to send

These are **collection tools only** — already on `main`:

- [`solomiya-owner-input-checklist.md`](./solomiya-owner-input-checklist.md)
- [`solomiya-owner-questionnaire.md`](./solomiya-owner-questionnaire.md)
- [`solomiya-questionnaire-cover.md`](./solomiya-questionnaire-cover.md)
- [`solomiya-owner-response-form.md`](./solomiya-owner-response-form.md)

Clearly:
- They are **not owner answers**.
- They **do not resolve** any `OWNER_INPUT_REQUIRED` / `CLAIM_REVIEW_REQUIRED` markers.
- **Real owner answers must be supplied** before any draft content is changed.

## 5. Next workflow after owner answers

1. Receive the **filled** `solomiya-owner-response-form.md` (or pasted answers).
2. **Parse** answers; map each to its page/path/marker.
3. **Update only confirmed** draft facts (explicit + complete answers).
4. **Keep markers + safe fallback** for anything unconfirmed/ambiguous.
5. **Validate** JSON/drafts (parse, markers, status still `draft`).
6. **Commit content updates in a separate PR** (draft) — not directly to `main`.
7. **Import to preview/staging only after explicit GO** (importer dry-run → review → `--apply`).
8. **Publish only after a separate explicit GO**.
9. **Cutover / DNS / redirects only after a separate explicit GO** and **PR #38 alignment** (keep MX/SPF/TXT).

## 6. Forbidden actions (reminder)

No import · no publish · no DNS · no redirects · no Railway/env changes · no production/staging
changes · no owner-fact fabrication · no marker removal without explicit owner confirmation.

---

### Snapshot facts (verified on `main` @ `2335566180`)
31 drafts · all `status: draft` · 31/31 indexed · 104 raw `OWNER_INPUT_REQUIRED` (= 57 actionable in
content across 21 pages + 47 `ownerInputs` mirror) · 2 raw `CLAIM_REVIEW_REQUIRED` (= 1 actionable on
`/service-warranty` + 1 mirror) · 0 image binaries · default theme active (`NEXT_PUBLIC_SITE_THEME` unset).
