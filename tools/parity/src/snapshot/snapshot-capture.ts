import type { DryRunReport } from '../report/dry-run-report.js';
import type { ParityConfig } from '../config/parity-config.schema.js';
import { contentHashSha256 } from '../hash/content-hash.js';
import {
  buildSnapshotFingerprint,
  deriveSnapshotId,
  type SnapshotFingerprint,
} from './snapshot-id.js';
import type { LiveSnapshotCapture, SnapshotCollectorResults } from './snapshot-types.js';
import { LiveSnapshotCaptureSchema, SnapshotManifestSchema } from './snapshot-types.js';
import type { SnapshotManifest } from './snapshot-types.js';
import { SNAPSHOT_ARTIFACT_FILENAMES } from './snapshot-types.js';

export interface BuildCaptureOptions {
  /** When true, marks capture as offline-replay sourced (fixture/synthetic, no live network). */
  offlineReplay?: boolean;
  capturedAt?: string;
}

function hashlessCaptureBody(
  config: ParityConfig,
  collectorResults: SnapshotCollectorResults,
  capturedAt: string,
  replayMode: LiveSnapshotCapture['replayMode'],
  networkExecuted: boolean,
  networkBlockedByPolicy: boolean,
): Omit<LiveSnapshotCapture, 'snapshotId' | 'contentHash'> {
  return {
    capturedAt,
    replayMode,
    config,
    collectorResults,
    networkExecuted,
    networkBlockedByPolicy,
  };
}

export function buildLiveSnapshotCapture(
  dryRun: DryRunReport,
  options: BuildCaptureOptions = {},
): LiveSnapshotCapture {
  const collectorResults = (dryRun.collectors.results ?? {}) as SnapshotCollectorResults;
  const replayMode = options.offlineReplay ? 'offline-replay' : 'live-capture';
  const capturedAt = options.capturedAt ?? dryRun.timestamp;
  const fingerprint = buildSnapshotFingerprint(dryRun.config, collectorResults);
  const snapshotId = deriveSnapshotId(fingerprint);
  const body = hashlessCaptureBody(
    dryRun.config,
    collectorResults,
    capturedAt,
    replayMode,
    dryRun.collectors.networkExecuted,
    dryRun.collectors.networkBlockedByPolicy,
  );
  const contentHash = contentHashSha256(body);
  const capture: LiveSnapshotCapture = {
    snapshotId,
    contentHash,
    ...body,
  };
  return LiveSnapshotCaptureSchema.parse(capture);
}

export function buildSnapshotManifest(capture: LiveSnapshotCapture): SnapshotManifest {
  const fingerprint = buildSnapshotFingerprint(
    capture.config,
    capture.collectorResults as SnapshotCollectorResults,
  );
  const manifest: SnapshotManifest = {
    version: '1',
    snapshotId: capture.snapshotId,
    contentHash: capture.contentHash,
    capturedAt: capture.capturedAt,
    replayMode: capture.replayMode,
    replaySafe: true,
    configFingerprint: fingerprint,
    artifacts: {
      capture: SNAPSHOT_ARTIFACT_FILENAMES.capture,
      manifest: SNAPSHOT_ARTIFACT_FILENAMES.manifest,
    },
    isolation: {
      storeSubdir: 'snapshots',
      immutable: true,
    },
  };
  return SnapshotManifestSchema.parse(manifest);
}

export function verifyCaptureContentHash(capture: LiveSnapshotCapture): boolean {
  const { snapshotId: _id, contentHash: _hash, ...body } = capture;
  return contentHashSha256(body) === capture.contentHash;
}

export function verifyManifestFingerprint(
  manifest: SnapshotManifest,
  capture: LiveSnapshotCapture,
): boolean {
  const fingerprint = buildSnapshotFingerprint(
    capture.config,
    capture.collectorResults as SnapshotCollectorResults,
  );
  return (
    manifest.configFingerprint.collectorResultsHash === fingerprint.collectorResultsHash &&
    manifest.snapshotId === deriveSnapshotId(fingerprint as SnapshotFingerprint)
  );
}
