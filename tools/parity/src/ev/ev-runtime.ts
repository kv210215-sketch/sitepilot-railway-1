import { z } from 'zod';

export const EV_RUNTIME_VERSION = '1' as const;

/** Field keys compared by future P2 runtime collectors. */
export const EV_RUNTIME_FIELD_KEYS = [
  'routes',
  'apiEndpoints',
  'renderMode',
  'anchorIds',
  'sectionOrder',
  'leadFormSelector',
  'staticAssetPaths',
  'externalDependencies',
  'dynamicClientBehaviors',
] as const;

export const RouteEntrySchema = z.object({
  path: z.string(),
  file: z.string(),
  indexable: z.boolean(),
});

export const ApiEndpointSchema = z.object({
  method: z.enum(['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE']),
  path: z.string(),
  handler: z.string(),
});

/**
 * EV_RUNTIME — expected runtime surface for legacy static landing parity.
 * P1 ships the shape + spec placeholders only (no HTTP collection).
 */
export const EvRuntimeSchema = z.object({
  version: z.literal(EV_RUNTIME_VERSION),
  routes: z.array(RouteEntrySchema),
  apiEndpoints: z.array(ApiEndpointSchema),
  renderMode: z.enum(['static-html', 'ssr', 'hybrid']),
  anchorIds: z.array(z.string()),
  sectionOrder: z.array(z.string()),
  leadFormSelector: z.string(),
  staticAssetPaths: z.array(z.string()),
  externalDependencies: z.array(z.string()),
  dynamicClientBehaviors: z.array(z.string()),
});

export type EvRuntimeShape = z.infer<typeof EvRuntimeSchema>;

/** Spec-derived placeholder snapshot (docs/parity/runtime.md). */
export function createEvRuntimeSpecTemplate(): EvRuntimeShape {
  return EvRuntimeSchema.parse({
    version: EV_RUNTIME_VERSION,
    routes: [
      { path: '/', file: 'index.html', indexable: true },
      { path: '/privacy.html', file: 'privacy.html', indexable: false },
    ],
    apiEndpoints: [
      { method: 'POST', path: '/api/lead', handler: 'functions/api/lead.js' },
      { method: 'OPTIONS', path: '/api/lead', handler: 'functions/api/lead.js' },
    ],
    renderMode: 'static-html',
    anchorIds: ['benefits', 'how', 'reviews', 'contact', 'faq'],
    sectionOrder: [
      'urgency',
      'hero',
      'trust-bar',
      'proof-strip',
      'brands-bar',
      'process-bar',
      'benefits',
      'how',
      'pricing-included',
      'reviews',
      'guarantees',
      'contact',
      'faq',
      'final-cta',
      'footer',
    ],
    leadFormSelector: '#mainForm',
    staticAssetPaths: [
      '/favicon.ico',
      '/favicon.svg',
      '/apple-touch-icon.png',
      '/og-image.jpg',
      '/manifest.json',
      '/robots.txt',
      '/sitemap.xml',
    ],
    externalDependencies: ['fonts.googleapis.com', 'fonts.gstatic.com'],
    dynamicClientBehaviors: [
      'scroll-reveal',
      'stat-counters',
      'urgency-month-labels',
      'years-since-2017',
      'sticky-nav-hide',
      'sticky-cta',
      'float-call',
      'lead-form-fetch',
    ],
  });
}
