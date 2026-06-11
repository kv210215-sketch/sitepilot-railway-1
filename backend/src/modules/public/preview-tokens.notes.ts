/**
 * P0 — Preview safety (documentation only; no runtime implementation).
 *
 * Planned flow (POST-LR, not P0):
 * 1. Operator: POST /api/v1/projects/:projectId/pages/:pageId/preview-token (JWT)
 * 2. Backend: HMAC(projectSecret, pageId, exp) → short-lived token
 * 3. GET /public/v1/preview/:token → PublicPageDto with forced noindex
 *
 * Requirements:
 * - Never return draft/generated/ready pages without a valid token
 * - Cache-Control: private, no-store
 * - X-Robots-Tag: noindex, nofollow
 * - Audit log: preview_token_issued
 *
 * @see PUBLISHING_PIPELINE.md §5.2
 */

export const PREVIEW_TOKENS_NOT_IMPLEMENTED = true;
