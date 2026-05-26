import type { ParityVector } from '../config/parity-config.schema.js';
import {
  createEvJsonLdSpecTemplate,
  createEvRuntimeSpecTemplate,
  createEvSeoSpecTemplate,
} from '../ev/index.js';
import { runDryRun, type DryRunOptions, type DryRunResult } from './dry-run.js';
import {
  buildP3ReportBundle,
  type EvaluationVectorPair,
  type P3BuildInput,
  type P3ReportBundle,
} from '../report/p3-build.js';
import { deriveP3RunId } from '../report/p3-run-id.js';
import { p3AllowedWriteRoots } from '../report/p3-isolation.js';
import { writeP3ReportBundle, type P3WriteResult } from '../report/p3-writer.js';
import { normalizeRunTimestamp } from '../serialize/timestamp.js';

export interface P3ReportOptions extends DryRunOptions {
  /** Override run timestamp (tests). */
  generatedAt?: string;
  /** Override run id (tests). */
  runId?: string;
}

export interface P3ReportResult {
  ok: boolean;
  dryRun: DryRunResult;
  runId: string;
  bundle: P3ReportBundle;
  writeResult: P3WriteResult;
  isolation: {
    allowedWriteRoots: string[];
  };
}

function buildEvaluationVectorPair(vectors: ParityVector[]): EvaluationVectorPair {
  const pair: EvaluationVectorPair = {};
  if (vectors.includes('runtime')) {
    const template = createEvRuntimeSpecTemplate();
    pair.runtime = { baseline: template, target: template };
  }
  if (vectors.includes('seo')) {
    const template = createEvSeoSpecTemplate();
    pair.seo = { baseline: template, target: template };
  }
  if (vectors.includes('jsonld')) {
    const template = createEvJsonLdSpecTemplate();
    pair.jsonld = { baseline: template, target: template };
  }
  return pair;
}

export async function runP3Report(options: P3ReportOptions = {}): Promise<P3ReportResult> {
  const dryRun = await runDryRun(options);
  const config = dryRun.report.config;
  const generatedAt = options.generatedAt ?? dryRun.report.timestamp;
  const runId = options.runId ?? deriveP3RunId(config);

  const buildInput: P3BuildInput = {
    config,
    runId,
    generatedAt: normalizeRunTimestamp(generatedAt),
    evaluationVectors: buildEvaluationVectorPair(config.vectors),
    collectorResults: dryRun.report.collectors.results,
  };

  const bundle = buildP3ReportBundle(buildInput);
  const writeResult = await writeP3ReportBundle(bundle, config.reportDir, runId);

  return {
    ok: dryRun.ok && bundle.diffSummary.overall.verdict === 'GO',
    dryRun,
    runId,
    bundle,
    writeResult,
    isolation: {
      allowedWriteRoots: p3AllowedWriteRoots(config.reportDir, runId),
    },
  };
}
