export interface NamedDigest {
  name: string;
  digest: string;
}

/**
 * Stable lexicographic ordering for bundle hash inputs (OSCTL projection_fingerprint style).
 */
export function orderNamedDigests(entries: NamedDigest[]): NamedDigest[] {
  return [...entries].sort((a, b) => a.name.localeCompare(b.name));
}

export function orderDigestMap(entries: Record<string, string>): NamedDigest[] {
  return orderNamedDigests(
    Object.entries(entries).map(([name, digest]) => ({ name, digest })),
  );
}
