import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FIXTURE_EXTENSION,
  FIXTURE_PREFIX,
  buildFixtureFilename,
  fixtureIdFromScenario,
  isPairedScenario,
} from './naming.js';

test('buildFixtureFilename is deterministic for paired and single scenarios', () => {
  assert.equal(
    buildFixtureFilename('identical', 'baseline'),
    'parity-fixture-identical-baseline.html',
  );
  assert.equal(
    buildFixtureFilename('warning-drift', 'target'),
    'parity-fixture-warning-drift-target.html',
  );
  assert.equal(
    buildFixtureFilename('malformed-jsonld'),
    'parity-fixture-malformed-jsonld.html',
  );
});

test('paired scenarios require role', () => {
  assert.throws(() => buildFixtureFilename('identical'), /requires baseline or target/);
});

test('fixtureIdFromScenario encodes role when present', () => {
  assert.equal(fixtureIdFromScenario('fail-drift', 'target'), 'fail-drift-target');
  assert.equal(fixtureIdFromScenario('reference-home'), 'reference-home');
});

test('isPairedScenario classifies drift pairs', () => {
  assert.equal(isPairedScenario('identical'), true);
  assert.equal(isPairedScenario('malformed-jsonld'), false);
  assert.equal(`${FIXTURE_PREFIX}x${FIXTURE_EXTENSION}`.includes(FIXTURE_PREFIX), true);
});
