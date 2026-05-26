import {
  EV_JSONLD_FIELD_KEYS,
  EV_RUNTIME_FIELD_KEYS,
  EV_SEO_FIELD_KEYS,
  type EvJsonLdShape,
  type EvRuntimeShape,
  type EvSeoShape,
} from '../ev/index.js';
import type { ParityConfig } from '../config/parity-config.schema.js';
import type {
  JsonLdCollectResult,
  RuntimeCollectResult,
  SeoCollectResult,
} from '../collectors/types.js';
import { compareFieldKeys, summarizeFieldComparisons } from '../diff/field-compare.js';
import { contentHashSha256 } from '../hash/content-hash.js';
import {
  buildEvbSealMeta,
  bundleFingerprintSha256,
  collectBundleArtifactDigests,
  reportFingerprintSha256,
} from '../seal/index.js';
import { normalizeRunTimestamp } from '../serialize/timestamp.js';
import {
  type DiffSummaryReport,
  type EvJsonLdReport,
  type EvRuntimeReport,
  type EvSeoReport,
  P3_REPORT_FILENAMES,
  P3_SERIALIZATION_META,
} from './p3-schemas.js';

export interface EvaluationVectorPair {
  runtime?: { baseline: EvRuntimeShape; target: EvRuntimeShape };
  seo?: { baseline: EvSeoShape; target: EvSeoShape };
  jsonld?: { baseline: EvJsonLdShape; target: EvJsonLdShape };
}

export interface CollectorResultsInput {
  runtime?: { baseline: RuntimeCollectResult[]; target: RuntimeCollectResult[] };
  seo?: { baseline: SeoCollectResult[]; target: SeoCollectResult[] };
  jsonld?: { baseline: JsonLdCollectResult[]; target: JsonLdCollectResult[] };
}

export interface P3BuildInput {
  config: ParityConfig;
  runId: string;
  generatedAt: string;
  evaluationVectors: EvaluationVectorPair;
  collectorResults?: CollectorResultsInput;
}

function countLive(results: { source: string }[] | undefined): number {
  return results?.filter((r) => r.source === 'live').length ?? 0;
}

