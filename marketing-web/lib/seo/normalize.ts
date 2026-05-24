/**
 * Normalization helpers for semantic parity / non-byte comparison.
 * Strips noise, sorts keys, and canonicalizes URLs for stable snapshots.
 */

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeUrlForCompare(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return normalizeWhitespace(url);
  }
}

export function sortRecordKeys<T extends Record<string, unknown>>(obj: T): T {
  const sorted = Object.keys(obj)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
  return sorted as T;
}

export function deepNormalizeJson(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return normalizeWhitespace(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return value.map((item) => deepNormalizeJson(item));
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      const v = record[key];
      if (v !== undefined) {
        out[key] = deepNormalizeJson(v);
      }
    }
    return out;
  }
  return String(value);
}

export type NormalizedMetadataSnapshot = {
  title: string;
  description: string | null;
  canonical: string | null;
  robots: { index: boolean; follow: boolean };
  openGraph: Record<string, string | number | string[] | null>;
  twitter: Record<string, string | null>;
};

/** Flattens Next Metadata into a comparable snapshot. */
export function normalizeMetadataSnapshot(input: {
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  openGraph?: Record<string, unknown>;
  twitter?: Record<string, unknown>;
}): NormalizedMetadataSnapshot {
  const og: Record<string, string | number | string[] | null> = {};
  if (input.openGraph) {
    for (const [k, v] of Object.entries(input.openGraph)) {
      if (v === undefined) continue;
      og[k] = v as string | number | string[] | null;
    }
  }

  const tw: Record<string, string | null> = {};
  if (input.twitter) {
    for (const [k, v] of Object.entries(input.twitter)) {
      if (typeof v === 'string' || v === null) tw[k] = v;
    }
  }

  return {
    title: normalizeWhitespace(input.title ?? ''),
    description: input.description ? normalizeWhitespace(input.description) : null,
    canonical: input.canonical ? normalizeUrlForCompare(input.canonical) : null,
    robots: {
      index: input.robotsIndex ?? true,
      follow: input.robotsFollow ?? true,
    },
    openGraph: sortRecordKeys(og),
    twitter: sortRecordKeys(tw),
  };
}
