/**
 * Per-tenant theme resolution for marketing-web.
 *
 * marketing-web is deployed one-project-per-instance, so the active theme is an
 * environment choice, not per-request. `NEXT_PUBLIC_SITE_THEME` selects which
 * `[data-theme="..."]` token scope (see app/globals.css) is active on <html>.
 *
 * Unset / unknown value → 'default' → the existing look. A tenant opts into a
 * different palette by setting the env var; tenants that don't are unaffected.
 * This is the mechanism that keeps a Solomiya re-skin scoped to Solomiya.
 */
export const SITE_THEMES = ['default', 'solomiya'] as const;
export type SiteTheme = (typeof SITE_THEMES)[number];

export function getSiteTheme(): SiteTheme {
  const v = process.env.NEXT_PUBLIC_SITE_THEME?.trim().toLowerCase();
  return (SITE_THEMES as readonly string[]).includes(v ?? '') ? (v as SiteTheme) : 'default';
}
