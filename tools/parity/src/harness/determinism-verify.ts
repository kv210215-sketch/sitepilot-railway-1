import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadParityConfig, PARITY_ROOT } from '../config/load-config.js';
import {
  assertDoubleRunAdmissible,
  buildDeterminismReport,
  collectHashMismatches,
  DETERMINISM_REPORT_FILENAME,
  executeDoubleRun,
  executeDoubleRunAsync,
  type DeterminismReport,
} from '../determinism/index.js';
import {
  createEvJsonLdSpecTemplate,
  createEvRuntimeSpecTemplate,
  createEvSeoSpecTemplate,
} from '../ev/index.js';
import { buildP3ReportBundle, type P3BuildInput, type P3ReportBundle } from '../report/p3-build.js';
import { runSnapshotComparisonSuite } from '../determinism/snapshot-comparison.js';
import { canonicalJsonString } from '../serialize/canonical-json.js';
import { normalizeRunTimestamp } from '../serialize/timestamp.js';

export const DETERMINISM_FIXED_AT = '2026-05-25T12:00:00.000Z' as const;
export const DETERMINISM_RUN_ID = 'run-determinism-verify' as const;

export interface DeterminismVerifyOptions {
  configPath?: string;
  generatedAt?: string;
  runId?: string;
  /** When true, throw on nondeterministic output (default true). */
  failOnViolation?: boolean;
}

export interface DeterminismVerifyResult {
  ok: boolean;
  reportPath: string;
  report: DeterminismReport;
}

function buildDeterministicP3Input(
  configPath: string | undefined,
  generatedAt: string,
  runId: string,
): Promise<P3BuildInput> {
  return loadParityConfig(configPath).then((config) => ({
    config,
    runId,
    generatedAt: normalizeRunTimestamp(generatedAt),
    evaluationVectors: {
      runtime: {
        baseline: createEvRuntimeSpecTemplate(),
        target: createEvRuntimeSpecTemplate(),
      },
      seo: { baseline: createEvSeoSpecTemplate(), target: createEvSeoSpecTemplate() },
      jsonld: {
        baseline: createEvJsonLdSpecTemplate(),
        target: createEvJsonLdSpecTemplate(),
      },
    },
  }));
}

function collectP3ArtifactHashes(bundle: P3ReportBundle): Array<{
  id: string;
  artifact: Record<string, unknown> & { contentHash: string; reportFingerprint: string };
}> {
  const artifacts: Array<{
    id: string;
    artifact: Record<string, unknown> & { contentHash: string; reportFingerprint: string };
  }> = [{ id: 'diff-summary', artifact: bundle.diffSummary }];
  if (bundle.evRuntime) {
    artifacts.push({ id: 'ev-runtime-report', artifact: bundle.evRuntime });
  }
  if (bundle.evSeo) {
    artifacts.push({ id: 'ev-seo-report', artifact: bundle.evSeo });
  }
  if (bundle.evJsonLd) {
    artifacts.push({ id: 'ev-jsonld-report', artifact: bundle.evJsonLd });
  }
  return artifacts;
}

export async function runDeterminismVerification(
  options: DeterminismVerifyOptions = {},
): Promise<DeterminismVerifyResult> {
  const config = await loadParityConfig(options.configPath);
  const generatedAt = options.generatedAt ?? DETERMINISM_FIXED_AT;
  const runId = options.runId ?? DETERMINISM_RUN_ID;
  const failOnViolation = options.failOnViolation ?? true;

  const p3Input = await buildDeterministicP3Input(options.configPath, generatedAt, runId);

  const snapshotDoubleRun = await executeDoubleRunAsync('snapshot-comparison-suite', () =>
    runSnapshotComparisonSuite(),
  );

  const p3DoubleRun = executeDoubleRun('p3-report-bundle', () => buildP3ReportBundle(p3Input));

  const hashMismatches = collectHashMismatches(collectP3ArtifactHashes(p3DoubleRun.runA));

  const report = buildDeterminismReport({
    generatedAt,
    snapshotDoubleRun,
    p3DoubleRun,
    hashMismatches,
  });

  const reportDir = path.resolve(PARITY_ROOT, config.reportDir);
  await mkdir(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, DETERMINISM_REPORT_FILENAME);
  await writeFile(reportPath, `${canonicalJsonString(report)}\n`, 'utf8');

  const ok = report.verdict === 'PASS';

  if (!ok && failOnViolation) {
    if (!snapshotDoubleRun.admissible) {
      assertDoubleRunAdmissible(snapshotDoubleRun);
    }
    if (!p3DoubleRun.admissible) {
      assertDoubleRunAdmissible(p3DoubleRun);
    }
    if (hashMismatches.length > 0) {
      throw new Error(
        `Determinism hash validation failed: ${hashMismatches.map((m) => m.artifactId).join(', ')}`,
      );
    }
    throw new Error('Determinism verification failed (ordering or verdict drift)');
  }

  return { ok, reportPath, report };
}
