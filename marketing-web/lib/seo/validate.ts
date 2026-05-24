import type { MetadataRoute } from 'next';

import type { PublicPageDto } from '../public-api';

import { buildJsonLdGraph } from './json-ld';
import { metadataSnapshotFromPublicPage, createMetadataContext } from './metadata';
import { validateJsonLdGraph } from './schema';
import { readMarketingSeoConfig } from './site-config';
import { validateSitemapEntries } from './sitemap';

export type SeoValidationReport = {
  ok: boolean;
  metadataIssues: string[];
  schemaIssues: string[];
  sitemapIssues: string[];
};

const SAMPLE_PAGE: PublicPageDto = {
  path: '/',
  title: 'Sample — SitePilot',
  metaDescription: 'Sample description for validation.',
  canonicalUrl: 'http://localhost:3002/',
  robotsIndex: true,
  robotsFollow: true,
  seoKeywords: null,
  ogTitle: null,
  ogDescription: null,
  ogImageUrl: null,
  structuredData: null,
  blocks: [
    {
      type: 'faq',
      order: 1,
      data: {
        items: [{ question: 'Test?', answer: 'Yes.' }],
      },
    },
  ],
  updatedAt: new Date().toISOString(),
  publishedAt: null,
  isHomepage: true,
};

export function runSeoValidation(): SeoValidationReport {
  const config = readMarketingSeoConfig();
  const ctx = createMetadataContext(config.siteOrigin ?? 'http://localhost:3002');

  const metadataIssues: string[] = [];
  const snapshot = metadataSnapshotFromPublicPage(SAMPLE_PAGE, ctx);
  if (!snapshot.title) metadataIssues.push('Metadata snapshot missing title');
  if (!snapshot.description) metadataIssues.push('Metadata snapshot missing description');

  const graph = buildJsonLdGraph(SAMPLE_PAGE, config, ctx.siteOrigin);
  const criticalCodes = new Set(['INVALID_ROOT', 'INVALID_CONTEXT', 'FAQ_EMPTY']);
  const schemaIssues = validateJsonLdGraph(graph)
    .filter((i) => criticalCodes.has(i.code))
    .map((i) => `${i.code}: ${i.message}`);

  const sampleSitemap: MetadataRoute.Sitemap = [
    {
      url: `${ctx.siteOrigin ?? 'http://localhost:3002'}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
  const sitemapResult = validateSitemapEntries(sampleSitemap);

  return {
    ok: metadataIssues.length === 0 && schemaIssues.length === 0 && sitemapResult.ok,
    metadataIssues,
    schemaIssues,
    sitemapIssues: sitemapResult.errors,
  };
}
