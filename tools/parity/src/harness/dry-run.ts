import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadParityConfig, PARITY_ROOT } from '../config/load-config.js';
import type { ParityConfig, ParityVector } from '../config/parity-config.schema.js';
import {
  createEvJsonLdSpecTemplate,
  createEvRuntimeSpecTemplate,
  createEvSeoSpecTemplate,
} from '../ev/index.js';
import {
  assertDryRunSafe,
  assertNoForbiddenDeps,
  SAFETY_GUARANTEES,
} from '../safety/guards.js';
import { writeDryRunReport, type DryRunReport } from '../report/dry-run-report.js';

export interface DryRunOptions {
  configPath?: string;
}

export interface DryRunResult {
  ok: boolean;
  reportPath: string;
  report: DryRunReport;
}

function buildEvaluationVectors(vectors: ParityVector[]): DryRunReport['evaluationVectors'] {
  const out: DryRunReport['evaluationVectors'] = {};
  if (vectors.includes('runtime')) {
    out.runtime = createEvRuntimeSpecTemplate();
  }
  if (vectors.includes('seo')) {
    out.seo = createEvSeoSpecTemplate();
  }
  if (vectors.includes('jsonld')) {
    out.jsonld = createEvJsonLdSpecTemplate();
  }
  return out;
}

function assessP2Readiness(safetyOk: boolean): DryRunReport['p2Readiness'] {
  const blockers: string[] = ['collectors-not-implemented', 'liveMode-must-stay-false-until-p2-design'];
  if (!safetyOk) {
    blockers.push('safety-check-failed');
  }
  return {
    schemaAndShapes: safetyOk ? 'GO' : 'NO-GO',
    liveCollectors: 'NO-GO',
    blockers,
  };
}

export async function runDryRun(options: DryRunOptions = {}): Promise<DryRunResult> {
  const config = await loadParityConfig(options.configPath);
  const safety = assertDryRunSafe(config);

  const pkgPath = path.join(PARITY_ROOT, 'package.json');
  const pkgRaw = await readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(pkgRaw) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const depNames = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ];
  const forbidden = assertNoForbiddenDeps(depNames);
  if (forbidden.length > 0) {
    safety.violations.push(`forbidden-dependencies: ${forbidden.join(', ')}`);
    safety.ok = false;
  }

  const timestamp = new Date().toISOString();
  const report: DryRunReport = {
    harnessVersion: 'p1',
    mode: 'dry-run',
    timestamp,
    branchHint: 'feature/parity-harness-p1',
    config,
    safety,
    evaluationVectors: buildEvaluationVectors(config.vectors),
    p2Readiness: assessP2Readiness(safety.ok),
    isolation: {
      workspaceRoot: PARITY_ROOT,
      allowedWriteRoots: [path.join(PARITY_ROOT, config.reportDir)],
    },
  };

  const reportPath = await writeDryRunReport(report, config.reportDir);

  return {
    ok: safety.ok,
    reportPath,
    report,
  };
}

export { SAFETY_GUARANTEES };
