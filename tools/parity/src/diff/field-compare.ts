import { canonicalJsonString } from '../serialize/canonical-json.js';

export type FieldComparisonStatus =
  | 'match'
  | 'mismatch'
  | 'baseline-only'
  | 'target-only'
  | 'not-collected';

export interface FieldComparison {
  fieldKey: string;
  status: FieldComparisonStatus;
  baseline: unknown | null;
  target: unknown | null;
  detail?: string;
}

function valuePresent(value: unknown): boolean {
  return value !== undefined && value !== null;
}

export function compareField(
  fieldKey: string,
  baseline: unknown,
  target: unknown,
): FieldComparison {
  const hasBaseline = valuePresent(baseline);
  const hasTarget = valuePresent(target);

  if (!hasBaseline && !hasTarget) {
    return {
      fieldKey,
      status: 'not-collected',
      baseline: null,
      target: null,
      detail: 'both sides absent',
    };
  }
  if (hasBaseline && !hasTarget) {
    return { fieldKey, status: 'baseline-only', baseline, target: null };
  }
  if (!hasBaseline && hasTarget) {
    return { fieldKey, status: 'target-only', baseline: null, target };
  }

  const baselineCanon = canonicalJsonString(baseline);
  const targetCanon = canonicalJsonString(target);
  if (baselineCanon === targetCanon) {
    return { fieldKey, status: 'match', baseline, target };
  }
  return {
    fieldKey,
    status: 'mismatch',
    baseline,
    target,
    detail: 'canonical values differ',
  };
}

export function compareFieldKeys(
  fieldKeys: readonly string[],
  baselineRecord: Record<string, unknown>,
  targetRecord: Record<string, unknown>,
): FieldComparison[] {
  return fieldKeys.map((fieldKey) =>
    compareField(fieldKey, baselineRecord[fieldKey], targetRecord[fieldKey]),
  );
}

export interface FieldSummaryCounts {
  match: number;
  mismatch: number;
  baselineOnly: number;
  targetOnly: number;
  notCollected: number;
}

export function summarizeFieldComparisons(fields: FieldComparison[]): FieldSummaryCounts {
  const counts: FieldSummaryCounts = {
    match: 0,
    mismatch: 0,
    baselineOnly: 0,
    targetOnly: 0,
    notCollected: 0,
  };
  for (const field of fields) {
    switch (field.status) {
      case 'match':
        counts.match += 1;
        break;
      case 'mismatch':
        counts.mismatch += 1;
        break;
      case 'baseline-only':
        counts.baselineOnly += 1;
        break;
      case 'target-only':
        counts.targetOnly += 1;
        break;
      case 'not-collected':
        counts.notCollected += 1;
        break;
      default: {
        const _exhaustive: never = field.status;
        throw new Error(`Unknown status: ${_exhaustive}`);
      }
    }
  }
  return counts;
}
