/**
 * JSON-LD validation and safe fallbacks (non-blocking at runtime).
 */

const SCHEMA_TYPES = new Set([
  'LocalBusiness',
  'FAQPage',
  'WebSite',
  'BreadcrumbList',
  'Organization',
  'Question',
  'Answer',
  'ListItem',
  'WebPage',
]);

export type SchemaValidationIssue = {
  code: string;
  message: string;
};

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseStructuredData(
  raw: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!raw || !isPlainObject(raw)) return null;
  if (Object.keys(raw).length === 0) return null;
  return raw;
}

function collectTypes(node: unknown, types: Set<string>): void {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach((item) => collectTypes(item, types));
    return;
  }
  if (!isPlainObject(node)) return;

  const t = node['@type'];
  if (typeof t === 'string') types.add(t);
  if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && types.add(x));

  for (const value of Object.values(node)) {
    if (value === node['@graph']) continue;
    collectTypes(value, types);
  }

  if (Array.isArray(node['@graph'])) {
    node['@graph'].forEach((item) => collectTypes(item, types));
  }
}

export function validateJsonLdGraph(graph: unknown): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = [];

  if (!isPlainObject(graph)) {
    issues.push({ code: 'INVALID_ROOT', message: 'JSON-LD root must be an object' });
    return issues;
  }

  const ctx = graph['@context'];
  if (ctx !== undefined && typeof ctx !== 'string' && !Array.isArray(ctx)) {
    issues.push({ code: 'INVALID_CONTEXT', message: '@context must be a string or array' });
  }

  const types = new Set<string>();
  collectTypes(graph, types);

  for (const type of Array.from(types)) {
    if (!SCHEMA_TYPES.has(type) && !type.endsWith('Page')) {
      issues.push({
        code: 'UNKNOWN_TYPE',
        message: `Unknown or unlisted @type: ${type}`,
      });
    }
  }

  if (types.has('FAQPage')) {
    const mainEntity = findFirstKey(graph, 'mainEntity');
    if (!mainEntity || (Array.isArray(mainEntity) && mainEntity.length === 0)) {
      issues.push({ code: 'FAQ_EMPTY', message: 'FAQPage requires mainEntity entries' });
    }
  }

  return issues;
}

function findFirstKey(node: unknown, key: string): unknown {
  if (!isPlainObject(node)) return undefined;
  if (key in node) return node[key];
  if (Array.isArray(node['@graph'])) {
    for (const item of node['@graph']) {
      const found = findFirstKey(item, key);
      if (found !== undefined) return found;
    }
  }
  for (const value of Object.values(node)) {
    const found = findFirstKey(value, key);
    if (found !== undefined) return found;
  }
  return undefined;
}

/** Returns sanitized graph or minimal WebSite fallback. */
export function sanitizeJsonLdGraph(
  graph: unknown,
  fallback: Record<string, unknown>,
): Record<string, unknown> {
  if (!isPlainObject(graph)) {
    return fallback;
  }

  const issues = validateJsonLdGraph(graph);
  const hasGraph = Array.isArray(graph['@graph']) && graph['@graph'].length > 0;
  const hasType = typeof graph['@type'] === 'string';

  if (issues.some((i) => i.code === 'INVALID_ROOT' || i.code === 'INVALID_CONTEXT')) {
    return fallback;
  }

  if (!hasGraph && !hasType) {
    return fallback;
  }

  return graph;
}

export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
