import type { Metadata } from 'next';

import { JsonLd } from '@/components/JsonLd';
import { getPublicPage } from '@/lib/public-cache';
import { PublicPageView } from '@/lib/public-page-view';
import { buildJsonLdGraph } from '@/lib/seo/json-ld';
import { createMetadataContext, metadataFromPublicPage } from '@/lib/seo/metadata';
import { resolveRequestOrigin } from '@/lib/seo/site-config';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const siteOrigin = await resolveRequestOrigin();
  const ctx = createMetadataContext(siteOrigin);
  const page = await getPublicPage('/');
  if (!page) {
    return { robots: { index: false, follow: false } };
  }
  return metadataFromPublicPage(page, ctx);
}

export default async function HomePage() {
  const siteOrigin = await resolveRequestOrigin();
  const config = createMetadataContext(siteOrigin).config;
  const page = await getPublicPage('/');

  return (
    <>
      {page ? <JsonLd data={buildJsonLdGraph(page, config, siteOrigin)} /> : null}
      <PublicPageView path="/" initialPage={page} />
    </>
  );
}
