/** EVB (evaluation-vector bundle) seal preparation — local-only, no deploy. */

export const EVB_SEAL_SPEC_VERSION = 'parity-evb-seal/1.0' as const;

/** Future EVB consumer compatibility tag (unchanged until seal writer ships). */
export const EVB_COMPAT_VERSION = '1' as const;

export const REPORT_HASH_ALGORITHM = 'sha256' as const;

/** Fields excluded from seal hash input (declared digests + seal envelope). */
export const SEAL_HASH_EXCLUDED_TOP_LEVEL = [
  'contentHash',
  'reportFingerprint',
  'bundleFingerprint',
  'evbSeal',
] as const;

export type SealHashExcludedField = (typeof SEAL_HASH_EXCLUDED_TOP_LEVEL)[number];

export const SEAL_STATUS_PREPARATION = 'preparation-only' as const;

export const SEAL_STATUS_UNSEALED = 'unsealed' as const;
