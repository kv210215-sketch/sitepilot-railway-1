import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { canonicalJsonString } from '../serialize/canonical-json.js';
import {
  buildSnapshotManifest,
  verifyCaptureContentHash,
  verifyManifestFingerprint,
} from './snapshot-capture.js';
import { deepFreeze } from './snapshot-freeze.js';
import {
  assertSnapshotWriteAllowed,
  resolveSnapshotStoreDirectory,
  snapshotAllowedWriteRoots,
} from './snapshot-isolation.js';
import {
  LiveSnapshotCaptureSchema,
  SnapshotManifestSchema,
  SNAPSHOT_ARTIFACT_FILENAMES,
  type LiveSnapshotCapture,
  type SnapshotManifest,
} from './snapshot-types.js';

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export interface WriteSnapshotResult {
  snapshotId: string;
  snapshotDir: string;
  files: {
    capture: string;
    manifest: string;
  };
  isolation: {
    allowedWriteRoots: string[];
  };
}

export interface ReadSnapshotResult {
  capture: Readonly<LiveSnapshotCapture>;
  manifest: Readonly<SnapshotManifest>;
  snapshotDir: string;
}

async function assertWriteOnce(targetPath: string): Promise<void> {
  if (await pathExists(targetPath)) {
    throw new Error(`Snapshot store write-once violation: ${targetPath} already exists`);
  }
}

/**
 * Persist an isolated live snapshot (write-once per snapshotId).
 */
export async function writeLiveSnapshot(
  capture: LiveSnapshotCapture,
  reportDirRelative: string,
): Promise<WriteSnapshotResult> {
  const snapshotId = capture.snapshotId;
  const snapshotDir = resolveSnapshotStoreDirectory(reportDirRelative, snapshotId);
  await mkdir(snapshotDir, { recursive: true });

  const capturePath = path.join(snapshotDir, SNAPSHOT_ARTIFACT_FILENAMES.capture);
  const manifestPath = path.join(snapshotDir, SNAPSHOT_ARTIFACT_FILENAMES.manifest);

  assertSnapshotWriteAllowed(reportDirRelative, snapshotId, capturePath);
  assertSnapshotWriteAllowed(reportDirRelative, snapshotId, manifestPath);

  await assertWriteOnce(capturePath);
  await assertWriteOnce(manifestPath);

  if (!verifyCaptureContentHash(capture)) {
    throw new Error(`Snapshot content hash mismatch for ${snapshotId}`);
  }

  const manifest = buildSnapshotManifest(capture);
  if (!verifyManifestFingerprint(manifest, capture)) {
    throw new Error(`Snapshot manifest fingerprint mismatch for ${snapshotId}`);
  }

  const captureLine = `${canonicalJsonString(capture)}\n`;
  const manifestLine = `${canonicalJsonString(manifest)}\n`;

  await writeFile(capturePath, captureLine, { encoding: 'utf8', flag: 'wx' });
  await writeFile(manifestPath, manifestLine, { encoding: 'utf8', flag: 'wx' });

  return {
    snapshotId,
    snapshotDir,
    files: { capture: capturePath, manifest: manifestPath },
    isolation: {
      allowedWriteRoots: snapshotAllowedWriteRoots(reportDirRelative, snapshotId),
    },
  };
}

/**
 * Load a stored snapshot, verify hashes, and return a deep-frozen readonly graph.
 */
export async function readLiveSnapshot(
  reportDirRelative: string,
  snapshotId: string,
): Promise<ReadSnapshotResult> {
  const snapshotDir = resolveSnapshotStoreDirectory(reportDirRelative, snapshotId);
  const capturePath = path.join(snapshotDir, SNAPSHOT_ARTIFACT_FILENAMES.capture);
  const manifestPath = path.join(snapshotDir, SNAPSHOT_ARTIFACT_FILENAMES.manifest);

  assertSnapshotWriteAllowed(reportDirRelative, snapshotId, capturePath);
  assertSnapshotWriteAllowed(reportDirRelative, snapshotId, manifestPath);

  const { readFile } = await import('node:fs/promises');
  const captureRaw = await readFile(capturePath, 'utf8');
  const manifestRaw = await readFile(manifestPath, 'utf8');

  const capture = LiveSnapshotCaptureSchema.parse(JSON.parse(captureRaw));
  const manifest = SnapshotManifestSchema.parse(JSON.parse(manifestRaw));

  if (capture.snapshotId !== snapshotId || manifest.snapshotId !== snapshotId) {
    throw new Error(`Snapshot id mismatch: expected ${snapshotId}`);
  }
  if (!verifyCaptureContentHash(capture)) {
    throw new Error(`Stored capture content hash invalid for ${snapshotId}`);
  }
  if (!verifyManifestFingerprint(manifest, capture)) {
    throw new Error(`Stored manifest fingerprint invalid for ${snapshotId}`);
  }
  if (manifest.contentHash !== capture.contentHash) {
    throw new Error(`Manifest/capture contentHash mismatch for ${snapshotId}`);
  }

  return {
    capture: deepFreeze(capture),
    manifest: deepFreeze(manifest),
    snapshotDir,
  };
}
