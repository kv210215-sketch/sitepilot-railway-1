import type { PublicPageDto } from '../public-api';

import type { MarketingSeoConfig } from './site-config';

const FALLBACK_TITLE = 'SitePilot Marketing';
const FALLBACK_DESCRIPTION =
  'Публічна сторінка. Метадані будуть оновлені після публікації контенту.';

export function safeTitle(page: PublicPageDto, config: MarketingSeoConfig): string {
  const raw = page.title?.trim();
  if (raw) return raw;
  if (config.siteName) return config.siteName;
  return FALLBACK_TITLE;
}

export function safeDescription(
  page: PublicPageDto,
  config: MarketingSeoConfig,
): string {
  const raw = page.metaDescription?.trim();
  if (raw) return raw;
  if (config.siteName) {
    return `${config.siteName} — публічна сторінка.`;
  }
  return FALLBACK_DESCRIPTION;
}

export function safeCanonical(
  page: PublicPageDto,
  siteOrigin: string | null,
): string | null {
  const fromPage = page.canonicalUrl?.trim();
  if (fromPage) {
    try {
      return new URL(fromPage).toString();
    } catch {
      /* fall through */
    }
  }
  if (!siteOrigin) return null;
  const path = page.path === '/' ? '/' : page.path;
  const base = siteOrigin.replace(/\/$/, '');
  return path === '/' ? `${base}/` : `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function safeOgImage(
  page: PublicPageDto,
  config: MarketingSeoConfig,
  siteOrigin: string | null,
): string | null {
  const fromPage = page.ogImageUrl?.trim();
  if (fromPage) {
    try {
      return new URL(fromPage).toString();
    } catch {
      return fromPage;
    }
  }
  if (config.defaultOgImage) {
    try {
      return new URL(config.defaultOgImage).toString();
    } catch {
      if (siteOrigin) {
        return `${siteOrigin.replace(/\/$/, '')}${config.defaultOgImage.startsWith('/') ? config.defaultOgImage : `/${config.defaultOgImage}`}`;
      }
    }
  }
  return null;
}

export function effectiveRobotsIndex(
  page: PublicPageDto,
  config: MarketingSeoConfig,
): boolean {
  if (config.forceNoindex) return false;
  return page.robotsIndex;
}
