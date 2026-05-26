/** Strip tags and collapse whitespace for a short text excerpt. */
export function htmlToTextExcerpt(html: string, maxLen = 240): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLen) {
    return text;
  }
  return `${text.slice(0, maxLen)}…`;
}

export function extractTitle(html: string): string | null {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!match?.[1]) {
    return null;
  }
  return match[1].replace(/\s+/g, ' ').trim() || null;
}

function readMetaContent(html: string, attr: 'name' | 'property', key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${escapeRegExp(key)}["'][^>]+content=["']([^"']*)["']`,
    'i',
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${escapeRegExp(key)}["']`,
    'i',
  );
  return re.exec(html)?.[1]?.trim() ?? alt.exec(html)?.[1]?.trim() ?? null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractMetaDescription(html: string): string | null {
  return readMetaContent(html, 'name', 'description');
}

export function extractCanonical(html: string): string | null {
  const match =
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i.exec(html) ??
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i.exec(html);
  return match?.[1]?.trim() ?? null;
}

export function extractRobotsMeta(html: string): string | null {
  return readMetaContent(html, 'name', 'robots');
}

export function extractMetaTagsByPrefix(
  html: string,
  attr: 'name' | 'property',
  prefix: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  const re = new RegExp(
    `<meta[^>]+${attr}=["'](${escapeRegExp(prefix)}[^"']*)["'][^>]+content=["']([^"']*)["']`,
    'gi',
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const key = m[1]?.trim();
    const value = m[2]?.trim();
    if (key && value) {
      out[key] = value;
    }
  }
  return out;
}

export function extractOpenGraph(html: string): Record<string, string> {
  return extractMetaTagsByPrefix(html, 'property', 'og:');
}

export function extractTwitterCard(html: string): Record<string, string> {
  return extractMetaTagsByPrefix(html, 'name', 'twitter:');
}

export function extractSectionIds(html: string): string[] {
  const ids: string[] = [];
  const re = /<section[^>]+id=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const id = m[1]?.trim();
    if (id) {
      ids.push(id);
    }
  }
  return ids;
}

export function hasLeadForm(html: string, selectorHint = '#mainForm'): boolean {
  const id = selectorHint.startsWith('#') ? selectorHint.slice(1) : selectorHint;
  return new RegExp(`<form[^>]+id=["']${escapeRegExp(id)}["']`, 'i').test(html);
}

export interface JsonLdScriptBlock {
  index: number;
  raw: string;
}

export function extractJsonLdScripts(html: string): JsonLdScriptBlock[] {
  const blocks: JsonLdScriptBlock[] = [];
  const re =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  let index = 0;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1]?.trim() ?? '';
    if (raw.length > 0) {
      blocks.push({ index, raw });
      index += 1;
    }
  }
  return blocks;
}

export function summarizeJsonLdTypes(raw: string): { types: string[]; parseOk: boolean; parseError?: string } {
  try {
    const parsed: unknown = JSON.parse(raw);
    const types = collectJsonLdTypes(parsed);
    return { types: [...new Set(types)].sort(), parseOk: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { types: [], parseOk: false, parseError: message };
  }
}

function collectJsonLdTypes(node: unknown, acc: string[] = []): string[] {
  if (node === null || node === undefined) {
    return acc;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      collectJsonLdTypes(item, acc);
    }
    return acc;
  }
  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    const t = obj['@type'];
    if (typeof t === 'string') {
      acc.push(t);
    } else if (Array.isArray(t)) {
      for (const entry of t) {
        if (typeof entry === 'string') {
          acc.push(entry);
        }
      }
    }
    if (Array.isArray(obj['@graph'])) {
      collectJsonLdTypes(obj['@graph'], acc);
    }
    for (const value of Object.values(obj)) {
      if (value !== obj['@graph']) {
        collectJsonLdTypes(value, acc);
      }
    }
  }
  return acc;
}

export function buildRuntimeBodySummary(html: string): RuntimeBodySummaryFromHtml {
  const sectionIds = extractSectionIds(html);
  const text = htmlToTextExcerpt(html, 10_000);
  return {
    htmlLength: html.length,
    textLength: text.length,
    excerpt: htmlToTextExcerpt(html, 240),
    sectionIdCount: sectionIds.length,
    anchorIdSample: sectionIds.slice(0, 12),
    hasLeadForm: hasLeadForm(html),
  };
}

export interface RuntimeBodySummaryFromHtml {
  htmlLength: number;
  textLength: number;
  excerpt: string;
  sectionIdCount: number;
  anchorIdSample: string[];
  hasLeadForm: boolean;
}