function pathFromCollectUrl(url: string): string {
  const nullOriginPrefix = '{origin:null}';
  if (url.startsWith(nullOriginPrefix)) {
    return url.slice(nullOriginPrefix.length);
  }
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function pathsFromRuntime(results: RuntimeCollectResult[] | undefined): string[] {
  if (!results) {
    return [];
  }
  return [...new Set(results.map((r) => pathFromCollectUrl(r.url)))].sort();
}

type HashlessReportBody = Record<string, unknown> & {
  runId: string;
  generatedAt: string;
  reportKind: string;
};

function attachSealReadyHashes<T extends HashlessReportBody>(
  body: T,
  options?: { bundleFingerprint?: string },
): T & {
  contentHash: string;
  reportFingerprint: string;
  evbSeal: ReturnType<typeof buildEvbSealMeta>;
} {
  const reportFingerprint = reportFingerprintSha256(body);
  const contentHash = contentHashSha256(body);
  const evbSeal = buildEvbSealMeta({
    runId: body.runId,
    reportKind: body.reportKind,
    generatedAt: body.generatedAt,
    reportFingerprint,
    bundleFingerprint: options?.bundleFingerprint,
  });
  return { ...body, contentHash, reportFingerprint, evbSeal };
}

function buildEvReportBase(input: P3BuildInput) {
  return {
    harnessVersion: 'p3' as const,
    runId: input.runId,
    generatedAt: normalizeRunTimestamp(input.generatedAt),
    baseline: { label: input.config.baseline.label },
    target: { label: input.config.target.label },
    hashAlgorithm: 'sha256' as const,
    serialization: P3_SERIALIZATION_META,
  };
}

export function buildEvRuntimeReport(input: P3BuildInput): EvRuntimeReport {
  const pair = input.evaluationVectors.runtime;
  if (!pair) {
    throw new Error('buildEvRuntimeReport requires runtime evaluation vectors');
  }
  const fields = compareFieldKeys(
    EV_RUNTIME_FIELD_KEYS,
    pair.baseline as unknown as Record<string, unknown>,
    pair.target as unknown as Record<string, unknown>,
  );
  const summary = summarizeFieldComparisons(fields);
  const body = {
    ...buildEvReportBase(input),
    reportKind: 'ev-runtime-report' as const,
    evVersion: '1' as const,
    fieldKeys: [...EV_RUNTIME_FIELD_KEYS],
    fields,
    summary,
    collectorObservation: input.collectorResults?.runtime
      ? {
          baselineLiveResults: countLive(input.collectorResults.runtime.baseline),
          targetLiveResults: countLive(input.collectorResults.runtime.target),
          pathsCompared: pathsFromRuntime([
            ...input.collectorResults.runtime.baseline,
            ...input.collectorResults.runtime.target,
          ]),
        }
      : undefined,
  };
  return attachSealReadyHashes(body);
}

export function buildEvSeoReport(input: P3BuildInput): EvSeoReport {
  const pair = input.evaluationVectors.seo;
  if (!pair) {
    throw new Error('buildEvSeoReport requires seo evaluation vectors');
  }
  const fields = compareFieldKeys(
    EV_SEO_FIELD_KEYS,
    pair.baseline as unknown as Record<string, unknown>,
    pair.target as unknown as Record<string, unknown>,
  );
  const summary = summarizeFieldComparisons(fields);
  const body = {
    ...buildEvReportBase(input),
    reportKind: 'ev-seo-report' as const,
    evVersion: '1' as const,
    fieldKeys: [...EV_SEO_FIELD_KEYS],
    fields,
    summary,
    collectorObservation: input.collectorResults?.seo
      ? {
          baselineLiveResults: countLive(input.collectorResults.seo.baseline),
          targetLiveResults: countLive(input.collectorResults.seo.target),
          pathsCompared: ['/'].sort(),
        }
      : undefined,
  };
  return attachSealReadyHashes(body);
}

export function buildEvJsonLdReport(input: P3BuildInput): EvJsonLdReport {
  const pair = input.evaluationVectors.jsonld;
  if (!pair) {
    throw new Error('buildEvJsonLdReport requires jsonld evaluation vectors');
  }
  const fields = compareFieldKeys(
    EV_JSONLD_FIELD_KEYS,
    pair.baseline as unknown as Record<string, unknown>,
    pair.target as unknown as Record<string, unknown>,
  );
  const summary = summarizeFieldComparisons(fields);
  const body = {
    ...buildEvReportBase(input),
    reportKind: 'ev-jsonld-report' as const,
    evVersion: '1' as const,
    fieldKeys: [...EV_JSONLD_FIELD_KEYS],
    fields,
    summary,
    collectorObservation: input.collectorResults?.jsonld
      ? {
          baselineLiveResults: countLive(input.collectorResults.jsonld.baseline),
          targetLiveResults: countLive(input.collectorResults.jsonld.target),
          pathsCompared: ['/'].sort(),
        }
      : undefined,
  };
  return attachSealReadyHashes(body);
}

function vectorVerdict(summary: ReturnType<typeof summarizeFieldComparisons>): 'GO' | 'NO-GO' {
  return summary.mismatch > 0 || summary.baselineOnly > 0 || summary.targetOnly > 0
    ? 'NO-GO'
    : 'GO';
}

function mergeSummaries(
  summaries: ReturnType<typeof summarizeFieldComparisons>[],
): ReturnType<typeof summarizeFieldComparisons> {
  return summaries.reduce(
    (acc, s) => ({
      match: acc.match + s.match,
      mismatch: acc.mismatch + s.mismatch,
      baselineOnly: acc.baselineOnly + s.baselineOnly,
      targetOnly: acc.targetOnly + s.targetOnly,
      notCollected: acc.notCollected + s.notCollected,
    }),
    { match: 0, mismatch: 0, baselineOnly: 0, targetOnly: 0, notCollected: 0 },
  );
}

export function buildDiffSummaryReport(
  input: P3BuildInput,
  vectorReports: {
    runtime?: EvRuntimeReport;
    seo?: EvSeoReport;
    jsonld?: EvJsonLdReport;
  },
): DiffSummaryReport {
  const vectors: DiffSummaryReport['vectors'] = [];
  if (vectorReports.runtime) {
    vectors.push({
      vector: 'runtime',
      fieldCount: vectorReports.runtime.fields.length,
      summary: vectorReports.runtime.summary,
      verdict: vectorVerdict(vectorReports.runtime.summary),
    });
  }
  if (vectorReports.seo) {
    vectors.push({
      vector: 'seo',
      fieldCount: vectorReports.seo.fields.length,
      summary: vectorReports.seo.summary,
      verdict: vectorVerdict(vectorReports.seo.summary),
    });
  }
  if (vectorReports.jsonld) {
    vectors.push({
      vector: 'jsonld',
      fieldCount: vectorReports.jsonld.fields.length,
      summary: vectorReports.jsonld.summary,
      verdict: vectorVerdict(vectorReports.jsonld.summary),
    });
  }
  vectors.sort((a, b) => a.vector.localeCompare(b.vector));

  const overallSummary = mergeSummaries(vectors.map((v) => v.summary));
  const overallVerdict = vectorVerdict(overallSummary);

  const blockers: string[] = [];
  if (!input.config.liveMode) {
    blockers.push('live-collector-observations-pending');
  }
  if (input.config.baseline.origin === null) {
    blockers.push('baseline-origin-not-configured');
  }
  if (input.config.target.origin === null) {
    blockers.push('target-origin-not-configured');
  }
  if (overallVerdict === 'NO-GO') {
    blockers.push('ev-field-mismatch-detected');
  }

  const bundleMembers = [
    vectorReports.runtime,
    vectorReports.seo,
    vectorReports.jsonld,
  ].filter((report): report is NonNullable<typeof report> => report !== undefined);

  const artifactFingerprints = collectBundleArtifactDigests(bundleMembers);

  const body = {
    ...buildEvReportBase(input),
    reportKind: 'diff-summary' as const,
    artifactFingerprints,
    vectors,
    overall: {
      verdict: overallVerdict,
      totalFields: vectors.reduce((n, v) => n + v.fieldCount, 0),
      summary: overallSummary,
    },
    p4Readiness: {
      liveBaselineOriginRequired: input.config.baseline.origin === null,
      liveTargetOriginRequired: input.config.target.origin === null,
      blockers: [...blockers].sort(),
    },
  };

  const diffReportFingerprint = reportFingerprintSha256(body);
  const bundleFingerprint = bundleFingerprintSha256([
    ...artifactFingerprints.map((entry) => ({
      name: entry.filename,
      digest: entry.reportFingerprint,
    })),
    { name: P3_REPORT_FILENAMES.diffSummary, digest: diffReportFingerprint },
  ]);

  return attachSealReadyHashes(
    {
      ...body,
      bundleFingerprint,
    },
    { bundleFingerprint },
  );
}

export interface P3ReportBundle {
  diffSummary: DiffSummaryReport;
  evRuntime?: EvRuntimeReport;
  evSeo?: EvSeoReport;
  evJsonLd?: EvJsonLdReport;
}

export function buildP3ReportBundle(input: P3BuildInput): P3ReportBundle {
  const evRuntime = input.evaluationVectors.runtime
    ? buildEvRuntimeReport(input)
    : undefined;
  const evSeo = input.evaluationVectors.seo ? buildEvSeoReport(input) : undefined;
  const evJsonLd = input.evaluationVectors.jsonld
    ? buildEvJsonLdReport(input)
    : undefined;

  const diffSummary = buildDiffSummaryReport(input, {
    runtime: evRuntime,
    seo: evSeo,
    jsonld: evJsonLd,
  });

  return { diffSummary, evRuntime, evSeo, evJsonLd };
}
