import type { MetadataRoute } from 'next';

import { buildRobotsRoute } from '@/lib/seo/robots';

export const dynamic = 'force-dynamic';

export default function robots(): Promise<MetadataRoute.Robots> {
  return buildRobotsRoute();
}
