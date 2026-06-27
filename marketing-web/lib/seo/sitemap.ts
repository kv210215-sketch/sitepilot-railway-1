import type { MetadataRoute } from 'next';

import {
  fetchPublicSitemapEntries,
  type PublicSitemapEntry,
} from '../public-api';

import { joinOriginPath, readMarketingSeoConfig, resolveRequestOrigin } from './site-config';

function sitemapPriority(entry: PublicSitemapEntry): number {
  if (entry.isHomepage) return 1.0;
  if (!entry.robotsIndex) return 0.2;
  return 0.7;
}

function sitemapChangeFrequency(entry: PublicSitemapEntry): MetadataRoute.Sitemap[0]['changeFrequency'] {
  if (entry.isHomepage) return 'weekly';
  if (!entry.robotsIndex) return 'yearly';
  return 'monthly';
}

function lastModified(entry: PublicSitemapEntry): Date {
  const raw = entry.publishedAt ?? entry.updatedAt;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export async function buildSitemapRoute(): Promise<MetadataRoute.Sitemap> {
  const config = readMarketingSeoConfig();
  const origin = (await resolveRequestOrigin()) ?? config.siteOrigin;

  if (!origin) {
    return [];
  }

  const entries = await fetchPublicSitemapEntries();

  if (entries.length === 0) {
    return [
      {
        url: joinOriginPath(origin, '/'),
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
      },
    ];
  }

  return entries.map((entry) => ({
    url: joinOriginPath(origin, entry.path === '/' ? '/' : entry.path),
    lastModified: lastModified(entry),
    changeFrequency: sitemapChangeFrequency(entry),
    priority: sitemapPriority(entry),
  }));
}

/** Validates sitemap entries for local CI / validate:seo script. */
export function validateSitemapEntries(
  entries: MetadataRoute.Sitemap,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const entry of entries) {
    try {
      const url = new URL(entry.url);
      if (!url.protocol.startsWith('http')) {
        errors.push(`Invalid protocol for ${entry.url}`);
      }
    } catch {
      errors.push(`Invalid sitemap URL: ${entry.url}`);
    }

    if (entry.priority !== undefined && (entry.priority < 0 || entry.priority > 1)) {
      errors.push(`Priority out of range for ${entry.url}`);
    }
  }

  const urls = entries.map((e) => e.url);
  const dupes = urls.filter((u, i) => urls.indexOf(u) !== i);
  if (dupes.length > 0) {
    errors.push(`Duplicate sitemap URLs: ${Array.from(new Set(dupes)).join(', ')}`);
  }

  return { ok: errors.length === 0, errors };
}
