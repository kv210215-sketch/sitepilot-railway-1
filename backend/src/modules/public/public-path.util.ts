/**
 * Normalizes URL path segments from the public read API.
 * Always returns a leading slash; root is `/`.
 */
export function normalizePublicPagePath(raw: string | string[] | undefined): string {
  const joined = Array.isArray(raw) ? raw.join('/') : (raw ?? '');
  let path = decodeURIComponent(joined).trim();

  if (!path || path === '/') {
    return '/';
  }

  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  return path;
}
