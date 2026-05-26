/**
 * Deterministic JSON: sorted object keys, stable array handling, no whitespace.
 */

export interface CanonicalJsonOptions {
  /**
   * When set, these array paths (dot-separated, numeric segments as `*`) keep caller order.
   * All other arrays are sorted by canonical element string.
   */
  preserveArrayPaths?: Set<string>;
}

const DEFAULT_OPTIONS: CanonicalJsonOptions = {};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

function pathJoin(base: string, segment: string | number): string {
  const seg = String(segment);
  return base ? `${base}.${seg}` : seg;
}

function canonicalizeValue(
  value: unknown,
  path: string,
  options: CanonicalJsonOptions,
): unknown {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    const mapped = value.map((item, index) =>
      canonicalizeValue(item, pathJoin(path, index), options),
    );
    const preserve = options.preserveArrayPaths?.has(path);
    if (preserve) {
      return mapped;
    }
    return [...mapped].sort((a, b) =>
      canonicalJsonString(a).localeCompare(canonicalJsonString(b)),
    );
  }
  if (!isPlainObject(value)) {
    return value;
  }
  const sortedKeys = Object.keys(value).sort();
  const out: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    out[key] = canonicalizeValue(value[key], pathJoin(path, key), options);
  }
  return out;
}

/** Recursively sort keys; optionally sort array elements for stable hashing. */
export function canonicalize<T>(value: T, options: CanonicalJsonOptions = DEFAULT_OPTIONS): T {
  return canonicalizeValue(value, '', options) as T;
}

export function canonicalJsonString(value: unknown, options?: CanonicalJsonOptions): string {
  return JSON.stringify(canonicalize(value, options));
}
