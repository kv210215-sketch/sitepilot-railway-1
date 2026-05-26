import type { FixtureHtmlSnapshot } from './collect-from-html.js';

export type SyntheticParityVerdict = 'pass' | 'warning' | 'fail';

export interface SnapshotDriftReport {
  verdict: SyntheticParityVerdict;
  reasons: string[];
}

function isIndexableRobots(robots: string | null): boolean {
  if (!robots) {
    return true;
  }
  return !/\bnoindex\b/i.test(robots);
}

/**
 * Offline drift classifier for synthetic fixture pairs (P2 — no diff engine).
 * Fail beats warning; pass only when no drift signals fire.
 */
export function classifySnapshotDrift(
  baseline: FixtureHtmlSnapshot,
  target: FixtureHtmlSnapshot,
): SnapshotDriftReport {
  const reasons: string[] = [];
  let hasFail = false;
  let hasWarning = false;

  const markFail = (reason: string): void => {
    hasFail = true;
    reasons.push(reason);
  };
  const markWarning = (reason: string): void => {
    hasWarning = true;
    reasons.push(reason);
  };

  if (baseline.title !== target.title) {
    markFail('title-mismatch');
  }

  if (!target.canonical) {
    markFail('target-canonical-missing');
  } else if (baseline.canonical !== target.canonical) {
    markWarning('canonical-mismatch');
  }

  if (baseline.metaDescription !== target.metaDescription) {
    markWarning('meta-description-mismatch');
  }

  if (isIndexableRobots(baseline.robots) && !isIndexableRobots(target.robots)) {
    markFail('target-robots-noindex');
  } else if (baseline.robots !== target.robots) {
    markWarning('robots-meta-mismatch');
  }

  if (!target.jsonLd.parseOk) {
    markFail('target-jsonld-parse-error');
  } else if (
    baseline.jsonLd.types.join('|') !== target.jsonLd.types.join('|')
  ) {
    markFail('jsonld-types-mismatch');
  }

  if (baseline.runtime.hasLeadForm && !target.runtime.hasLeadForm) {
    markFail('target-lead-form-missing');
  }

  if (baseline.runtime.sectionIdCount !== target.runtime.sectionIdCount) {
    markFail('section-count-mismatch');
  }

  if (hasFail) {
    return { verdict: 'fail', reasons };
  }
  if (hasWarning) {
    return { verdict: 'warning', reasons };
  }
  return { verdict: 'pass', reasons };
}
