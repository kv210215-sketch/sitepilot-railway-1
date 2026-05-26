import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadParityConfig } from '../config/load-config.js';
import {
  createEvJsonLdSpecTemplate,
  createEvRuntimeSpecTemplate,
  createEvSeoSpecTemplate,
} from '../ev/index.js';
import { buildP3ReportBundle } from '../report/p3-build.js';
import { canonicalJsonString, canonicalize } from '../serialize/canonical-json.js';
import { normalizeTimestamp, normalizeRunTimestamp } from '../serialize/timestamp.js';
import {
  assertDoubleRunAdmissible,
  collectHashMismatches,
  DeterminismViolationError,
  executeDoubleRun,
  executeDoubleRunAsync,
  verifyDeclaredContentHash,
} from './index.js';
import { runSnapshotComparisonSuite } from './snapshot-comparison.js';
import {
  DETERMINISM_FIXED_AT,
  DETERMINISM_RUN_ID,
  runDeterminismVerification,
} from '../harness/determinism-verify.js';

test('double-run: stable identical snapshot suite runs', async () => {
  const result = await executeDoubleRunAsync('snapshot-suite', () =>
    runSnapshotComparisonSuite(),
  );
  assertDoubleRunAdmissible(result);
  assert.equal(result.runA.suiteHash, result.runB.suiteHash);
  assert.deepEqual(result.runA.caseOrdering, result.runB.caseOrdering);
  for (let i = 0; i < result.runA.comparisons.length; i += 1) {
    assert.equal(
      result.runA.comparisons[i]?.verdict,
      result.runB.comparisons[i]?.verdict,
      `verdict drift at index ${i}`,
    );
    assert.deepEqual(
      result.runA.comparisons[i]?.reasons,
      result.runB.comparisons[i]?.reasons,
      `reason ordering drift at index ${i}`,
    );
  }
});

test('double-run: stable identical P3 bundle runs', async () => {
  const config = await loadParityConfig();
  const input = {
    config,
    runId: DETERMINISM_RUN_ID,
    generatedAt: DETERMINISM_FIXED_AT,
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

  const result = executeDoubleRun('p3-bundle', () => buildP3ReportBundle(input));
  assertDoubleRunAdmissible(result);
  assert.equal(
    result.runA.diffSummary.contentHash,
    result.runB.diffSummary.contentHash,
  );
});

test('timestamp normalization strips milliseconds for reports', () => {
  assert.equal(normalizeTimestamp('2026-05-25T19:01:03.355Z'), '2026-05-25T19:01:03Z');
  assert.equal(normalizeRunTimestamp('2026-05-25T12:00:00.000Z'), '2026-05-25T12:00:00Z');
});

test('ordering normalization: key order does not change canonical hash', () => {
  const a = { z: 1, a: { c: 2, b: 1 } };
  const b = { a: { b: 1, c: 2 }, z: 1 };
  assert.equal(canonicalJsonString(a), canonicalJsonString(b));

  const sorted = canonicalize({ items: [{ id: 'b' }, { id: 'a' }] }) as {
    items: { id: string }[];
  };
  assert.deepEqual(
    sorted.items.map((item) => item.id),
    ['a', 'b'],
  );
});

test('hash validation detects declared hash mismatch', async () => {
  const config = await loadParityConfig();
  const bundle = buildP3ReportBundle({
    config,
    runId: 'run-hash-test',
    generatedAt: DETERMINISM_FIXED_AT,
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

  const tamperedContent = {
    ...bundle.diffSummary,
    contentHash: '0'.repeat(64),
  };
  const contentMismatch = verifyDeclaredContentHash('diff-summary', tamperedContent);
  assert.ok(contentMismatch);
  assert.notEqual(contentMismatch?.declaredHash, contentMismatch?.computedHash);

  const tamperedFingerprint = {
    ...bundle.diffSummary,
    reportFingerprint: '0'.repeat(64),
  };
  const fingerprintMismatch = collectHashMismatches([
    { id: 'diff-summary', artifact: tamperedFingerprint },
  ]);
  assert.equal(fingerprintMismatch.length, 1);
  assert.match(fingerprintMismatch[0]?.artifactId ?? '', /reportFingerprint$/);

  const valid = collectHashMismatches([
    { id: 'diff-summary', artifact: bundle.diffSummary },
  ]);
  assert.equal(valid.length, 0);
});

test('intentional nondeterminism is rejected', () => {
  let counter = 0;
  const result = executeDoubleRun('nondeterministic-fn', () => {
    counter += 1;
    return { value: counter };
  });

  assert.equal(result.admissible, false);
  assert.equal(result.hashMatch, false);
  assert.ok(result.mismatches.length > 0);
  assert.throws(() => assertDoubleRunAdmissible(result), DeterminismViolationError);
});

test('runDeterminismVerification emits determinism-report.json with PASS', async () => {
  const result = await runDeterminismVerification({ failOnViolation: true });
  assert.equal(result.ok, true);
  assert.equal(result.report.verdict, 'PASS');
  assert.equal(result.report.reportKind, 'determinism-report');
  assert.ok(result.reportPath.endsWith('determinism-report.json'));
  assert.equal(result.report.guarantees.identicalHashes, true);
  assert.equal(result.report.guarantees.identicalOrdering, true);
  assert.equal(result.report.guarantees.identicalVerdicts, true);
  assert.equal(result.report.doubleRun.snapshotSuite.admissible, true);
  assert.equal(result.report.doubleRun.p3Bundle.admissible, true);
});
