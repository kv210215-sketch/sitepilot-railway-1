import type { Metadata } from 'next';

import { JsonLd } from '@/components/JsonLd';
import { getPublicPage } from '@/lib/public-cache';
import { normalizePagePath } from '@/lib/public-api';
import { PublicPageView } from '@/lib/public-page-view';
import { buildJsonLdGraph } from '@/lib/seo/json-ld';
import { createMetadataContext, metadataFromPublicPage } from '@/lib/seo/metadata';
import { resolveRequestOrigin } from '@/lib/seo/site-config';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: { path: string[] };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const path = normalizePagePath(params.path);
  const siteOrigin = await resolveRequestOrigin();
  const ctx = createMetadataContext(siteOrigin);
  const page = await getPublicPage(path);
  if (!page) {
    return { robots: { index: false, follow: false } };
  }
  return metadataFromPublicPage(page, ctx);
}

export default async function NestedPublicPage({ params }: PageProps) {
  const path = normalizePagePath(params.path);
  const siteOrigin = await resolveRequestOrigin();
  const config = createMetadataContext(siteOrigin).config;
  const page = await getPublicPage(path);

  return (
    <>
      {page ? <JsonLd data={buildJsonLdGraph(page, config, siteOrigin)} /> : null}
      <PublicPageView path={path} initialPage={page} />
    </>
  );
}
