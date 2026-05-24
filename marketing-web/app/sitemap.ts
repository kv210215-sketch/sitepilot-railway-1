import type { MetadataRoute } from 'next';

import { buildSitemapRoute } from '@/lib/seo/sitemap';

export const dynamic = 'force-dynamic';

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemapRoute();
}
