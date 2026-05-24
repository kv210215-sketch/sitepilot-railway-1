import type { Metadata } from 'next';

import type { PublicPageDto } from '../public-api';

import { normalizeMetadataSnapshot } from './normalize';
import {
  effectiveRobotsIndex,
  safeCanonical,
  safeDescription,
  safeOgImage,
  safeTitle,
} from './safety';
import { readMarketingSeoConfig, type MarketingSeoConfig } from './site-config';

export type MetadataBuildContext = {
  config: MarketingSeoConfig;
  siteOrigin: string | null;
};

export function createMetadataContext(siteOrigin: string | null): MetadataBuildContext {
  return {
    config: readMarketingSeoConfig(),
    siteOrigin,
  };
}

export function metadataFromPublicPage(
  page: PublicPageDto,
  ctx: MetadataBuildContext,
): Metadata {
  const { config } = ctx;
  const title = safeTitle(page, config);
  const description = safeDescription(page, config);
  const canonical = safeCanonical(page, ctx.siteOrigin);
  const index = effectiveRobotsIndex(page, config);
  const follow = page.robotsFollow;
  const ogImage = safeOgImage(page, config, ctx.siteOrigin);

  const ogTitle = page.ogTitle?.trim() || title;
  const ogDescription = page.ogDescription?.trim() || description;

  const metadata: Metadata = {
    title,
    description,
    keywords: page.seoKeywords?.trim() ? page.seoKeywords.split(',').map((k) => k.trim()) : undefined,
    alternates: canonical ? { canonical } : undefined,
    robots: {
      index,
      follow,
      googleBot: { index, follow },
    },
    openGraph: {
      type: 'website',
      locale: config.defaultLocale,
      siteName: config.siteName ?? undefined,
      title: ogTitle,
      description: ogDescription,
      url: canonical ?? undefined,
      images: ogImage
        ? [
            {
              url: ogImage,
              alt: ogTitle,
            },
          ]
        : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      site: config.twitterSite ?? undefined,
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };

  if (page.isHomepage && canonical) {
    metadata.alternates = {
      ...metadata.alternates,
      languages: {
        'uk-UA': canonical,
        'x-default': canonical,
      },
    };
  }

  return metadata;
}

/** Exposes normalized snapshot for parity tooling. */
export function metadataSnapshotFromPublicPage(
  page: PublicPageDto,
  ctx: MetadataBuildContext,
): ReturnType<typeof normalizeMetadataSnapshot> {
  const meta = metadataFromPublicPage(page, ctx);
  const og = meta.openGraph && typeof meta.openGraph === 'object' ? meta.openGraph : {};
  const tw = meta.twitter && typeof meta.twitter === 'object' ? meta.twitter : {};

  return normalizeMetadataSnapshot({
    title: typeof meta.title === 'string' ? meta.title : safeTitle(page, ctx.config),
    description: meta.description ?? null,
    canonical:
      meta.alternates && 'canonical' in meta.alternates
        ? String(meta.alternates.canonical ?? '')
        : null,
    robotsIndex: meta.robots && typeof meta.robots === 'object' && 'index' in meta.robots
      ? Boolean(meta.robots.index)
      : true,
    robotsFollow: meta.robots && typeof meta.robots === 'object' && 'follow' in meta.robots
      ? Boolean(meta.robots.follow)
      : true,
    openGraph: og as Record<string, unknown>,
    twitter: tw as Record<string, unknown>,
  });
}
