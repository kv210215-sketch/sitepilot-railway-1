import path from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadParityConfig } from '../config/load-config.js';
import { runDryRun } from '../harness/dry-run.js';
import { runSnapshotCapture } from '../harness/snapshot-capture.js';
import { runSnapshotReplay } from '../harness/snapshot-replay.js';
import {
  buildLiveSnapshotCapture,
  verifyCaptureContentHash,
} from './snapshot-capture.js';
import {
  buildSnapshotFingerprint,
  deriveSnapshotId,
  collectorResultsHash,
} from './snapshot-id.js';
import { assertSnapshotWriteAllowed, resolveSnapshotStoreDirectory } from './snapshot-isolation.js';
import { readLiveSnapshot, writeLiveSnapshot } from './snapshot-store.js';
import { deepFreeze } from './snapshot-freeze.js';
import { replayLiveSnapshot } from './snapshot-replay.js';
import { assertOfflineReplayCapture } from './snapshot-guards.js';
import { canonicalReportString } from '../seal/canonical-report.js';
import type { SnapshotCollectorResults } from './snapshot-types.js';
import type { RuntimeCollectResult } from '../collectors/types.js';

const FIXED_AT = '2026-05-25T12:00:00.000Z';

function minimalCollectorResults(label: string): SnapshotCollectorResults {
  const row: RuntimeCollectResult = {
    vector: 'runtime',
    url: `{origin:null}/${label}`,
    status: null,
    title: `title-${label}`,
    bodySummary: null,
    collectedAt: FIXED_AT,
    source: 'planned-only',
  };
  return {
    runtime: {
      baseline: [row],
      target: [{ ...row, title: `title-${label}-target` }],
    },
  };
}

test('deriveSnapshotId is deterministic from collector payload', async () => {
  const config = await loadParityConfig();
  const results = minimalCollectorResults('determinism');
  const fingerprint = buildSnapshotFingerprint(config, results);
  const a = deriveSnapshotId(fingerprint);
  const b = deriveSnapshotId(fingerprint);
  assert.equal(a, b);
  assert.match(a, /^snap-[a-f0-9]{12}$/);
  assert.equal(collectorResultsHash(results), fingerprint.collectorResultsHash);
});

test('snapshot isolation rejects writes outside snapshot directory', async () => {
  const config = await loadParityConfig();
  const snapshotId = 'snap-test-isolation';
  const snapshotDir = resolveSnapshotStoreDirectory(config.reportDir, snapshotId);
  const escapePath = path.join(path.dirname(snapshotDir), 'outside-snapshot.json');
  assert.throws(() => assertSnapshotWriteAllowed(config.reportDir, snapshotId, escapePath));
});

test('writeLiveSnapshot is write-once per snapshotId', async () => {
  const config = await loadParityConfig();
  const dryRun = await runDryRun();
  const results = minimalCollectorResults(`write-once-${Date.now()}`);
  const report = {
    ...dryRun.report,
    collectors: { ...dryRun.report.collectors, results },
  };
  const capture = buildLiveSnapshotCapture(report, {
    offlineReplay: true,
    capturedAt: FIXED_AT,
  });
  const reportDir = config.reportDir;
  await writeLiveSnapshot(capture, reportDir);
  await assert.rejects(
    () => writeLiveSnapshot(capture, reportDir),
    /write-once violation/,
  );
});

test('offline capture store + replay produces deterministic P3 bundle', async () => {
  const captured = await runSnapshotCapture({
    offlineReplay: true,
    capturedAt: FIXED_AT,
    collectorResultsOverride: minimalCollectorResults(`replay-${Date.now()}`),
  });
  assert.ok(verifyCaptureContentHash(captured.capture));
  assert.equal(captured.capture.replayMode, 'offline-replay');

  const replayA = await runSnapshotReplay({
    reportDirRelative: captured.dryRun.report.config.reportDir,
    snapshotId: captured.capture.snapshotId,
    generatedAt: FIXED_AT,
    runId: 'run-replay-test',
  });
  const replayB = await runSnapshotReplay({
    reportDirRelative: captured.dryRun.report.config.reportDir,
    snapshotId: captured.capture.snapshotId,
    generatedAt: FIXED_AT,
    runId: 'run-replay-test',
  });

  assert.equal(replayA.networkUsed, false);
  assert.equal(replayA.capture.config.liveMode, false);
  assert.equal(
    canonicalReportString(replayA.bundle.diffSummary),
    canonicalReportString(replayB.bundle.diffSummary),
  );
});

test('readLiveSnapshot returns deep-frozen capture', async () => {
  const config = await loadParityConfig();
  const dryRun = await runDryRun();
  const results = minimalCollectorResults(`freeze-${Date.now()}`);
  const capture = buildLiveSnapshotCapture(
    {
      ...dryRun.report,
      collectors: { ...dryRun.report.collectors, results },
    },
    { offlineReplay: true, capturedAt: FIXED_AT },
  );

  await writeLiveSnapshot(capture, config.reportDir);
  const loaded = await readLiveSnapshot(config.reportDir, capture.snapshotId);
  assert.throws(() => {
    (loaded.capture as { snapshotId: string }).snapshotId = 'mutated';
  });
  deepFreeze(capture);
});

test('offline replay guard rejects live-network capture', async () => {
  const dryRun = await runDryRun();
  const capture = buildLiveSnapshotCapture(dryRun.report, {
    offlineReplay: false,
    capturedAt: FIXED_AT,
  });
  const liveCapture = {
    ...capture,
    networkExecuted: true,
    networkBlockedByPolicy: false,
    config: { ...capture.config, liveMode: true },
  };
  assert.throws(
    () => assertOfflineReplayCapture(liveCapture),
    /liveMode=true|network execution/,
  );
});

test('stored manifest matches capture fingerprint', async () => {
  const captured = await runSnapshotCapture({
    offlineReplay: true,
    capturedAt: FIXED_AT,
    collectorResultsOverride: minimalCollectorResults(`manifest-${Date.now()}`),
  });
  const loaded = await readLiveSnapshot(
    captured.dryRun.report.config.reportDir,
    captured.capture.snapshotId,
  );
  assert.equal(loaded.manifest.snapshotId, loaded.capture.snapshotId);
  assert.equal(loaded.manifest.contentHash, loaded.capture.contentHash);
  assert.equal(loaded.manifest.replaySafe, true);
  assert.equal(loaded.manifest.isolation.immutable, true);
});
