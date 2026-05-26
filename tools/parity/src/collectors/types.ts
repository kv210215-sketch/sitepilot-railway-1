import type { ParityVector } from '../config/parity-config.schema.js';

/** Default page paths collected for Solomiya landing parity. */
export const DEFAULT_COLLECT_PATHS = ['/', '/privacy.html'] as const;

export interface CollectorEndpoint {
  label: string;
  origin: string | null;
}

export interface CollectorContext {
  liveMode: boolean;
  timeoutMs: number;
  endpoint: CollectorEndpoint;
}

export interface PlannedCollectorAction {
  vector: ParityVector;
  method: 'GET';
  url: string;
  path: string;
  executed: boolean;
  skipReason?: string;
}

export interface RuntimeBodySummary {
  htmlLength: number;
  textLength: number;
  excerpt: string;
  sectionIdCount: number;
  anchorIdSample: string[];
  hasLeadForm: boolean;
}

export interface RuntimeCollectResult {
  vector: 'runtime';
  url: string;
  status: number | null;
  title: string | null;
  bodySummary: RuntimeBodySummary | null;
  collectedAt: string;
  source: 'live' | 'planned-only';
  error?: string;
}

export interface SeoMetaSnapshot {
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robots: string | null;
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
}

export interface SeoCollectResult {
  vector: 'seo';
  url: string;
  meta: SeoMetaSnapshot | null;
  collectedAt: string;
  source: 'live' | 'planned-only';
  error?: string;
}

export interface JsonLdBlockSnapshot {
  index: number;
  rawLength: number;
  types: string[];
  parseOk: boolean;
  parseError?: string;
}

export interface JsonLdCollectResult {
  vector: 'jsonld';
  url: string;
  blocks: JsonLdBlockSnapshot[];
  collectedAt: string;
  source: 'live' | 'planned-only';
  error?: string;
}

export interface RuntimeCollector {
  readonly vector: 'runtime';
  plan(context: CollectorContext, paths?: readonly string[]): PlannedCollectorAction[];
  collect(context: CollectorContext, path: string): Promise<RuntimeCollectResult>;
}

export interface SeoCollector {
  readonly vector: 'seo';
  plan(context: CollectorContext, paths?: readonly string[]): PlannedCollectorAction[];
  collect(context: CollectorContext, path: string): Promise<SeoCollectResult>;
}

export interface JsonLdCollector {
  readonly vector: 'jsonld';
  plan(context: CollectorContext, paths?: readonly string[]): PlannedCollectorAction[];
  collect(context: CollectorContext, path: string): Promise<JsonLdCollectResult>;
}
