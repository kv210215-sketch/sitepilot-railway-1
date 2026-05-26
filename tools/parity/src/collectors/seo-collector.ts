import { assertPlannedOnlyCollectorMode } from './assertions.js';
import { ParityGetClient } from '../http/get-client.js';
import { ParityHttpError } from '../http/errors.js';
import {
  extractCanonical,
  extractMetaDescription,
  extractOpenGraph,
  extractRobotsMeta,
  extractTitle,
  extractTwitterCard,
} from './parse-html.js';
import { formatPlannedUrl, resolveCollectUrl } from './urls.js';
import type {
  CollectorContext,
  PlannedCollectorAction,
  SeoCollectResult,
  SeoCollector,
  SeoMetaSnapshot,
} from './types.js';
import { DEFAULT_COLLECT_PATHS as PATHS } from './types.js';

function buildSeoMeta(html: string): SeoMetaSnapshot {
  return {
    title: extractTitle(html),
    metaDescription: extractMetaDescription(html),
    canonical: extractCanonical(html),
    robots: extractRobotsMeta(html),
    openGraph: extractOpenGraph(html),
    twitter: extractTwitterCard(html),
  };
}

export class HttpSeoCollector implements SeoCollector {
  readonly vector = 'seo' as const;

  constructor(private readonly client: ParityGetClient) {}

  plan(
    context: CollectorContext,
    paths: readonly string[] = PATHS,
  ): PlannedCollectorAction[] {
    return paths.map((p) => {
      const url = formatPlannedUrl(context.endpoint, p);
      const canExecute = context.liveMode && resolveCollectUrl(context.endpoint, p) !== null;
      let skipReason: string | undefined;
      if (!context.liveMode) {
        skipReason = 'liveMode=false (no network)';
      } else if (!context.endpoint.origin) {
        skipReason = 'origin not configured';
      }
      return {
        vector: 'seo',
        method: 'GET',
        url,
        path: p,
        executed: canExecute,
        skipReason,
      };
    });
  }

  async collect(context: CollectorContext, path: string): Promise<SeoCollectResult> {
    const collectedAt = new Date().toISOString();
    const url = resolveCollectUrl(context.endpoint, path);

    if (!context.liveMode) {
      assertPlannedOnlyCollectorMode(context);
      return {
        vector: 'seo',
        url: formatPlannedUrl(context.endpoint, path),
        meta: null,
        collectedAt,
        source: 'planned-only',
        error: 'liveMode=false',
      };
    }

    if (!url) {
      return {
        vector: 'seo',
        url: formatPlannedUrl(context.endpoint, path),
        meta: null,
        collectedAt,
        source: 'planned-only',
        error: 'origin not configured',
      };
    }

    try {
      const response = await this.client.get(url);
      return {
        vector: 'seo',
        url: response.url,
        meta: buildSeoMeta(response.body),
        collectedAt,
        source: 'live',
      };
    } catch (err: unknown) {
      const message =
        err instanceof ParityHttpError || err instanceof Error ? err.message : String(err);
      return {
        vector: 'seo',
        url,
        meta: null,
        collectedAt,
        source: 'planned-only',
        error: message,
      };
    }
  }
}
