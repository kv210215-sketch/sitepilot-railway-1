import { P3_REPORT_FILENAMES, type P3ReportArtifact } from '../report/p3-schemas.js';
import { bundleFingerprintSha256 } from './fingerprint.js';
import { orderNamedDigests } from './hash-order.js';

export interface BundleArtifactDigest {
  filename: string;
  reportFingerprint: string;
}

const ARTIFACT_FILENAME_BY_KIND: Record<P3ReportArtifact['reportKind'], string> = {
  'diff-summary': P3_REPORT_FILENAMES.diffSummary,
  'ev-runtime-report': P3_REPORT_FILENAMES.evRuntime,
  'ev-seo-report': P3_REPORT_FILENAMES.evSeo,
  'ev-jsonld-report': P3_REPORT_FILENAMES.evJsonLd,
};

export function collectBundleArtifactDigests(
  artifacts: P3ReportArtifact[],
): BundleArtifactDigest[] {
  return orderNamedDigests(
    artifacts.map((artifact) => ({
      name: ARTIFACT_FILENAME_BY_KIND[artifact.reportKind],
      digest: artifact.reportFingerprint,
    })),
  ).map((entry) => ({ filename: entry.name, reportFingerprint: entry.digest }));
}

export function computeBundleFingerprint(artifacts: P3ReportArtifact[]): string {
  const parts = artifacts.map((artifact) => ({
    name: ARTIFACT_FILENAME_BY_KIND[artifact.reportKind],
    digest: artifact.reportFingerprint,
  }));
  return bundleFingerprintSha256(parts);
}
