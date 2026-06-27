import type { PublicPageBlock, PublicPageDto } from '../public-api';

import { parseStructuredData, sanitizeJsonLdGraph } from './schema';
import { joinOriginPath, type MarketingSeoConfig } from './site-config';
import { safeCanonical, safeTitle } from './safety';

type FaqItem = { question?: string; answer?: string };

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function faqItemsFromBlocks(blocks: PublicPageBlock[]): FaqItem[] {
  const faqBlock = blocks.find((b) => b.type === 'faq');
  if (!faqBlock?.data) return [];

  const raw = faqBlock.data.items ?? faqBlock.data.questions;
  if (!Array.isArray(raw)) return [];

  return raw.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      question: asString(row.question ?? row.name),
      answer: asString(row.answer ?? row.text),
    };
  });
}

function buildFaqPageEntity(items: FaqItem[]): Record<string, unknown> | null {
  const entities = items
    .filter((i) => i.question && i.answer)
    .map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: i.answer,
      },
    }));

  if (entities.length === 0) return null;

  return {
    '@type': 'FAQPage',
    mainEntity: entities,
  };
}

function buildBreadcrumbList(
  page: PublicPageDto,
  siteOrigin: string | null,
): Record<string, unknown> | null {
  if (!siteOrigin || page.path === '/') return null;

  const segments = page.path.split('/').filter(Boolean);
  const items: Record<string, unknown>[] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Головна',
      item: joinOriginPath(siteOrigin, '/'),
    },
  ];

  let acc = '';
  segments.forEach((segment, index) => {
    acc += `/${segment}`;
    items.push({
      '@type': 'ListItem',
      position: index + 2,
      name: decodeURIComponent(segment).replace(/-/g, ' '),
      item: joinOriginPath(siteOrigin, acc),
    });
  });

  return {
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

function buildWebSiteEntity(
  page: PublicPageDto,
  config: MarketingSeoConfig,
  siteOrigin: string | null,
): Record<string, unknown> | null {
  if (!page.isHomepage || !siteOrigin) return null;

  const name = config.siteName ?? safeTitle(page, config);
  return {
    '@type': 'WebSite',
    '@id': `${siteOrigin}/#website`,
    name,
    url: siteOrigin,
    inLanguage: 'uk',
  };
}

function buildLocalBusinessEntity(
  page: PublicPageDto,
  config: MarketingSeoConfig,
  siteOrigin: string | null,
): Record<string, unknown> | null {
  if (!page.isHomepage || !siteOrigin) return null;

  const stored = parseStructuredData(page.structuredData);
  const fromGraph = stored && findEntityByType(stored, 'LocalBusiness');
  if (fromGraph) return fromGraph;

  const name = config.siteName ?? safeTitle(page, config);
  return {
    '@type': 'LocalBusiness',
    '@id': `${siteOrigin}/#business`,
    name,
    url: siteOrigin,
    description: page.metaDescription ?? undefined,
  };
}

function findEntityByType(
  root: Record<string, unknown>,
  type: string,
): Record<string, unknown> | null {
  if (root['@type'] === type) return root;

  const graph = root['@graph'];
  if (Array.isArray(graph)) {
    for (const node of graph) {
      if (typeof node === 'object' && node !== null && (node as Record<string, unknown>)['@type'] === type) {
        return node as Record<string, unknown>;
      }
    }
  }
  return null;
}

function mergeGraphNodes(nodes: Array<Record<string, unknown> | null>): Record<string, unknown>[] {
  const seen = new Set<string>();
  const out: Record<string, unknown>[] = [];

  for (const node of nodes) {
    if (!node) continue;
    const key = `${String(node['@type'])}:${String(node['@id'] ?? node.name ?? '')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(node);
  }

  return out;
}

export function buildJsonLdGraph(
  page: PublicPageDto,
  config: MarketingSeoConfig,
  siteOrigin: string | null,
): Record<string, unknown> {
  const canonical = safeCanonical(page, siteOrigin);
  const fallback: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: safeTitle(page, config),
        url: canonical ?? undefined,
      },
    ],
  };

  const stored = parseStructuredData(page.structuredData);
  if (stored) {
    if (Array.isArray(stored['@graph']) && stored['@graph'].length > 0) {
      return sanitizeJsonLdGraph(
        {
          '@context': stored['@context'] ?? 'https://schema.org',
          '@graph': stored['@graph'],
        },
        fallback,
      );
    }
    if (stored['@type']) {
      return sanitizeJsonLdGraph(
        {
          '@context': stored['@context'] ?? 'https://schema.org',
          '@graph': [stored],
        },
        fallback,
      );
    }
  }

  const faqFromBlocks = buildFaqPageEntity(faqItemsFromBlocks(page.blocks));
  const faqFromStored = stored ? findEntityByType(stored, 'FAQPage') : null;

  const graph = mergeGraphNodes([
    buildWebSiteEntity(page, config, siteOrigin),
    buildLocalBusinessEntity(page, config, siteOrigin),
    faqFromStored ?? faqFromBlocks,
    buildBreadcrumbList(page, siteOrigin),
  ]);

  return sanitizeJsonLdGraph(
    {
      '@context': 'https://schema.org',
      '@graph': graph.length > 0 ? graph : fallback['@graph'],
    },
    fallback,
  );
}
