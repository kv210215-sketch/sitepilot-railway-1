/** Normalize ISO timestamps to UTC second precision (deterministic across runs). */
export function normalizeTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO timestamp: ${iso}`);
  }
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Fixed run timestamp for tests and reproducible report bundles. */
export function normalizeRunTimestamp(iso: string): string {
  return normalizeTimestamp(iso);
}
