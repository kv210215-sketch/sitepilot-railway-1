import assert from 'node:assert/strict';
import type { CollectorContext } from './types.js';

/**
 * Runtime assertion: when liveMode=false, collectors must return planned-only
 * and must never call ParityGetClient.get.
 */
export function assertPlannedOnlyCollectorMode(context: CollectorContext): void {
  assert.equal(
    context.liveMode,
    false,
    'collector invariant: liveMode=false requires planned-only results; HTTP must not run',
  );
}
