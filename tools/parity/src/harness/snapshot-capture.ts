import { runDryRun, type DryRunOptions, type DryRunResult } from './dry-run.js';
import { buildLiveSnapshotCapture } from '../snapshot/snapshot-capture.js';
import { writeLiveSnapshot, type WriteSnapshotResult } from '../snapshot/snapshot-store.js';
import { snapshotAllowedWriteRoots } from '../snapshot/snapshot-isolation.js';
import type {
  LiveSnapshotCapture,
  SnapshotCollectorResults,
} from '../snapshot/snapshot-types.js';

export interface SnapshotCaptureOptions extends DryRunOptions {
  /** Treat capture as offline-replay sourced (no live network semantics in manifest). */
  offlineReplay?: boolean;
  capturedAt?: string;
  /** Override collector rows after dry-run (tests / deterministic seeds). */
  collectorResultsOverride?: SnapshotCollectorResults;
}

export interface SnapshotCaptureResult {
  ok: boolean;
  dryRun: DryRunResult;
  capture: LiveSnapshotCapture;
  store: WriteSnapshotResult;
  isolation: {
    allowedWriteRoots: string[];
  };
}

/**
 * Run dry-run collectors, build deterministic snapshot id, persist under isolated store.
 */
export async function runSnapshotCapture(
  options: SnapshotCaptureOptions = {},
): Promise<SnapshotCaptureResult> {
  const dryRun = await runDryRun(options);
  if (options.collectorResultsOverride) {
    dryRun.report.collectors.results = options.collectorResultsOverride;
  }
  const capture = buildLiveSnapshotCapture(dryRun.report, {
    offlineReplay: options.offlineReplay,
    capturedAt: options.capturedAt,
  });
  const store = await writeLiveSnapshot(capture, dryRun.report.config.reportDir);

  return {
    ok: dryRun.ok,
    capture,
    dryRun,
    store,
    isolation: {
      allowedWriteRoots: snapshotAllowedWriteRoots(
        dryRun.report.config.reportDir,
        capture.snapshotId,
      ),
    },
  };
}
