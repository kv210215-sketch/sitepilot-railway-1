import { readFile } from 'node:fs/promises';
import { contentHashSha256 } from '../hash/content-hash.js';
import { classifySnapshotDrift, type SnapshotDriftReport } from '../fixtures/compare-snapshot.js';
import { collectFixtureSnapshot } from '../fixtures/collect-from-html.js';
import {
  getFixtureById,
  loadFixtureManifest,
  resolveFixturePath,
} from '../fixtures/manifest.js';
import { SYNTHETIC_PARITY_CASES } from '../fixtures/synthetic-cases.js';
import type { SyntheticParityVerdict } from '../fixtures/compare-snapshot.js';

export interface SnapshotComparisonRecord {
  caseId: string;
  baselineSnapshotHash: string;
  targetSnapshotHash: string;
  driftHash: string;
  verdict: SyntheticParityVerdict;
  reasons: string[];
}

export interface SnapshotComparisonSuite {
  caseOrdering: string[];
  comparisons: SnapshotComparisonRecord[];
  suiteHash: string;
}

async function readFixtureHtmlById(fixtureId: string): Promise<string> {
  const manifest = await loadFixtureManifest();
  const entry = getFixtureById(manifest, fixtureId);
  return readFile(resolveFixturePath(entry), 'utf8');
}

export async function executeSnapshotComparison(
  caseId: string,
  baselineFixtureId: string,
  targetFixtureId: string,
): Promise<SnapshotComparisonRecord> {
  const [baselineHtml, targetHtml] = await Promise.all([
    readFixtureHtmlById(baselineFixtureId),
    readFixtureHtmlById(targetFixtureId),
  ]);
  const baseline = collectFixtureSnapshot(baselineHtml);
  const target = collectFixtureSnapshot(targetHtml);
  const drift: SnapshotDriftReport = classifySnapshotDrift(baseline, target);

  return {
    caseId,
    baselineSnapshotHash: contentHashSha256(baseline),
    targetSnapshotHash: contentHashSha256(target),
    driftHash: contentHashSha256(drift),
    verdict: drift.verdict,
    reasons: drift.reasons,
  };
}

/** Run offline snapshot drift classification for all synthetic pair cases (deterministic order). */
export async function runSnapshotComparisonSuite(): Promise<SnapshotComparisonSuite> {
  const pairCases = SYNTHETIC_PARITY_CASES.filter((c) => c.kind === 'pair').sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  const comparisons: SnapshotComparisonRecord[] = [];
  for (const parityCase of pairCases) {
    if (!parityCase.baselineFixtureId || !parityCase.targetFixtureId) {
      throw new Error(`pair case ${parityCase.id} is missing fixture ids`);
    }
    comparisons.push(
      await executeSnapshotComparison(
        parityCase.id,
        parityCase.baselineFixtureId,
        parityCase.targetFixtureId,
      ),
    );
  }

  const caseOrdering = comparisons.map((c) => c.caseId);
  return {
    caseOrdering,
    comparisons,
    suiteHash: contentHashSha256({ caseOrdering, comparisons }),
  };
}
