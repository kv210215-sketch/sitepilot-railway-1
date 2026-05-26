import { z } from 'zod';
import {
  EVB_COMPAT_VERSION,
  EVB_SEAL_SPEC_VERSION,
  SEAL_STATUS_PREPARATION,
} from '../seal/evb-spec.js';

export const P3_SERIALIZATION_META = {
  canonical: true,
  keyOrdering: 'sorted',
  arrayOrdering: 'stable-sorted-unless-preserved',
  whitespace: 'none',
} as const;

export const SerializationMetaSchema = z.object({
  canonical: z.literal(true),
  keyOrdering: z.literal('sorted'),
  arrayOrdering: z.literal('stable-sorted-unless-preserved'),
  whitespace: z.literal('none'),
});

const sha256Hex = z.string().regex(/^[a-f0-9]{64}$/);

export const EvbSealMetaSchema = z.object({
  evbCompatVersion: z.literal(EVB_COMPAT_VERSION),
  evbSealSpecVersion: z.literal(EVB_SEAL_SPEC_VERSION),
  sealStatus: z.literal(SEAL_STATUS_PREPARATION),
  hashAlgorithm: z.literal('sha256'),
  reportFingerprint: sha256Hex,
  bundleFingerprint: sha256Hex.optional(),
  preparationOnly: z.literal(true),
  sealWriter: z.null(),
  canonicalRules: z.object({
    canonical: z.literal(true),
    keyOrdering: z.literal('sorted'),
    arrayOrdering: z.literal('stable-sorted-unless-preserved'),
    whitespace: z.literal('none'),
    sealCanonical: z.literal(true),
    preserveArrayPaths: z.array(z.string()),
  }),
  runId: z.string().min(1),
  reportKind: z.string().min(1),
  generatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
});

export type EvbSealMeta = z.infer<typeof EvbSealMetaSchema>;

export const EndpointLabelSchema = z.object({
  label: z.string(),
});

export const FieldComparisonSchema = z.object({
  fieldKey: z.string(),
  status: z.enum(['match', 'mismatch', 'baseline-only', 'target-only', 'not-collected']),
  baseline: z.unknown().nullable(),
  target: z.unknown().nullable(),
  detail: z.string().optional(),
});

export const FieldSummaryCountsSchema = z.object({
  match: z.number().int().nonnegative(),
  mismatch: z.number().int().nonnegative(),
  baselineOnly: z.number().int().nonnegative(),
  targetOnly: z.number().int().nonnegative(),
  notCollected: z.number().int().nonnegative(),
});

const P3ReportBaseSchema = z.object({
  harnessVersion: z.literal('p3'),
  runId: z.string().min(1),
  generatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  baseline: EndpointLabelSchema,
  target: EndpointLabelSchema,
  contentHash: sha256Hex,
  reportFingerprint: sha256Hex,
  hashAlgorithm: z.literal('sha256'),
  serialization: SerializationMetaSchema,
  evbSeal: EvbSealMetaSchema,
});

export const EvRuntimeReportSchema = P3ReportBaseSchema.extend({
  reportKind: z.literal('ev-runtime-report'),
  evVersion: z.literal('1'),
  fieldKeys: z.array(z.string()),
  fields: z.array(FieldComparisonSchema),
  summary: FieldSummaryCountsSchema,
  collectorObservation: z
    .object({
      baselineLiveResults: z.number().int().nonnegative(),
      targetLiveResults: z.number().int().nonnegative(),
      pathsCompared: z.array(z.string()),
    })
    .optional(),
});

export const EvSeoReportSchema = P3ReportBaseSchema.extend({
  reportKind: z.literal('ev-seo-report'),
  evVersion: z.literal('1'),
  fieldKeys: z.array(z.string()),
  fields: z.array(FieldComparisonSchema),
  summary: FieldSummaryCountsSchema,
  collectorObservation: z
    .object({
      baselineLiveResults: z.number().int().nonnegative(),
      targetLiveResults: z.number().int().nonnegative(),
      pathsCompared: z.array(z.string()),
    })
    .optional(),
});

export const EvJsonLdReportSchema = P3ReportBaseSchema.extend({
  reportKind: z.literal('ev-jsonld-report'),
  evVersion: z.literal('1'),
  fieldKeys: z.array(z.string()),
  fields: z.array(FieldComparisonSchema),
  summary: FieldSummaryCountsSchema,
  collectorObservation: z
    .object({
      baselineLiveResults: z.number().int().nonnegative(),
      targetLiveResults: z.number().int().nonnegative(),
      pathsCompared: z.array(z.string()),
    })
    .optional(),
});

export const VectorDiffSummarySchema = z.object({
  vector: z.enum(['runtime', 'seo', 'jsonld']),
  fieldCount: z.number().int().nonnegative(),
  summary: FieldSummaryCountsSchema,
  verdict: z.enum(['GO', 'NO-GO']),
});

export const DiffSummaryReportSchema = P3ReportBaseSchema.extend({
  reportKind: z.literal('diff-summary'),
  bundleFingerprint: sha256Hex,
  artifactFingerprints: z.array(
    z.object({
      filename: z.string().min(1),
      reportFingerprint: sha256Hex,
    }),
  ),
  vectors: z.array(VectorDiffSummarySchema),
  overall: z.object({
    verdict: z.enum(['GO', 'NO-GO']),
    totalFields: z.number().int().nonnegative(),
    summary: FieldSummaryCountsSchema,
  }),
  p4Readiness: z.object({
    liveBaselineOriginRequired: z.boolean(),
    liveTargetOriginRequired: z.boolean(),
    blockers: z.array(z.string()),
  }),
});

export type EvRuntimeReport = z.infer<typeof EvRuntimeReportSchema>;
export type EvSeoReport = z.infer<typeof EvSeoReportSchema>;
export type EvJsonLdReport = z.infer<typeof EvJsonLdReportSchema>;
export type DiffSummaryReport = z.infer<typeof DiffSummaryReportSchema>;

export type P3ReportArtifact =
  | EvRuntimeReport
  | EvSeoReport
  | EvJsonLdReport
  | DiffSummaryReport;

export const P3_REPORT_FILENAMES = {
  diffSummary: 'diff-summary.json',
  evRuntime: 'ev-runtime-report.json',
  evSeo: 'ev-seo-report.json',
  evJsonLd: 'ev-jsonld-report.json',
} as const;
