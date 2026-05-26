import { createHash } from 'node:crypto';
import { contentHashSha256 } from '../hash/content-hash.js';
import { canonicalJsonString } from '../serialize/canonical-json.js';
import { canonicalReportString } from './canonical-report.js';
import { orderNamedDigests, type NamedDigest } from './hash-order.js';
import {
  REPORT_HASH_ALGORITHM,
  SEAL_HASH_EXCLUDED_TOP_LEVEL,
  type SealHashExcludedField,
} from './evb-spec.js';

export function stripSealHashFields<T extends Record<string, unknown>>(artifact: T): T {
  const out = { ...artifact };
  for (const key of SEAL_HASH_EXCLUDED_TOP_LEVEL) {
    delete out[key as SealHashExcludedField];
  }
  return out;
}

/** SHA-256 hex of seal-canonical report body (excludes declared digest fields). */
export function reportFingerprintSha256(artifact: Record<string, unknown>): string {
  const body = stripSealHashFields(artifact);
  return createHash(REPORT_HASH_ALGORITHM)
    .update(canonicalReportString(body), 'utf8')
    .digest('hex');
}

/**
 * Bundle fingerprint: sorted `{name,digest}` canonical lines joined by `\n`, then SHA-256.
 * Mirrors `projection_fingerprint_from_parts` in OSCTL.
 */
export function bundleFingerprintSha256(parts: NamedDigest[]): string {
  const ordered = orderNamedDigests(parts);
  const joined = ordered
    .map((part) =>
      canonicalJsonString({ name: part.name, digest: part.digest }),
    )
    .join('\n');
  return createHash(REPORT_HASH_ALGORITHM).update(joined, 'utf8').digest('hex');
}

/** Legacy content hash (default canonicalize — kept for existing report consumers). */
export function legacyContentHashSha256(artifact: Record<string, unknown>): string {
  const { contentHash: _omit, ...body } = artifact;
  return contentHashSha256(body);
}

export function verifyReportFingerprint(
  artifact: Record<string, unknown> & { reportFingerprint: string },
): boolean {
  return artifact.reportFingerprint === reportFingerprintSha256(artifact);
}
