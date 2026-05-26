import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadParityConfig } from '../config/load-config.js';
import { buildP3ReportBundle } from './p3-build.js';
import { deriveP3RunId } from './p3-run-id.js';
import { writeP3ReportBundle } from './p3-writer.js';
import { canonicalReportString } from '../seal/canonical-report.js';
import { verifyReportFingerprint } from '../seal/fingerprint.js';
import { P3_REPORT_FILENAMES } from './p3-schemas.js';
import {
  createEvJsonLdSpecTemplate,
  createEvRuntimeSpecTemplate,
  createEvSeoSpecTemplate,
} from '../ev/index.js';
import { assertP3ReportWriteAllowed, resolveP3RunDirectory } from './p3-isolation.js';

const FIXED_AT = '2026-05-25T12:00:00.000Z';

test('P3 bundle is deterministic for fixed inputs', async () => {
  const config = await loadParityConfig();
  const runId = 'run-test-deterministic';
  const input = {
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

  const a = buildP3ReportBundle(input);
  const b = buildP3ReportBundle(input);
  assert.equal(canonicalReportString(a), canonicalReportString(b));
  assert.equal(a.diffSummary.overall.verdict, 'GO');
  assert.match(a.diffSummary.contentHash, /^[a-f0-9]{64}$/);
  assert.match(a.diffSummary.reportFingerprint, /^[a-f0-9]{64}$/);
  assert.match(a.diffSummary.bundleFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(verifyReportFingerprint(a.diffSummary), true);
});

test('P3 writer emits four isolated artifacts', async () => {
  const config = await loadParityConfig();
  const runId = 'run-test-writer';
  const bundle = buildP3ReportBundle({
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
  });

  const written = await writeP3ReportBundle(bundle, config.reportDir, runId);
  assert.ok(written.files.diffSummary.endsWith(P3_REPORT_FILENAMES.diffSummary));
  assert.ok(written.files.evRuntime?.endsWith(P3_REPORT_FILENAMES.evRuntime));
  assert.ok(written.files.evSeo?.endsWith(P3_REPORT_FILENAMES.evSeo));
  assert.ok(written.files.evJsonLd?.endsWith(P3_REPORT_FILENAMES.evJsonLd));

  for (const filePath of Object.values(written.files)) {
    assertP3ReportWriteAllowed(config.reportDir, runId, filePath);
    const raw = await readFile(filePath, 'utf8');
    assert.ok(!raw.includes('\n  '), 'reports must use canonical single-line JSON');
    const reparsed = JSON.parse(raw) as {
      contentHash: string;
      reportFingerprint: string;
      evbSeal: { reportFingerprint: string; preparationOnly: boolean };
      bundleFingerprint?: string;
    };
    assert.match(reparsed.contentHash, /^[a-f0-9]{64}$/);
    assert.match(reparsed.reportFingerprint, /^[a-f0-9]{64}$/);
    assert.equal(reparsed.evbSeal.preparationOnly, true);
    assert.equal(reparsed.evbSeal.reportFingerprint, reparsed.reportFingerprint);
    if (reparsed.bundleFingerprint) {
      assert.match(reparsed.bundleFingerprint, /^[a-f0-9]{64}$/);
    }
  }
});

test('deriveP3RunId is stable for default config', async () => {
  const config = await loadParityConfig();
  const a = deriveP3RunId(config);
  const b = deriveP3RunId(config);
  assert.equal(a, b);
  assert.match(a, /^run-[a-f0-9]{12}$/);
});

test('P3 isolation rejects writes outside run directory', async () => {
  const config = await loadParityConfig();
  const runId = 'run-test-isolation';
  const runDir = resolveP3RunDirectory(config.reportDir, runId);
  const escapePath = path.join(path.dirname(runDir), 'outside-run.json');
  assert.throws(() => assertP3ReportWriteAllowed(config.reportDir, runId, escapePath));
});
