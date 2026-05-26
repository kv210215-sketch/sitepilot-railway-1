import { isNetworkBlockedByPolicy } from '../http/network-policy.js';
import type { LiveSnapshotCapture } from './snapshot-types.js';
import { assertDeepFrozen } from './snapshot-freeze.js';

export interface ReplaySafetyContext {
  /** Offline replay must run with liveMode=false (no outbound HTTP). */
  offlineReplay: boolean;
  liveMode: boolean;
}

/**
 * Stored capture must be replay-safe (no live network recorded) for offline replay.
 */
export function assertOfflineReplayCapture(capture: LiveSnapshotCapture): void {
  if (capture.config.liveMode) {
    throw new Error('Offline replay violation: stored capture has liveMode=true');
  }
  if (capture.networkExecuted) {
    throw new Error('Offline replay violation: capture recorded live network execution');
  }
  if (capture.replayMode !== 'offline-replay' && !capture.networkBlockedByPolicy) {
    throw new Error('Offline replay violation: capture is not marked offline-replay safe');
  }
}

/**
 * Replay-safe guard: offline mode forbids network and requires frozen capture.
 */
export function assertReplaySafe(context: ReplaySafetyContext, capture?: LiveSnapshotCapture): void {
  if (context.offlineReplay) {
    if (context.liveMode) {
      throw new Error('Offline replay violation: liveMode must be false');
    }
    if (capture) {
      assertOfflineReplayCapture(capture);
    }
  }
  if (capture) {
    assertDeepFrozen(capture, 'live-snapshot-capture');
  }
}

export function replayUsesNetwork(capture: LiveSnapshotCapture): boolean {
  return (
    !isNetworkBlockedByPolicy(capture.config.liveMode) &&
    capture.networkExecuted &&
    capture.replayMode === 'live-capture'
  );
}

/**
 * Replay never performs network — stored collector rows only.
 * Verifies policy would block HTTP (does not invoke fetch).
 */
export function assertReplayNoNetwork(): void {
  if (!isNetworkBlockedByPolicy(false)) {
    throw new Error('Replay safety: network policy must block HTTP when liveMode=false');
  }
}
