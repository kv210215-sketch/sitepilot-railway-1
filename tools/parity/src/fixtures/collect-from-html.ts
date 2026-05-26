import {
  buildRuntimeBodySummary,
  extractCanonical,
  extractJsonLdScripts,
  extractMetaDescription,
  extractRobotsMeta,
  extractTitle,
  summarizeJsonLdTypes,
} from '../collectors/parse-html.js';

export interface FixtureHtmlSnapshot {
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robots: string | null;
  jsonLd: {
    blockCount: number;
    parseOk: boolean;
    types: string[];
    parseError?: string;
  };
  runtime: {
    sectionIdCount: number;
    hasLeadForm: boolean;
    excerpt: string;
  };
}

export function collectFixtureSnapshot(html: string): FixtureHtmlSnapshot {
  const scripts = extractJsonLdScripts(html);
  const first = scripts[0];
  const jsonSummary = first
    ? summarizeJsonLdTypes(first.raw)
    : { types: [] as string[], parseOk: true as const };

  const body = buildRuntimeBodySummary(html);

  return {
    title: extractTitle(html),
    metaDescription: extractMetaDescription(html),
    canonical: extractCanonical(html),
    robots: extractRobotsMeta(html),
    jsonLd: {
      blockCount: scripts.length,
      parseOk: jsonSummary.parseOk,
      types: jsonSummary.types,
      parseError: jsonSummary.parseError,
    },
    runtime: {
      sectionIdCount: body.sectionIdCount,
      hasLeadForm: body.hasLeadForm,
      excerpt: body.excerpt,
    },
  };
}
