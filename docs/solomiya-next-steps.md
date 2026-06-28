<!-- Short operational checklist. Full context: docs/solomiya-project-memory.md -->

# Solomiya — Next Steps (operational checklist)

> Full runbook: [`docs/solomiya-project-memory.md`](./solomiya-project-memory.md).
> **[safe]** = read-only/local/docs, do freely. **[GATED]** = needs explicit owner GO.

1. **Review PR #39** (`solomiya/integration-content-design-assets`, draft). [safe]
2. **Confirm image licensing** — which stock/AI source images may be self-hosted. [owner input]
3. **Fill owner facts** for `[OWNER_INPUT_REQUIRED]` pages (~20 catalog/spec) and resolve
   `/service-warranty` `[CLAIM_REVIEW_REQUIRED]`. Never fabricate. Pages stay `draft`. [safe-content]
4. **Re-run validation** (tsc, lint, both builds, validate:seo, importer dry-run). [safe]
5. **Add `sharp`** to `marketing-web` deps before any live image block. [safe-when-go]
6. **Import drafts to staging only after approval** (importer dry-run → review → `--apply`). [GATED]
7. **Preview on staging** and QA. [GATED]
8. **Publish ready pages only after approval.** [GATED]
9. **Set env** `NEXT_PUBLIC_SITE_THEME=solomiya` (+ optional `NEXT_PUBLIC_SITE_NAME/_PHONE/_EMAIL`). [GATED]
10. **DNS / cutover only after final GO** (Option B: minimal cutover + 301s; keep MX/SPF/TXT). [GATED]

**Do NOT** deploy, import to DB, publish, change Railway env, change DNS, or merge PR #39 without
an explicit, separate owner approval.
