import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadParityConfig } from '../config/load-config.js';
import { buildP3ReportBundle } from '../report/p3-build.js';
import {
  createEvJsonLdSpecTemplate,
  createEvRuntimeSpecTemplate,
  createEvSeoSpecTemplate,
} from '../ev/index.js';
import { verifyDeclaredContentHash } from '../determinism/hash-validation.js';
import { canonicalJsonString } from '../serialize/canonical-json.js';
import { canonicalReportString } from './canonical-report.js';
import { bundleFingerprintSha256, verifyReportFingerprint } from './fingerprint.js';
import { orderNamedDigests } from './hash-order.js';
import { EVB_SEAL_SPEC_VERSION, SEAL_STATUS_PREPARATION } from './evb-spec.js';

const FIXED_AT = '2026-05-25T12:00:00.000Z';

async function specBundleInput(runId: string) {
  const config = await loadParityConfig();
  return {
    config,
    runId,
    generatedAt: FIXED_AT,
    evaluationVectors: {
      runtime: {
        baseline: createEvRuntimeSpecTemplate(),
        target: createEvRuntimeSpecTemplate(),
      },
      seo: { baseline: createEvSeoSpecTemplate(), target: createEvSeoSpecTemplate() },
      jsonld: {
        baseline: createEvJsonLdSpecTemplate(),
        target: createEvJsonLdSpecTemplate(),
      },
    },
  };
}

test('canonical report serialization preserves semantic array order', () => {
  const sample = {
    fieldKeys: ['z', 'a'],
    fields: [{ fieldKey: 'z' }, { fieldKey: 'a' }],
  };
  const legacy = canonicalJsonString(sample);
  const seal = canonicalReportString(sample);
  assert.notEqual(legacy, seal);
  assert.match(seal, /"fieldKeys":\["z","a"\]/);
  assert.match(seal, /"fields":\[\{"fieldKey":"z"\},\{"fieldKey":"a"\}\]/);
});

test('stable hash ordering sorts bundle members lexicographically', () => {
  const ordered = orderNamedDigests([
    { name: 'ev-seo-report.json', digest: 'b'.repeat(64) },
    { name: 'diff-summary.json', digest: 'a'.repeat(64) },
    { name: 'ev-jsonld-report.json', digest: 'c'.repeat(64) },
  ]);
  assert.deepEqual(
    ordered.map((entry) => entry.name),
    ['diff-summary.json', 'ev-jsonld-report.json', 'ev-seo-report.json'],
  );
});

test('bundle fingerprint is stable regardless of input order', () => {
  const parts = [
    { name: 'ev-runtime-report.json', digest: '1'.repeat(64) },
    { name: 'diff-summary.json', digest: '2'.repeat(64) },
  ];
  const forward = bundleFingerprintSha256(parts);
  const reverse = bundleFingerprintSha256([...parts].reverse());
  assert.equal(forward, reverse);
});

test('P3 reports include seal-ready metadata and verifiable fingerprints', async () => {
  const bundle = buildP3ReportBundle(await specBundleInput('run-seal-prep'));

  for (const artifact of [
    bundle.evRuntime,
    bundle.evSeo,
    bundle.evJsonLd,
    bundle.diffSummary,
  ]) {
    assert.ok(artifact);
    assert.match(artifact.reportFingerprint, /^[a-f0-9]{64}$/);
    assert.equal(verifyReportFingerprint(artifact), true);
    assert.equal(artifact.evbSeal.sealStatus, SEAL_STATUS_PREPARATION);
    assert.equal(artifact.evbSeal.evbSealSpecVersion, EVB_SEAL_SPEC_VERSION);
    assert.equal(artifact.evbSeal.preparationOnly, true);
    assert.equal(artifact.evbSeal.sealWriter, null);
    assert.equal(artifact.evbSeal.reportFingerprint, artifact.reportFingerprint);
    assert.equal(verifyDeclaredContentHash(artifact.reportKind, artifact), null);
  }

  assert.match(bundle.diffSummary.bundleFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(
    bundle.diffSummary.evbSeal.bundleFingerprint,
    bundle.diffSummary.bundleFingerprint,
  );
  assert.equal(bundle.diffSummary.artifactFingerprints.length, 3);

  const recomputedBundle = bundleFingerprintSha256([
    ...bundle.diffSummary.artifactFingerprints.map((entry) => ({
      name: entry.filename,
      digest: entry.reportFingerprint,
    })),
    {
      name: 'diff-summary.json',
      digest: bundle.diffSummary.reportFingerprint,
    },
  ]);
  assert.equal(recomputedBundle, bundle.diffSummary.bundleFingerprint);
});

test('seal preparation output is deterministic across rebuilds', async () => {
  const input = await specBundleInput('run-seal-deterministic');
  const a = buildP3ReportBundle(input);
  const b = buildP3ReportBundle(input);
  assert.equal(canonicalReportString(a), canonicalReportString(b));
  assert.equal(a.diffSummary.bundleFingerprint, b.diffSummary.bundleFingerprint);
});
