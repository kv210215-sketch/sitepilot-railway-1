import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { canonicalReportString } from '../seal/canonical-report.js';
import {
  DiffSummaryReportSchema,
  EvJsonLdReportSchema,
  EvRuntimeReportSchema,
  EvSeoReportSchema,
  P3_REPORT_FILENAMES,
  type DiffSummaryReport,
  type EvJsonLdReport,
  type EvRuntimeReport,
  type EvSeoReport,
  type P3ReportArtifact,
} from './p3-schemas.js';
import { assertP3ReportWriteAllowed, resolveP3RunDirectory } from './p3-isolation.js';
import type { P3ReportBundle } from './p3-build.js';

function validateArtifact(artifact: P3ReportArtifact): P3ReportArtifact {
  switch (artifact.reportKind) {
    case 'diff-summary':
      return DiffSummaryReportSchema.parse(artifact);
    case 'ev-runtime-report':
      return EvRuntimeReportSchema.parse(artifact);
    case 'ev-seo-report':
      return EvSeoReportSchema.parse(artifact);
    case 'ev-jsonld-report':
      return EvJsonLdReportSchema.parse(artifact);
    default: {
      const _exhaustive: never = artifact;
      throw new Error(`Unknown report kind: ${(_exhaustive as P3ReportArtifact).reportKind}`);
    }
  }
}

async function writeValidatedReport(
  reportDirRelative: string,
  runId: string,
  filename: string,
  artifact: P3ReportArtifact,
): Promise<string> {
  const validated = validateArtifact(artifact);
  const runDir = resolveP3RunDirectory(reportDirRelative, runId);
  const outPath = path.join(runDir, filename);
  assertP3ReportWriteAllowed(reportDirRelative, runId, outPath);
  await mkdir(runDir, { recursive: true });
  const payload = `${canonicalReportString(validated)}\n`;
  await writeFile(outPath, payload, 'utf8');
  return outPath;
}

export interface P3WriteResult {
  runDirectory: string;
  files: {
    diffSummary: string;
    evRuntime?: string;
    evSeo?: string;
    evJsonLd?: string;
  };
}

export async function writeP3ReportBundle(
  bundle: P3ReportBundle,
  reportDirRelative: string,
  runId: string,
): Promise<P3WriteResult> {
  const diffSummaryPath = await writeValidatedReport(
    reportDirRelative,
    runId,
    P3_REPORT_FILENAMES.diffSummary,
    bundle.diffSummary,
  );

  const files: P3WriteResult['files'] = { diffSummary: diffSummaryPath };

  if (bundle.evRuntime) {
    files.evRuntime = await writeValidatedReport(
      reportDirRelative,
      runId,
      P3_REPORT_FILENAMES.evRuntime,
      bundle.evRuntime,
    );
  }
  if (bundle.evSeo) {
    files.evSeo = await writeValidatedReport(
      reportDirRelative,
      runId,
      P3_REPORT_FILENAMES.evSeo,
      bundle.evSeo,
    );
  }
  if (bundle.evJsonLd) {
    files.evJsonLd = await writeValidatedReport(
      reportDirRelative,
      runId,
      P3_REPORT_FILENAMES.evJsonLd,
      bundle.evJsonLd,
    );
  }

  return {
    runDirectory: resolveP3RunDirectory(reportDirRelative, runId),
    files,
  };
}
