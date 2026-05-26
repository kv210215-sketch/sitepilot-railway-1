import { createHash } from 'node:crypto';
import { canonicalJsonString } from '../serialize/canonical-json.js';
import type { ParityConfig } from '../config/parity-config.schema.js';

/** Deterministic run id from config vectors and endpoint labels (no timestamps). */
export function deriveP3RunId(config: ParityConfig): string {
  const fingerprint = {
    version: config.version,
    vectors: [...config.vectors].sort(),
    baselineLabel: config.baseline.label,
    targetLabel: config.target.label,
    liveMode: config.liveMode,
  };
  const digest = createHash('sha256')
    .update(canonicalJsonString(fingerprint), 'utf8')
    .digest('hex')
    .slice(0, 12);
  return `run-${digest}`;
}
