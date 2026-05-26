import type { SyntheticParityVerdict } from './compare-snapshot.js';

export type SyntheticParityCaseKind = 'pair' | 'single';

export interface SyntheticParityCaseExpectations {
  title?: string | null;
  metaDescription?: string | null;
  canonical?: string | null;
  robots?: string | null;
  jsonLdParseOk?: boolean;
  jsonLdTypes?: string[];
  hasLeadForm?: boolean;
  sectionIdCount?: number;
}

export interface SyntheticParityCase {
  id: string;
  kind: SyntheticParityCaseKind;
  label: string;
  expectedVerdict: SyntheticParityVerdict;
  baselineFixtureId?: string;
  targetFixtureId?: string;
  singleFixtureId?: string;
  expectations: SyntheticParityCaseExpectations;
  tags: string[];
}

/** Deterministic synthetic parity cases backed only by local HTML fixtures. */
export const SYNTHETIC_PARITY_CASES: readonly SyntheticParityCase[] = [
  {
    id: 'case-identical-home',
    kind: 'pair',
    label: 'Identical baseline and target snapshots',
    expectedVerdict: 'pass',
    baselineFixtureId: 'identical-baseline',
    targetFixtureId: 'identical-target',
    expectations: {
      title: 'Fixture — Solomiya Energy',
      canonical: 'https://fixture.example/',
      robots: 'index, follow',
      jsonLdParseOk: true,
      jsonLdTypes: ['FAQPage', 'LocalBusiness'],
      hasLeadForm: true,
      sectionIdCount: 2,
    },
    tags: ['pair', 'identical'],
  },
  {
    id: 'case-warning-meta-drift',
    kind: 'pair',
    label: 'Minor meta description drift (warning)',
    expectedVerdict: 'warning',
    baselineFixtureId: 'warning-drift-baseline',
    targetFixtureId: 'warning-drift-target',
    expectations: {
      title: 'Fixture — Solomiya Energy',
      canonical: 'https://fixture.example/',
      robots: 'index, follow',
      jsonLdParseOk: true,
      hasLeadForm: true,
    },
    tags: ['pair', 'warning-drift'],
  },
  {
    id: 'case-fail-runtime-drift',
    kind: 'pair',
    label: 'Critical title and lead-form drift (fail)',
    expectedVerdict: 'fail',
    baselineFixtureId: 'fail-drift-baseline',
    targetFixtureId: 'fail-drift-target',
    expectations: {
      title: 'Fixture — Solomiya Energy',
      hasLeadForm: true,
    },
    tags: ['pair', 'fail-drift'],
  },
  {
    id: 'case-single-malformed-jsonld',
    kind: 'single',
    label: 'Malformed JSON-LD block',
    expectedVerdict: 'fail',
    singleFixtureId: 'malformed-jsonld',
    expectations: {
      jsonLdParseOk: false,
      jsonLdTypes: [],
    },
    tags: ['single', 'jsonld'],
  },
  {
    id: 'case-single-missing-canonical',
    kind: 'single',
    label: 'Missing canonical link',
    expectedVerdict: 'warning',
    singleFixtureId: 'missing-canonical',
    expectations: {
      canonical: null,
      robots: 'index, follow',
      jsonLdParseOk: true,
    },
    tags: ['single', 'seo'],
  },
  {
    id: 'case-single-robots-noindex',
    kind: 'single',
    label: 'Robots noindex on fixture page',
    expectedVerdict: 'fail',
    singleFixtureId: 'robots-noindex',
    expectations: {
      robots: 'noindex, follow',
      canonical: 'https://fixture.example/robots-noindex',
    },
    tags: ['single', 'seo'],
  },
  {
    id: 'case-single-missing-lead-form',
    kind: 'single',
    label: 'Lead form selector absent',
    expectedVerdict: 'fail',
    singleFixtureId: 'missing-lead-form',
    expectations: {
      hasLeadForm: false,
      sectionIdCount: 2,
    },
    tags: ['single', 'runtime'],
  },
  {
    id: 'case-reference-home',
    kind: 'single',
    label: 'Reference home fixture sanity',
    expectedVerdict: 'pass',
    singleFixtureId: 'reference-home',
    expectations: {
      title: 'Fixture — Solomiya Energy',
      metaDescription: 'Fixture meta description for parity harness.',
      canonical: 'https://fixture.example/',
      robots: 'index, follow',
      jsonLdParseOk: true,
      jsonLdTypes: ['FAQPage', 'LocalBusiness'],
      hasLeadForm: true,
      sectionIdCount: 2,
    },
    tags: ['single', 'reference'],
  },
] as const;

export function getSyntheticParityCase(id: string): SyntheticParityCase {
  const found = SYNTHETIC_PARITY_CASES.find((c) => c.id === id);
  if (!found) {
    throw new Error(`unknown synthetic parity case: ${id}`);
  }
  return found;
}
