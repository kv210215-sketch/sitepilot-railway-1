import {
  canonicalJsonString,
  canonicalize,
  type CanonicalJsonOptions,
} from '../serialize/canonical-json.js';
import { P3_SERIALIZATION_META } from '../report/p3-schemas.js';

/**
 * Array paths that keep caller order for EVB seal compatibility.
 * Dot paths; numeric index segments use `*` when matching nested arrays.
 */
export const REPORT_PRESERVE_ARRAY_PATHS = new Set<string>([
  'fieldKeys',
  'fields',
  'vectors',
  'collectorObservation.pathsCompared',
  'p4Readiness.blockers',
]);

export const REPORT_CANONICAL_OPTIONS: CanonicalJsonOptions = {
  preserveArrayPaths: REPORT_PRESERVE_ARRAY_PATHS,
};

export const REPORT_SERIALIZATION_FOR_SEAL = {
  ...P3_SERIALIZATION_META,
  sealCanonical: true,
  preserveArrayPaths: [...REPORT_PRESERVE_ARRAY_PATHS].sort(),
} as const;

/** Canonical JSON bytes for a report artifact (no trailing newline). */
export function canonicalReportString(value: unknown): string {
  return canonicalJsonString(value, REPORT_CANONICAL_OPTIONS);
}

export function canonicalizeReport<T>(value: T): T {
  return canonicalize(value, REPORT_CANONICAL_OPTIONS);
}
