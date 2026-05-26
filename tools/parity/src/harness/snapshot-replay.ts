import {
  replayLiveSnapshot,
  type SnapshotReplayOptions,
  type SnapshotReplayResult,
} from '../snapshot/snapshot-replay.js';
import { snapshotAllowedWriteRoots } from '../snapshot/snapshot-isolation.js';

export type { SnapshotReplayOptions, SnapshotReplayResult };

export interface SnapshotReplayHarnessResult extends SnapshotReplayResult {
  isolation: {
    allowedWriteRoots: string[];
  };
}

/**
 * Offline replay from isolated snapshot store (no network, immutable capture).
 */
export async function runSnapshotReplay(
  options: SnapshotReplayOptions,
): Promise<SnapshotReplayHarnessResult> {
  const result = await replayLiveSnapshot({ ...options, mode: options.mode ?? 'offline' });
  return {
    ...result,
    isolation: {
      allowedWriteRoots: snapshotAllowedWriteRoots(options.reportDirRelative, result.snapshotId),
    },
  };
}
