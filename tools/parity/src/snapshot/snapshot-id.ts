import { createHash } from 'node:crypto';
import { canonicalJsonString } from '../serialize/canonical-json.js';
import type { ParityConfig } from '../config/parity-config.schema.js';
import type { SnapshotCollectorResults } from './snapshot-types.js';
import { contentHashSha256 } from '../hash/content-hash.js';

export interface SnapshotFingerprint {
  version: string;
  vectors: string[];
  baselineLabel: string;
  targetLabel: string;
  liveMode: boolean;
  collectorResultsHash: string;
}

/** Config fields included in snapshot fingerprint (no origins — replay-safe metadata only). */
export function snapshotConfigFingerprint(config: ParityConfig): Omit<SnapshotFingerprint, 'collectorResultsHash'> {
  return {
    version: config.version,
    vectors: [...config.vectors].sort(),
    baselineLabel: config.baseline.label,
    targetLabel: config.target.label,
    liveMode: config.liveMode,
  };
}

export function collectorResultsHash(results: SnapshotCollectorResults): string {
  return contentHashSha256(results);
}

export function buildSnapshotFingerprint(
  config: ParityConfig,
  collectorResults: SnapshotCollectorResults,
): SnapshotFingerprint {
  return {
    ...snapshotConfigFingerprint(config),
    collectorResultsHash: collectorResultsHash(collectorResults),
  };
}

/** Deterministic snapshot id from config + collector payload (no timestamps). */
export function deriveSnapshotId(fingerprint: SnapshotFingerprint): string {
  const digest = createHash('sha256')
    .update(canonicalJsonString(fingerprint), 'utf8')
    .digest('hex')
    .slice(0, 12);
  return `snap-${digest}`;
}
