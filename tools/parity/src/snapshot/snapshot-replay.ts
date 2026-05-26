import type { ParityConfig } from '../config/parity-config.schema.js';
import {
  buildP3ReportBundle,
  type P3BuildInput,
  type P3ReportBundle,
} from '../report/p3-build.js';
import { deriveP3RunId } from '../report/p3-run-id.js';
import { normalizeRunTimestamp } from '../serialize/timestamp.js';
import type { EvaluationVectorPair } from '../report/p3-build.js';
import {
  createEvJsonLdSpecTemplate,
  createEvRuntimeSpecTemplate,
  createEvSeoSpecTemplate,
} from '../ev/index.js';
import type { ParityVector } from '../config/parity-config.schema.js';
import { assertReplayNoNetwork, assertReplaySafe } from './snapshot-guards.js';
import { readLiveSnapshot } from './snapshot-store.js';
import type { LiveSnapshotCapture, SnapshotCollectorResults } from './snapshot-types.js';
import { deepFreeze } from './snapshot-freeze.js';

export type SnapshotReplayMode = 'offline';

export interface SnapshotReplayOptions {
  reportDirRelative: string;
  snapshotId: string;
  mode?: SnapshotReplayMode;
  generatedAt?: string;
  runId?: string;
  /** Pre-loaded capture (tests); skips disk read when set. */
  capture?: LiveSnapshotCapture;
}

export interface SnapshotReplayResult {
  mode: SnapshotReplayMode;
  snapshotId: string;
  capture: Readonly<LiveSnapshotCapture>;
  runId: string;
  bundle: P3ReportBundle;
  networkUsed: false;
}

function buildEvaluationVectorPair(vectors: ParityVector[]): EvaluationVectorPair {
  const pair: EvaluationVectorPair = {};
  if (vectors.includes('runtime')) {
    const template = createEvRuntimeSpecTemplate();
    pair.runtime = { baseline: template, target: template };
  }
  if (vectors.includes('seo')) {
    const template = createEvSeoSpecTemplate();
    pair.seo = { baseline: template, target: template };
  }
  if (vectors.includes('jsonld')) {
    const template = createEvJsonLdSpecTemplate();
    pair.jsonld = { baseline: template, target: template };
  }
  return pair;
}

function replayConfigFromCapture(capture: LiveSnapshotCapture): ParityConfig {
  return {
    ...capture.config,
    liveMode: false,
  };
}

/**
 * Replay a stored live snapshot into a P3 bundle without network or collector mutation.
 */
export async function replayLiveSnapshot(
  options: SnapshotReplayOptions,
): Promise<SnapshotReplayResult> {
  const mode: SnapshotReplayMode = options.mode ?? 'offline';
  assertReplayNoNetwork();

  let capture: Readonly<LiveSnapshotCapture>;
  if (options.capture) {
    capture = deepFreeze(options.capture);
  } else {
    const loaded = await readLiveSnapshot(options.reportDirRelative, options.snapshotId);
    capture = loaded.capture;
  }

  const replayConfig = replayConfigFromCapture(capture);
  assertReplaySafe(
    { offlineReplay: mode === 'offline', liveMode: replayConfig.liveMode },
    capture as LiveSnapshotCapture,
  );

  const generatedAt =
    options.generatedAt ?? normalizeRunTimestamp(capture.capturedAt);
  const runId = options.runId ?? deriveP3RunId(replayConfig);

  const buildInput: P3BuildInput = {
    config: replayConfig,
    runId,
    generatedAt,
    evaluationVectors: buildEvaluationVectorPair(replayConfig.vectors),
    collectorResults: capture.collectorResults as SnapshotCollectorResults,
  };

  const bundle = buildP3ReportBundle(buildInput);

  return {
    mode,
    snapshotId: capture.snapshotId,
    capture,
    runId,
    bundle,
    networkUsed: false,
  };
}
