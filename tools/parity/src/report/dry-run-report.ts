import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ParityConfig } from '../config/parity-config.schema.js';
import type { EvJsonLdShape, EvRuntimeShape, EvSeoShape } from '../ev/index.js';
import { PARITY_ROOT } from '../config/load-config.js';
import type { SafetyCheckResult } from '../safety/guards.js';

export interface DryRunReport {
  harnessVersion: 'p1';
  mode: 'dry-run';
  timestamp: string;
  branchHint: string;
  config: ParityConfig;
  safety: SafetyCheckResult;
  evaluationVectors: {
    runtime?: EvRuntimeShape;
    seo?: EvSeoShape;
    jsonld?: EvJsonLdShape;
  };
  p2Readiness: {
    schemaAndShapes: 'GO' | 'NO-GO';
    liveCollectors: 'GO' | 'NO-GO';
    blockers: string[];
  };
  isolation: {
    workspaceRoot: string;
    allowedWriteRoots: string[];
  };
}

export async function writeDryRunReport(
  report: DryRunReport,
  reportDirRelative: string,
): Promise<string> {
  const reportDir = path.resolve(PARITY_ROOT, reportDirRelative);
  await mkdir(reportDir, { recursive: true });

  const stamp = report.timestamp.replace(/[:.]/g, '-');
  const filename = `dry-run-${stamp}.json`;
  const outPath = path.join(reportDir, filename);

  await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return outPath;
}
