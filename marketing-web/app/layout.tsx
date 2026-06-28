import type { Metadata } from 'next';

import './globals.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { SiteHeader, SiteFooter } from '@/components/SiteChrome';
import { getSiteTheme } from '@/lib/theme';

// Google Search Console verification — emits
// <meta name="google-site-verification" content="..."> when the token is set.
// Never hardcoded; safe to leave unset (no meta tag rendered).
const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  title: { default: 'SitePilot Marketing', template: '%s' },
  ...(googleSiteVerification
    ? { verification: { google: googleSiteVerification } }
    : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = getSiteTheme();
  const isSolomiya = theme === 'solomiya';
  return (
    <html lang="uk" data-theme={theme}>
      {/* Solomiya design fonts — identical request to the landing source of truth.
          Instrument Serif is loaded italic-only (ital@1): upright serif headings
          fall back to Times New Roman, only <em> accents use Instrument Serif italic,
          exactly like solomiya-energy-landing.pages.dev. Loaded only for this theme;
          Next hoists these <link>s into <head>. */}
      {isSolomiya ? (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router <head> hoist, not pages/_document */}
          <link
            href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
            rel="stylesheet"
          />
        </>
      ) : null}
      <body>
        {isSolomiya ? <SiteHeader /> : null}
        {children}
        {isSolomiya ? <SiteFooter /> : null}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
