import {
  EVB_COMPAT_VERSION,
  EVB_SEAL_SPEC_VERSION,
  REPORT_HASH_ALGORITHM,
  SEAL_STATUS_PREPARATION,
} from './evb-spec.js';
import { REPORT_SERIALIZATION_FOR_SEAL } from './canonical-report.js';

export interface EvbSealMetaInput {
  runId: string;
  reportKind: string;
  generatedAt: string;
  reportFingerprint: string;
  bundleFingerprint?: string;
}

export interface EvbSealMeta {
  evbCompatVersion: typeof EVB_COMPAT_VERSION;
  evbSealSpecVersion: typeof EVB_SEAL_SPEC_VERSION;
  sealStatus: typeof SEAL_STATUS_PREPARATION;
  hashAlgorithm: typeof REPORT_HASH_ALGORITHM;
  reportFingerprint: string;
  bundleFingerprint?: string;
  preparationOnly: true;
  sealWriter: null;
  canonicalRules: typeof REPORT_SERIALIZATION_FOR_SEAL;
  runId: string;
  reportKind: string;
  generatedAt: string;
}

export function buildEvbSealMeta(input: EvbSealMetaInput): EvbSealMeta {
  return {
    evbCompatVersion: EVB_COMPAT_VERSION,
    evbSealSpecVersion: EVB_SEAL_SPEC_VERSION,
    sealStatus: SEAL_STATUS_PREPARATION,
    hashAlgorithm: REPORT_HASH_ALGORITHM,
    reportFingerprint: input.reportFingerprint,
    bundleFingerprint: input.bundleFingerprint,
    preparationOnly: true,
    sealWriter: null,
    canonicalRules: REPORT_SERIALIZATION_FOR_SEAL,
    runId: input.runId,
    reportKind: input.reportKind,
    generatedAt: input.generatedAt,
  };
}
