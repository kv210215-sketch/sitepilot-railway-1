import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifySnapshotDrift } from './compare-snapshot.js';
import { collectFixtureSnapshot } from './collect-from-html.js';
import {
  FIXTURES_DIR,
  getFixtureById,
  loadFixtureManifest,
  resolveFixturePath,
} from './manifest.js';
import {
  FIXTURE_PREFIX,
  buildFixtureFilename,
  type FixtureScenario,
} from './naming.js';
import { SYNTHETIC_PARITY_CASES } from './synthetic-cases.js';

async function readFixtureHtml(fixtureId: string): Promise<string> {
  const manifest = await loadFixtureManifest();
  const entry = getFixtureById(manifest, fixtureId);
  return readFile(resolveFixturePath(entry), 'utf8');
}

function assertSnapshotExpectations(
  snapshot: ReturnType<typeof collectFixtureSnapshot>,
  expectations: (typeof SYNTHETIC_PARITY_CASES)[number]['expectations'],
): void {
  if (expectations.title !== undefined) {
    assert.equal(snapshot.title, expectations.title);
  }
  if (expectations.metaDescription !== undefined) {
    assert.equal(snapshot.metaDescription, expectations.metaDescription);
  }
  if (expectations.canonical !== undefined) {
    assert.equal(snapshot.canonical, expectations.canonical);
  }
  if (expectations.robots !== undefined) {
    assert.equal(snapshot.robots, expectations.robots);
  }
  if (expectations.jsonLdParseOk !== undefined) {
    assert.equal(snapshot.jsonLd.parseOk, expectations.jsonLdParseOk);
  }
  if (expectations.jsonLdTypes !== undefined) {
    assert.deepEqual(snapshot.jsonLd.types, expectations.jsonLdTypes);
  }
  if (expectations.hasLeadForm !== undefined) {
    assert.equal(snapshot.runtime.hasLeadForm, expectations.hasLeadForm);
  }
  if (expectations.sectionIdCount !== undefined) {
    assert.equal(snapshot.runtime.sectionIdCount, expectations.sectionIdCount);
  }
}

test('fixture manifest loads and entries use deterministic naming', async () => {
  const manifest = await loadFixtureManifest();
  assert.equal(manifest.version, '1');
  assert.equal(manifest.naming.prefix, FIXTURE_PREFIX);

  for (const entry of manifest.fixtures) {
    assert.ok(entry.file.startsWith(FIXTURE_PREFIX), `fixture file must use prefix: ${entry.file}`);
    const expectedFile = buildFixtureFilename(
      entry.scenario as FixtureScenario,
      entry.role,
    );
    assert.equal(entry.file, expectedFile, `deterministic name for ${entry.id}`);
    await access(resolveFixturePath(entry));
  }
});

test('legacy sample-home.html matches reference-home snapshot when present', async () => {
  const legacyPath = path.join(FIXTURES_DIR, 'sample-home.html');
  try {
    await access(legacyPath);
  } catch {
    return;
  }
  const legacyHtml = await readFile(legacyPath, 'utf8');
  const referenceHtml = await readFixtureHtml('reference-home');
  const legacySnapshot = collectFixtureSnapshot(legacyHtml);
  const referenceSnapshot = collectFixtureSnapshot(referenceHtml);
  assert.deepEqual(legacySnapshot, referenceSnapshot);
});

test('synthetic parity case registry is stable', () => {
  const ids = SYNTHETIC_PARITY_CASES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(SYNTHETIC_PARITY_CASES.length, 8);
});

for (const parityCase of SYNTHETIC_PARITY_CASES) {
  if (parityCase.kind === 'pair') {
    test(`synthetic pair ${parityCase.id} → ${parityCase.expectedVerdict}`, async () => {
      assert.ok(parityCase.baselineFixtureId);
      assert.ok(parityCase.targetFixtureId);
      const baselineHtml = await readFixtureHtml(parityCase.baselineFixtureId);
      const targetHtml = await readFixtureHtml(parityCase.targetFixtureId);
      const baseline = collectFixtureSnapshot(baselineHtml);
      const target = collectFixtureSnapshot(targetHtml);
      const drift = classifySnapshotDrift(baseline, target);
      assert.equal(drift.verdict, parityCase.expectedVerdict, drift.reasons.join('; '));
      assertSnapshotExpectations(baseline, parityCase.expectations);
    });
    continue;
  }

  test(`synthetic single ${parityCase.id} expectations`, async () => {
    assert.ok(parityCase.singleFixtureId);
    const html = await readFixtureHtml(parityCase.singleFixtureId);
    const snapshot = collectFixtureSnapshot(html);
    assertSnapshotExpectations(snapshot, parityCase.expectations);
  });
}

test('malformed JSON-LD fixture reports parse error', async () => {
  const html = await readFixtureHtml('malformed-jsonld');
  const snapshot = collectFixtureSnapshot(html);
  assert.equal(snapshot.jsonLd.parseOk, false);
  assert.ok(snapshot.jsonLd.parseError);
});

test('robots noindex fixture is not indexable', async () => {
  const html = await readFixtureHtml('robots-noindex');
  const snapshot = collectFixtureSnapshot(html);
  assert.match(snapshot.robots ?? '', /noindex/i);
});

test('missing canonical fixture has no canonical href', async () => {
  const html = await readFixtureHtml('missing-canonical');
  const snapshot = collectFixtureSnapshot(html);
  assert.equal(snapshot.canonical, null);
});

test('missing lead form fixture has no #mainForm', async () => {
  const html = await readFixtureHtml('missing-lead-form');
  const snapshot = collectFixtureSnapshot(html);
  assert.equal(snapshot.runtime.hasLeadForm, false);
});
