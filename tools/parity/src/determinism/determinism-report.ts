import { z } from 'zod';
import { contentHashSha256 } from '../hash/content-hash.js';
import { P3_SERIALIZATION_META } from '../report/p3-schemas.js';
import { normalizeRunTimestamp } from '../serialize/timestamp.js';
import type { DoubleRunResult } from './types.js';
import type { HashMismatch, DeterminismVerdict } from './types.js';
import type { SnapshotComparisonSuite } from './snapshot-comparison.js';
import type { P3ReportBundle } from '../report/p3-build.js';

export const DETERMINISM_REPORT_FILENAME = 'determinism-report.json' as const;

const DoubleRunSummarySchema = z.object({
  label: z.string(),
  admissible: z.boolean(),
  canonicalMatch: z.boolean(),
  hashMatch: z.boolean(),
  contentHashRunA: z.string().regex(/^[a-f0-9]{64}$/),
  contentHashRunB: z.string().regex(/^[a-f0-9]{64}$/),
  mismatchCount: z.number().int().nonnegative(),
});

const SnapshotComparisonRecordSchema = z.object({
  caseId: z.string(),
  baselineSnapshotHash: z.string().regex(/^[a-f0-9]{64}$/),
  targetSnapshotHash: z.string().regex(/^[a-f0-9]{64}$/),
  driftHash: z.string().regex(/^[a-f0-9]{64}$/),
  verdict: z.enum(['pass', 'warning', 'fail']),
  reasons: z.array(z.string()),
});

export const DeterminismReportSchema = z.object({
  reportKind: z.literal('determinism-report'),
  harnessVersion: z.literal('p3'),
  generatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  verdict: z.enum(['PASS', 'FAIL']),
  hashAlgorithm: z.literal('sha256'),
  serialization: z.object({
    canonical: z.literal(true),
    keyOrdering: z.literal('sorted'),
    arrayOrdering: z.literal('stable-sorted-unless-preserved'),
    whitespace: z.literal('none'),
  }),
  doubleRun: z.object({
    snapshotSuite: DoubleRunSummarySchema,
    p3Bundle: DoubleRunSummarySchema,
  }),
  snapshotSuite: z.object({
    caseOrdering: z.array(z.string()),
    comparisons: z.array(SnapshotComparisonRecordSchema),
    suiteHash: z.string().regex(/^[a-f0-9]{64}$/),
  }),
  p3BundleHashes: z.object({
    diffSummary: z.string().regex(/^[a-f0-9]{64}$/),
    diffSummaryReportFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    bundleFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    evRuntime: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    evSeo: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    evJsonLd: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  }),
  hashValidation: z.object({
    artifactsChecked: z.number().int().nonnegative(),
    mismatches: z.array(
      z.object({
        artifactId: z.string(),
        declaredHash: z.string(),
        computedHash: z.string(),
      }),
    ),
  }),
  guarantees: z.object({
    identicalHashes: z.boolean(),
    identicalReports: z.boolean(),
    identicalOrdering: z.boolean(),
    identicalVerdicts: z.boolean(),
  }),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export type DeterminismReport = z.infer<typeof DeterminismReportSchema>;

function summarizeDoubleRun<T>(result: DoubleRunResult<T>): z.infer<typeof DoubleRunSummarySchema> {
  return {
    label: result.label,
    admissible: result.admissible,
    canonicalMatch: result.canonicalMatch,
    hashMatch: result.hashMatch,
    contentHashRunA: result.contentHashRunA,
    contentHashRunB: result.contentHashRunB,
    mismatchCount: result.mismatches.length,
  };
}

function bundleContentHashes(bundle: P3ReportBundle): DeterminismReport['p3BundleHashes'] {
  return {
    diffSummary: bundle.diffSummary.contentHash,
    diffSummaryReportFingerprint: bundle.diffSummary.reportFingerprint,
    bundleFingerprint: bundle.diffSummary.bundleFingerprint,
    evRuntime: bundle.evRuntime?.contentHash,
    evSeo: bundle.evSeo?.contentHash,
    evJsonLd: bundle.evJsonLd?.contentHash,
  };
}

export interface BuildDeterminismReportInput {
  generatedAt: string;
  snapshotDoubleRun: DoubleRunResult<SnapshotComparisonSuite>;
  p3DoubleRun: DoubleRunResult<P3ReportBundle>;
  hashMismatches: HashMismatch[];
}

export function buildDeterminismReport(input: BuildDeterminismReportInput): DeterminismReport {
  const snapshotSuite = input.snapshotDoubleRun.runA;
  const p3Bundle = input.p3DoubleRun.runA;

  const identicalHashes =
    input.snapshotDoubleRun.hashMatch &&
    input.p3DoubleRun.hashMatch &&
    input.hashMismatches.length === 0;
  const identicalReports =
    input.snapshotDoubleRun.canonicalMatch && input.p3DoubleRun.canonicalMatch;
  const identicalOrdering =
    input.snapshotDoubleRun.admissible &&
    snapshotSuite.caseOrdering.join('|') === input.snapshotDoubleRun.runB.caseOrdering.join('|');
  const identicalVerdicts =
    input.snapshotDoubleRun.admissible &&
    snapshotSuite.comparisons.every(
      (c, i) => c.verdict === input.snapshotDoubleRun.runB.comparisons[i]?.verdict,
    );

  const guarantees = {
    identicalHashes,
    identicalReports,
    identicalOrdering,
    identicalVerdicts,
  };

  const admissible =
    input.snapshotDoubleRun.admissible &&
    input.p3DoubleRun.admissible &&
    input.hashMismatches.length === 0 &&
    identicalOrdering &&
    identicalVerdicts;

  const verdict: DeterminismVerdict = admissible ? 'PASS' : 'FAIL';

  const bodyWithoutHash = {
    reportKind: 'determinism-report' as const,
    harnessVersion: 'p3' as const,
    generatedAt: normalizeRunTimestamp(input.generatedAt),
    verdict,
    hashAlgorithm: 'sha256' as const,
    serialization: P3_SERIALIZATION_META,
    doubleRun: {
      snapshotSuite: summarizeDoubleRun(input.snapshotDoubleRun),
      p3Bundle: summarizeDoubleRun(input.p3DoubleRun),
    },
    snapshotSuite,
    p3BundleHashes: bundleContentHashes(p3Bundle),
    hashValidation: {
      artifactsChecked:
        1 +
        (p3Bundle.evRuntime ? 1 : 0) +
        (p3Bundle.evSeo ? 1 : 0) +
        (p3Bundle.evJsonLd ? 1 : 0),
      mismatches: input.hashMismatches,
    },
    guarantees,
  };

  const contentHash = contentHashSha256(bodyWithoutHash);
  return DeterminismReportSchema.parse({ ...bodyWithoutHash, contentHash });
}
