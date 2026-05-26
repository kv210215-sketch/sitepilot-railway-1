import { assertPlannedOnlyCollectorMode } from './assertions.js';
import { ParityGetClient } from '../http/get-client.js';
import { ParityHttpError } from '../http/errors.js';
import {
  buildRuntimeBodySummary,
  extractTitle,
} from './parse-html.js';
import { formatPlannedUrl, resolveCollectUrl } from './urls.js';
import type {
  CollectorContext,
  PlannedCollectorAction,
  RuntimeCollectResult,
  RuntimeCollector,
} from './types.js';
import { DEFAULT_COLLECT_PATHS as PATHS } from './types.js';

export class HttpRuntimeCollector implements RuntimeCollector {
  readonly vector = 'runtime' as const;

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
        vector: 'runtime',
        method: 'GET',
        url,
        path: p,
        executed: canExecute,
        skipReason,
      };
    });
  }

  async collect(context: CollectorContext, path: string): Promise<RuntimeCollectResult> {
    const collectedAt = new Date().toISOString();
    const url = resolveCollectUrl(context.endpoint, path);

    if (!context.liveMode) {
      assertPlannedOnlyCollectorMode(context);
      return {
        vector: 'runtime',
        url: formatPlannedUrl(context.endpoint, path),
        status: null,
        title: null,
        bodySummary: null,
        collectedAt,
        source: 'planned-only',
        error: 'liveMode=false',
      };
    }

    if (!url) {
      return {
        vector: 'runtime',
        url: formatPlannedUrl(context.endpoint, path),
        status: null,
        title: null,
        bodySummary: null,
        collectedAt,
        source: 'planned-only',
        error: 'origin not configured',
      };
    }

    try {
      const response = await this.client.get(url);
      const bodySummary = buildRuntimeBodySummary(response.body);
      return {
        vector: 'runtime',
        url: response.url,
        status: response.status,
        title: extractTitle(response.body),
        bodySummary,
        collectedAt,
        source: 'live',
      };
    } catch (err: unknown) {
      const message =
        err instanceof ParityHttpError || err instanceof Error ? err.message : String(err);
      return {
        vector: 'runtime',
        url,
        status: null,
        title: null,
        bodySummary: null,
        collectedAt,
        source: 'planned-only',
        error: message,
      };
    }
  }
}
