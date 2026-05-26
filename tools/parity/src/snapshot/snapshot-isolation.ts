import path from 'node:path';
import { PARITY_ROOT } from '../config/load-config.js';

export const SNAPSHOT_STORE_SUBDIR = 'snapshots' as const;

export function resolveSnapshotStoreDirectory(
  reportDirRelative: string,
  snapshotId: string,
): string {
  return path.resolve(PARITY_ROOT, reportDirRelative, SNAPSHOT_STORE_SUBDIR, snapshotId);
}

/**
 * Ensures snapshot writes stay under tools/parity/{reportDir}/snapshots/{snapshotId}/ only.
 */
export function assertSnapshotWriteAllowed(
  reportDirRelative: string,
  snapshotId: string,
  targetFilePath: string,
): void {
  const snapshotDir = resolveSnapshotStoreDirectory(reportDirRelative, snapshotId);
  const resolvedTarget = path.resolve(targetFilePath);
  const resolvedSnapshot = path.resolve(snapshotDir);
  const parityRoot = path.resolve(PARITY_ROOT);

  if (
    !resolvedTarget.startsWith(resolvedSnapshot + path.sep) &&
    resolvedTarget !== resolvedSnapshot
  ) {
    throw new Error(
      `Snapshot isolation violation: ${resolvedTarget} is outside snapshot directory ${resolvedSnapshot}`,
    );
  }
  if (!resolvedSnapshot.startsWith(parityRoot + path.sep)) {
    throw new Error('Snapshot isolation violation: snapshot directory escapes parity root');
  }
  if (path.basename(resolvedTarget).startsWith('..')) {
    throw new Error('Snapshot isolation violation: suspicious filename');
  }
}

export function snapshotAllowedWriteRoots(
  reportDirRelative: string,
  snapshotId: string,
): string[] {
  return [resolveSnapshotStoreDirectory(reportDirRelative, snapshotId)];
}
