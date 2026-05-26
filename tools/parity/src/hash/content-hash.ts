import { createHash } from 'node:crypto';
import { canonicalJsonString } from '../serialize/canonical-json.js';

export const CONTENT_HASH_ALGORITHM = 'sha256' as const;

/** SHA-256 hex digest of canonical JSON (excludes hash fields from payload by caller). */
export function contentHashSha256(payload: unknown): string {
  const canonical = canonicalJsonString(payload);
  return createHash(CONTENT_HASH_ALGORITHM).update(canonical, 'utf8').digest('hex');
}
