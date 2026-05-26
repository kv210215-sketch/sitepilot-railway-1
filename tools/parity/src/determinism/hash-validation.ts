import { contentHashSha256 } from '../hash/content-hash.js';
import { reportFingerprintSha256 } from '../seal/fingerprint.js';
import type { HashMismatch } from './types.js';

/** Fields appended by `attachSealReadyHashes` — excluded from legacy contentHash input. */
const CONTENT_HASH_EXCLUDED = ['contentHash', 'reportFingerprint', 'evbSeal'] as const;

export function stripContentHashFields<T extends Record<string, unknown>>(artifact: T): T {
  const out = { ...artifact };
  for (const key of CONTENT_HASH_EXCLUDED) {
    delete out[key];
  }
  return out;
}

/** Recompute SHA-256 over P3 artifact body (excludes seal envelope fields). */
export function computeArtifactBodyHash(artifact: Record<string, unknown>): string {
  return contentHashSha256(stripContentHashFields(artifact));
}

export function verifyDeclaredContentHash(
  artifactId: string,
  artifact: Record<string, unknown> & { contentHash: string },
): HashMismatch | null {
  const declared = artifact.contentHash;
  const computed = computeArtifactBodyHash(artifact);
  if (declared === computed) {
    return null;
  }
  return { artifactId: `${artifactId}:contentHash`, declaredHash: declared, computedHash: computed };
}

export function verifyDeclaredReportFingerprint(
  artifactId: string,
  artifact: Record<string, unknown> & { reportFingerprint: string },
): HashMismatch | null {
  const declared = artifact.reportFingerprint;
  const computed = reportFingerprintSha256(artifact);
  if (declared === computed) {
    return null;
  }
  return {
    artifactId: `${artifactId}:reportFingerprint`,
    declaredHash: declared,
    computedHash: computed,
  };
}

export function collectHashMismatches(
  artifacts: Array<{
    id: string;
    artifact: Record<string, unknown> & { contentHash: string; reportFingerprint?: string };
  }>,
): HashMismatch[] {
  const mismatches: HashMismatch[] = [];
  for (const { id, artifact } of artifacts) {
    const contentMismatch = verifyDeclaredContentHash(id, artifact);
    if (contentMismatch) {
      mismatches.push(contentMismatch);
    }
    if (typeof artifact.reportFingerprint === 'string') {
      const fingerprintMismatch = verifyDeclaredReportFingerprint(id, {
        ...artifact,
        reportFingerprint: artifact.reportFingerprint,
      });
      if (fingerprintMismatch) {
        mismatches.push(fingerprintMismatch);
      }
    }
  }
  return mismatches;
}
