import { headers } from 'next/headers';

export type MarketingSeoConfig = {
  /** Preferred absolute origin (protocol + host), no trailing slash. */
  siteOrigin: string | null;
  /** When true, all pages get noindex and robots.txt blocks crawlers. */
  forceNoindex: boolean;
  defaultOgImage: string | null;
  twitterSite: string | null;
  siteName: string | null;
  defaultLocale: string;
};

function trimOrigin(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

function envFlag(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/** Static SEO config from environment (no production host hardcoding). */
export function readMarketingSeoConfig(): MarketingSeoConfig {
  const siteOrigin =
    trimOrigin(process.env.NEXT_PUBLIC_SITE_ORIGIN) ??
    trimOrigin(process.env.MARKETING_SITE_ORIGIN) ??
    null;

  return {
    siteOrigin,
    forceNoindex: envFlag('MARKETING_FORCE_NOINDEX') || envFlag('NEXT_PUBLIC_FORCE_NOINDEX'),
    defaultOgImage: process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE?.trim() || null,
    twitterSite: process.env.NEXT_PUBLIC_TWITTER_SITE?.trim() || null,
    siteName: process.env.NEXT_PUBLIC_SITE_NAME?.trim() || null,
    defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE?.trim() || 'uk_UA',
  };
}

/** Resolves request host into an origin when SITE_ORIGIN is unset (local dev). */
export async function resolveRequestOrigin(): Promise<string | null> {
  const config = readMarketingSeoConfig();
  if (config.siteOrigin) {
    return config.siteOrigin;
  }

  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    if (!host) return null;
    const proto = h.get('x-forwarded-proto') ?? 'http';
    return trimOrigin(`${proto}://${host}`);
  } catch {
    return null;
  }
}

export function joinOriginPath(origin: string, path: string): string {
  const base = origin.replace(/\/$/, '');
  if (path === '/') return `${base}/`;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}
