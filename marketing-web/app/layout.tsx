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
      <body>
        {isSolomiya ? <SiteHeader /> : null}
        {children}
        {isSolomiya ? <SiteFooter /> : null}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
