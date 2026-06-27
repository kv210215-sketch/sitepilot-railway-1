import type { MetadataRoute } from 'next';

import { joinOriginPath, readMarketingSeoConfig, resolveRequestOrigin } from './site-config';

export async function buildRobotsRoute(): Promise<MetadataRoute.Robots> {
  const config = readMarketingSeoConfig();
  const origin = (await resolveRequestOrigin()) ?? config.siteOrigin ?? 'http://localhost:3002';

  if (config.forceNoindex) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  const sitemapUrl = joinOriginPath(origin, '/sitemap.xml');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: sitemapUrl,
  };
}
