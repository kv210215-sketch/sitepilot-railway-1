import path from 'node:path';
import { PARITY_ROOT } from '../config/load-config.js';

export const P3_REPORT_SUBDIR = 'p3' as const;

export function resolveP3RunDirectory(reportDirRelative: string, runId: string): string {
  return path.resolve(PARITY_ROOT, reportDirRelative, P3_REPORT_SUBDIR, runId);
}

/**
 * Ensures report writes stay under tools/parity/{reportDir}/p3/{runId}/ only.
 */
export function assertP3ReportWriteAllowed(
  reportDirRelative: string,
  runId: string,
  targetFilePath: string,
): void {
  const runDir = resolveP3RunDirectory(reportDirRelative, runId);
  const resolvedTarget = path.resolve(targetFilePath);
  const resolvedRun = path.resolve(runDir);
  const parityRoot = path.resolve(PARITY_ROOT);

  if (!resolvedTarget.startsWith(resolvedRun + path.sep) && resolvedTarget !== resolvedRun) {
    throw new Error(
      `P3 report isolation violation: ${resolvedTarget} is outside run directory ${resolvedRun}`,
    );
  }
  if (!resolvedRun.startsWith(parityRoot + path.sep)) {
    throw new Error(`P3 report isolation violation: run directory escapes parity root`);
  }
  if (path.basename(resolvedTarget).startsWith('..')) {
    throw new Error('P3 report isolation violation: suspicious filename');
  }
}

export function p3AllowedWriteRoots(reportDirRelative: string, runId: string): string[] {
  return [resolveP3RunDirectory(reportDirRelative, runId)];
}
