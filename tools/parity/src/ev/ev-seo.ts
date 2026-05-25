import { z } from 'zod';

export const EV_SEO_VERSION = '1' as const;

export const EV_SEO_FIELD_KEYS = [
  'pages',
  'robotsTxt',
  'sitemap',
  'hreflang',
  'openGraphHomepage',
  'twitterCardHomepage',
] as const;

export const SeoPageEntrySchema = z.object({
  path: z.string(),
  titlePattern: z.string(),
  metaDescriptionPattern: z.string(),
  canonicalPattern: z.string().nullable(),
  robots: z.string(),
  inSitemap: z.boolean(),
  sitemapPriority: z.number().min(0).max(1).optional(),
  sitemapChangefreq: z.string().optional(),
});

export const RobotsTxtSchema = z.object({
  allowAll: z.boolean(),
  sitemapDeclared: z.boolean(),
});

export const SitemapUrlSchema = z.object({
  locPattern: z.string(),
  lastmod: z.string().optional(),
  changefreq: z.string().optional(),
  priority: z.number().optional(),
});

export const HreflangEntrySchema = z.object({
  pagePath: z.string(),
  hreflang: z.string(),
  hrefPattern: z.string(),
});

/**
 * EV_SEO — head/meta/sitemap/robots/hreflang parity surface.
 * Patterns use `{origin}` placeholder — never hard-coded production hosts in harness code.
 */
export const EvSeoSchema = z.object({
  version: z.literal(EV_SEO_VERSION),
  pages: z.array(SeoPageEntrySchema),
  robotsTxt: RobotsTxtSchema,
  sitemap: z.object({
    urlCount: z.number().int().nonnegative(),
    urls: z.array(SitemapUrlSchema),
  }),
  hreflang: z.array(HreflangEntrySchema),
  openGraphHomepage: z.record(z.string()),
  twitterCardHomepage: z.record(z.string()),
});

export type EvSeoShape = z.infer<typeof EvSeoSchema>;

export function createEvSeoSpecTemplate(): EvSeoShape {
  const origin = '{origin}';
  return EvSeoSchema.parse({
    version: EV_SEO_VERSION,
    pages: [
      {
        path: '/',
        titlePattern:
          'Сонячні електростанції під ключ у Львові — Solomiya Energy',
        metaDescriptionPattern:
          'Сонячні електростанції під ключ у Львові. Економія до 70% на електроенергії. Монтаж за 1–3 дні. Гарантія 25 років. Безкоштовний розрахунок від інженера.',
        canonicalPattern: `${origin}/`,
        robots: 'index, follow',
        inSitemap: true,
        sitemapPriority: 1.0,
        sitemapChangefreq: 'monthly',
      },
      {
        path: '/privacy.html',
        titlePattern: 'Політика конфіденційності — Solomiya Energy',
        metaDescriptionPattern:
          'Політика конфіденційності Solomiya Energy. Як ми обробляємо та зберігаємо персональні дані, які ви залишаєте через форму заявки.',
        canonicalPattern: `${origin}/privacy.html`,
        robots: 'noindex, follow',
        inSitemap: true,
        sitemapPriority: 0.2,
        sitemapChangefreq: 'yearly',
      },
    ],
    robotsTxt: { allowAll: true, sitemapDeclared: true },
    sitemap: {
      urlCount: 2,
      urls: [
        {
          locPattern: `${origin}/`,
          lastmod: '2026-05-19',
          changefreq: 'monthly',
          priority: 1.0,
        },
        {
          locPattern: `${origin}/privacy.html`,
          lastmod: '2026-05-19',
          changefreq: 'yearly',
          priority: 0.2,
        },
      ],
    },
    hreflang: [
      { pagePath: '/', hreflang: 'uk-UA', hrefPattern: `${origin}/` },
      { pagePath: '/', hreflang: 'x-default', hrefPattern: `${origin}/` },
    ],
    openGraphHomepage: {
      'og:type': 'website',
      'og:url': `${origin}/`,
      'og:locale': 'uk_UA',
      'og:image': `${origin}/og-image.jpg`,
      'og:image:width': '1200',
      'og:image:height': '630',
    },
    twitterCardHomepage: {
      'twitter:card': 'summary_large_image',
      'twitter:image': `${origin}/og-image.jpg`,
    },
  });
}
