export type PublicPageBlockType =
  | 'hero'
  | 'pain'
  | 'steps'
  | 'numbers'
  | 'audience'
  | 'guarantees'
  | 'cta'
  | 'faq'
  | 'offers'
  | 'trust'
  | 'testimonials'
  | 'cases'
  | 'roi_calculator'
  | 'lead_form'
  | 'links'
  | 'city_links'
  | 'contact_info'
  | 'seo_text'
  | 'custom'
  | (string & {});

export interface PublicPageBlock {
  type: PublicPageBlockType;
  order: number;
  data: Record<string, unknown>;
}

/** Mirrors backend PublicPageDto (read-only public API). */
export interface PublicPageDto {
  /** Owning project id + this page id — used to attribute public lead submissions. */
  projectId?: string;
  pageId?: string;
  path: string;
  title: string;
  metaDescription: string | null;
  canonicalUrl: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  seoKeywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  structuredData?: Record<string, unknown> | null;
  blocks: PublicPageBlock[];
  updatedAt: string;
  publishedAt?: string | null;
  isHomepage?: boolean;
}

export interface PublicSitemapEntry {
  path: string;
  robotsIndex: boolean;
  updatedAt: string;
  publishedAt: string | null;
  isHomepage: boolean;
}

export class PublicApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'PublicApiError';
  }
}

function publicApiBaseUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_PUBLIC_API_URL?.trim().replace(/\/$/, '');
  return base || null;
}

/** Normalizes route segments to backend Page.path (leading slash, no trailing slash). */
export function normalizePagePath(raw: string | string[] | undefined): string {
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

/** Builds GET /public/v1/pages/* URL for a normalized path. */
export function publicPageRequestUrl(path: string): string | null {
  const base = publicApiBaseUrl();
  if (!base) {
    return null;
  }
  const normalized = normalizePagePath(path);
  if (normalized === '/') {
    return `${base}/public/v1/pages/`;
  }
  const suffix = normalized.slice(1);
  return `${base}/public/v1/pages/${suffix}`;
}

/**
 * Fetches a published page. Returns null when the API responds with 404.
 */
export async function fetchPublicPage(path: string): Promise<PublicPageDto | null> {
  const url = publicPageRequestUrl(path);
  if (!url) {
    return null;
  }

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new PublicApiError(
      `Public API ${res.status} for ${normalizePagePath(path)}`,
      res.status,
    );
  }

  return (await res.json()) as PublicPageDto;
}

/** Builds POST /public/v1/leads URL for client-side lead submission. */
export function publicLeadSubmitUrl(): string | null {
  const base = publicApiBaseUrl();
  return base ? `${base}/public/v1/leads` : null;
}

function publicCatalogUrl(suffix: string): string | null {
  const base = publicApiBaseUrl();
  if (!base) return null;
  return `${base}/public/v1/${suffix}`;
}

/** Published pages for sitemap.xml generation. */
export async function fetchPublicSitemapEntries(): Promise<PublicSitemapEntry[]> {
  const url = publicCatalogUrl('sitemap-entries');
  if (!url) {
    return [];
  }

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new PublicApiError(`Public sitemap API ${res.status}`, res.status);
  }

  return (await res.json()) as PublicSitemapEntry[];
}
