import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadParityConfig, PARITY_ROOT } from '../config/load-config.js';
import type { ParityConfig, ParityVector } from '../config/parity-config.schema.js';
import {
  buildCollectorContext,
  collectForVectors,
  createCollectorSuite,
  planForVectors,
} from '../collectors/registry.js';
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
import { isNetworkBlockedByPolicy } from '../http/network-policy.js';
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

function assessP2Readiness(safetyOk: boolean, config: ParityConfig): DryRunReport['p2Readiness'] {
  const blockers: string[] = [];
  if (!safetyOk) {
    blockers.push('safety-check-failed');
  }
  const liveReady =
    config.liveMode &&
    config.baseline.origin !== null &&
    config.target.origin !== null &&
    safetyOk;
  return {
    readOnlyCollectors: safetyOk ? 'GO' : 'NO-GO',
    liveCollectors: liveReady ? 'GO' : 'NO-GO',
    blockers,
  };
}

function printPlannedActions(planned: DryRunReport['collectors']['planned']): void {
  console.log('[parity-harness] planned collector actions (no network when liveMode=false):');
  for (const action of planned) {
    const skip = action.skipReason ? ` — skip: ${action.skipReason}` : '';
    console.log(`  ${action.vector.padEnd(7)} GET ${action.url}${skip}`);
  }
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

  const suite = createCollectorSuite(config);
  const baselineCtx = buildCollectorContext(config, 'baseline');
  const targetCtx = buildCollectorContext(config, 'target');
  const planned = planForVectors(suite, config.vectors, baselineCtx, targetCtx);

  printPlannedActions(planned);

  const collectorResults = await collectForVectors(
    suite,
    config.vectors,
    baselineCtx,
    targetCtx,
  );

  const networkBlockedByPolicy = isNetworkBlockedByPolicy(config.liveMode);

  const networkExecuted =
    !networkBlockedByPolicy &&
    Boolean(config.baseline.origin || config.target.origin) &&
    Object.values(collectorResults).some((bundle) => {
      if (!bundle) {
        return false;
      }
      const sides = [bundle.baseline, bundle.target].flat();
      return sides.some((r) => r.source === 'live');
    });

  if (networkBlockedByPolicy && networkExecuted) {
    safety.violations.push('network-policy-violation: HTTP executed while liveMode=false');
    safety.ok = false;
  }

  if (safety.warnings.length > 0) {
    for (const w of safety.warnings) {
      console.log(`[parity-harness] warning: ${w}`);
    }
  }

  const timestamp = new Date().toISOString();
  const report: DryRunReport = {
    harnessVersion: 'p2',
    mode: 'dry-run',
    timestamp,
    branchHint: 'feature/parity-harness-p1',
    config,
    safety,
    evaluationVectors: buildEvaluationVectors(config.vectors),
    collectors: {
      planned,
      results: collectorResults,
      networkExecuted,
      networkBlockedByPolicy,
    },
    p2Readiness: assessP2Readiness(safety.ok, config),
    p3Readiness: {
      diffEngine: 'GO',
      blockers: ['run-npm-run-p3-report-for-artifacts'],
    },
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
