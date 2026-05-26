import type { CollectorEndpoint } from './types.js';

export function resolveCollectUrl(endpoint: CollectorEndpoint, path: string): string | null {
  if (!endpoint.origin) {
    return null;
  }
  const base = endpoint.origin.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function formatPlannedUrl(endpoint: CollectorEndpoint, path: string): string {
  const resolved = resolveCollectUrl(endpoint, path);
  if (resolved) {
    return resolved;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `{origin:null}${normalizedPath}`;
}
