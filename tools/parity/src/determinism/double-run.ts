import { contentHashSha256 } from '../hash/content-hash.js';
import { canonicalJsonString } from '../serialize/canonical-json.js';
import type { DoubleRunMismatch, DoubleRunResult } from './types.js';

function collectStructuralMismatches(
  runA: unknown,
  runB: unknown,
  path = '',
): DoubleRunMismatch[] {
  const canonA = canonicalJsonString(runA);
  const canonB = canonicalJsonString(runB);
  if (canonA === canonB) {
    return [];
  }
  const mismatches: DoubleRunMismatch[] = [
    { path: path || '$', runA: canonA, runB: canonB },
  ];

  if (
    typeof runA !== 'object' ||
    runA === null ||
    typeof runB !== 'object' ||
    runB === null ||
    Array.isArray(runA) ||
    Array.isArray(runB)
  ) {
    return mismatches;
  }

  const keys = new Set([...Object.keys(runA), ...Object.keys(runB)]);
  for (const key of [...keys].sort()) {
    const nextPath = path ? `${path}.${key}` : key;
    const a = (runA as Record<string, unknown>)[key];
    const b = (runB as Record<string, unknown>)[key];
    if (canonicalJsonString(a) !== canonicalJsonString(b)) {
      mismatches.push(...collectStructuralMismatches(a, b, nextPath));
    }
  }
  return mismatches;
}

/**
 * Execute the same pure comparison twice and require byte-identical canonical output.
 */
function buildDoubleRunResult<T>(label: string, runA: T, runB: T): DoubleRunResult<T> {
  const canonicalA = canonicalJsonString(runA);
  const canonicalB = canonicalJsonString(runB);
  const contentHashRunA = contentHashSha256(runA);
  const contentHashRunB = contentHashSha256(runB);
  const canonicalMatch = canonicalA === canonicalB;
  const hashMatch = contentHashRunA === contentHashRunB;
  const admissible = canonicalMatch && hashMatch;

  return {
    label,
    admissible,
    canonicalMatch,
    hashMatch,
    contentHashRunA,
    contentHashRunB,
    runA,
    runB,
    mismatches: admissible ? [] : collectStructuralMismatches(runA, runB),
  };
}

export function executeDoubleRun<T>(label: string, fn: () => T): DoubleRunResult<T> {
  return buildDoubleRunResult(label, fn(), fn());
}

export async function executeDoubleRunAsync<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<DoubleRunResult<T>> {
  const runA = await fn();
  const runB = await fn();
  return buildDoubleRunResult(label, runA, runB);
}

export class DeterminismViolationError extends Error {
  readonly label: string;
  readonly mismatches: DoubleRunMismatch[];

  constructor(label: string, mismatches: DoubleRunMismatch[]) {
    super(`Determinism violation in "${label}": ${mismatches.length} mismatch(es)`);
    this.name = 'DeterminismViolationError';
    this.label = label;
    this.mismatches = mismatches;
  }
}

export function assertDoubleRunAdmissible<T>(result: DoubleRunResult<T>): void {
  if (!result.admissible) {
    throw new DeterminismViolationError(result.label, result.mismatches);
  }
}
