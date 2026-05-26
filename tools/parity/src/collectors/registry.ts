import type { ParityConfig, ParityVector } from '../config/parity-config.schema.js';
import { ParityGetClient } from '../http/get-client.js';
import { HttpJsonLdCollector } from './jsonld-collector.js';
import { HttpRuntimeCollector } from './runtime-collector.js';
import { HttpSeoCollector } from './seo-collector.js';
import type {
  CollectorContext,
  JsonLdCollectResult,
  JsonLdCollector,
  PlannedCollectorAction,
  RuntimeCollectResult,
  RuntimeCollector,
  SeoCollectResult,
  SeoCollector,
} from './types.js';

export interface CollectorSuite {
  runtime: RuntimeCollector;
  seo: SeoCollector;
  jsonld: JsonLdCollector;
}

export function createCollectorSuite(config: ParityConfig): CollectorSuite {
  const client = new ParityGetClient({
    liveMode: config.liveMode,
    timeoutMs: config.collectTimeoutMs,
  });
  return {
    runtime: new HttpRuntimeCollector(client),
    seo: new HttpSeoCollector(client),
    jsonld: new HttpJsonLdCollector(client),
  };
}

export function buildCollectorContext(
  config: ParityConfig,
  endpoint: 'baseline' | 'target',
): CollectorContext {
  const ref = config[endpoint];
  return {
    liveMode: config.liveMode,
    timeoutMs: config.collectTimeoutMs,
    endpoint: { label: ref.label, origin: ref.origin },
  };
}

export function planForVectors(
  suite: CollectorSuite,
  vectors: ParityVector[],
  baselineCtx: CollectorContext,
  targetCtx: CollectorContext,
): PlannedCollectorAction[] {
  const planned: PlannedCollectorAction[] = [];
  for (const vector of vectors) {
    const collectors: Array<{
      baseline: { plan: (c: CollectorContext) => PlannedCollectorAction[] };
      target: { plan: (c: CollectorContext) => PlannedCollectorAction[] };
    }> = [];
    if (vector === 'runtime') {
      collectors.push({ baseline: suite.runtime, target: suite.runtime });
    } else if (vector === 'seo') {
      collectors.push({ baseline: suite.seo, target: suite.seo });
    } else if (vector === 'jsonld') {
      collectors.push({ baseline: suite.jsonld, target: suite.jsonld });
    }
    for (const { baseline, target } of collectors) {
      planned.push(
        ...baseline.plan(baselineCtx).map((a) => ({
          ...a,
          url: `[${baselineCtx.endpoint.label}] ${a.url}`,
        })),
      );
      planned.push(
        ...target.plan(targetCtx).map((a) => ({
          ...a,
          url: `[${targetCtx.endpoint.label}] ${a.url}`,
        })),
      );
    }
  }
  return planned;
}

export interface VectorCollectBundle {
  baseline: RuntimeCollectResult[] | SeoCollectResult[] | JsonLdCollectResult[];
  target: RuntimeCollectResult[] | SeoCollectResult[] | JsonLdCollectResult[];
}

export async function collectForVectors(
  suite: CollectorSuite,
  vectors: ParityVector[],
  baselineCtx: CollectorContext,
  targetCtx: CollectorContext,
): Promise<{
  runtime?: { baseline: RuntimeCollectResult[]; target: RuntimeCollectResult[] };
  seo?: { baseline: SeoCollectResult[]; target: SeoCollectResult[] };
  jsonld?: { baseline: JsonLdCollectResult[]; target: JsonLdCollectResult[] };
}> {
  const out: {
    runtime?: { baseline: RuntimeCollectResult[]; target: RuntimeCollectResult[] };
    seo?: { baseline: SeoCollectResult[]; target: SeoCollectResult[] };
    jsonld?: { baseline: JsonLdCollectResult[]; target: JsonLdCollectResult[] };
  } = {};

  if (vectors.includes('runtime')) {
    const paths = suite.runtime.plan(baselineCtx).map((p) => p.path);
    out.runtime = {
      baseline: await Promise.all(paths.map((p) => suite.runtime.collect(baselineCtx, p))),
      target: await Promise.all(paths.map((p) => suite.runtime.collect(targetCtx, p))),
    };
  }
  if (vectors.includes('seo')) {
    const paths = suite.seo.plan(baselineCtx).map((p) => p.path);
    out.seo = {
      baseline: await Promise.all(paths.map((p) => suite.seo.collect(baselineCtx, p))),
      target: await Promise.all(paths.map((p) => suite.seo.collect(targetCtx, p))),
    };
  }
  if (vectors.includes('jsonld')) {
    const paths = suite.jsonld.plan(baselineCtx).map((p) => p.path);
    out.jsonld = {
      baseline: await Promise.all(paths.map((p) => suite.jsonld.collect(baselineCtx, p))),
      target: await Promise.all(paths.map((p) => suite.jsonld.collect(targetCtx, p))),
    };
  }

  return out;
}
