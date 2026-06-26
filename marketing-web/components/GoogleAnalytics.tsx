/**
 * Loads Google Analytics 4 (gtag.js) only when NEXT_PUBLIC_GA_MEASUREMENT_ID is
 * configured. With no id set this renders nothing, so the site works unchanged
 * without analytics. The measurement id is never hardcoded — it comes from env.
 *
 * Uses the standard GA snippet (plain script tags) so the init is present in the
 * server-rendered HTML and runs on first paint. Conversion events (e.g.
 * `generate_lead`) are emitted from lib/leads.ts via `window.gtag('event', ...)`,
 * which the inline init below defines.
 */
export default function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) {
    return null;
  }

  const init = [
    'window.dataLayer = window.dataLayer || [];',
    'function gtag(){dataLayer.push(arguments);}',
    'window.gtag = gtag;',
    "gtag('js', new Date());",
    `gtag('config', '${measurementId}');`,
  ].join('');

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />
      <script id="ga4-init" dangerouslySetInnerHTML={{ __html: init }} />
    </>
  );
}
