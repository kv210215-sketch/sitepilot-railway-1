import { assertPlannedOnlyCollectorMode } from './assertions.js';
import { ParityGetClient } from '../http/get-client.js';
import { ParityHttpError } from '../http/errors.js';
import { extractJsonLdScripts, summarizeJsonLdTypes } from './parse-html.js';
import { formatPlannedUrl, resolveCollectUrl } from './urls.js';
import type {
  CollectorContext,
  JsonLdBlockSnapshot,
  JsonLdCollectResult,
  JsonLdCollector,
  PlannedCollectorAction,
} from './types.js';

/** JSON-LD is collected on homepage only (privacy page has no @graph in spec). */
export const JSONLD_COLLECT_PATHS = ['/'] as const;

export class HttpJsonLdCollector implements JsonLdCollector {
  readonly vector = 'jsonld' as const;

  constructor(private readonly client: ParityGetClient) {}

  plan(
    context: CollectorContext,
    paths: readonly string[] = JSONLD_COLLECT_PATHS,
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
        vector: 'jsonld',
        method: 'GET',
        url,
        path: p,
        executed: canExecute,
        skipReason,
      };
    });
  }

  async collect(context: CollectorContext, path: string): Promise<JsonLdCollectResult> {
    const collectedAt = new Date().toISOString();
    const url = resolveCollectUrl(context.endpoint, path);

    if (!context.liveMode) {
      assertPlannedOnlyCollectorMode(context);
      return {
        vector: 'jsonld',
        url: formatPlannedUrl(context.endpoint, path),
        blocks: [],
        collectedAt,
        source: 'planned-only',
        error: 'liveMode=false',
      };
    }

    if (!url) {
      return {
        vector: 'jsonld',
        url: formatPlannedUrl(context.endpoint, path),
        blocks: [],
        collectedAt,
        source: 'planned-only',
        error: 'origin not configured',
      };
    }

    try {
      const response = await this.client.get(url);
      const scripts = extractJsonLdScripts(response.body);
      const blocks: JsonLdBlockSnapshot[] = scripts.map((script) => {
        const summary = summarizeJsonLdTypes(script.raw);
        return {
          index: script.index,
          rawLength: script.raw.length,
          types: summary.types,
          parseOk: summary.parseOk,
          parseError: summary.parseError,
        };
      });
      return {
        vector: 'jsonld',
        url: response.url,
        blocks,
        collectedAt,
        source: 'live',
      };
    } catch (err: unknown) {
      const message =
        err instanceof ParityHttpError || err instanceof Error ? err.message : String(err);
      return {
        vector: 'jsonld',
        url,
        blocks: [],
        collectedAt,
        source: 'planned-only',
        error: message,
      };
    }
  }
}
