import { z } from 'zod';
import type {
  JsonLdCollectResult,
  RuntimeCollectResult,
  SeoCollectResult,
} from '../collectors/types.js';
import type { ParityConfig } from '../config/parity-config.schema.js';

const RuntimeCollectResultSchema = z.object({
  vector: z.literal('runtime'),
  url: z.string(),
  status: z.number().nullable(),
  title: z.string().nullable(),
  bodySummary: z.unknown().nullable(),
  collectedAt: z.string(),
  source: z.enum(['live', 'planned-only']),
  error: z.string().optional(),
});

const SeoCollectResultSchema = z.object({
  vector: z.literal('seo'),
  url: z.string(),
  meta: z.unknown().nullable(),
  collectedAt: z.string(),
  source: z.enum(['live', 'planned-only']),
  error: z.string().optional(),
});

const JsonLdCollectResultSchema = z.object({
  vector: z.literal('jsonld'),
  url: z.string(),
  blocks: z.array(z.unknown()),
  collectedAt: z.string(),
  source: z.enum(['live', 'planned-only']),
  error: z.string().optional(),
});

const VectorBundleSchema = z.object({
  baseline: z.array(z.unknown()),
  target: z.array(z.unknown()),
});

export const SnapshotCollectorResultsSchema = z.object({
  runtime: VectorBundleSchema.optional(),
  seo: VectorBundleSchema.optional(),
  jsonld: VectorBundleSchema.optional(),
});

export const SnapshotManifestSchema = z.object({
  version: z.literal('1'),
  snapshotId: z.string().regex(/^snap-[a-f0-9]{12}$/),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  capturedAt: z.string(),
  replayMode: z.enum(['live-capture', 'offline-replay']),
  replaySafe: z.literal(true),
  configFingerprint: z.object({
    version: z.string(),
    vectors: z.array(z.string()),
    baselineLabel: z.string(),
    targetLabel: z.string(),
    liveMode: z.boolean(),
    collectorResultsHash: z.string().regex(/^[a-f0-9]{64}$/),
  }),
  artifacts: z.object({
    capture: z.literal('capture.json'),
    manifest: z.literal('manifest.json'),
  }),
  isolation: z.object({
    storeSubdir: z.literal('snapshots'),
    immutable: z.literal(true),
  }),
});

export const LiveSnapshotCaptureSchema = z.object({
  snapshotId: z.string().regex(/^snap-[a-f0-9]{12}$/),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  capturedAt: z.string(),
  replayMode: z.enum(['live-capture', 'offline-replay']),
  config: z.custom<ParityConfig>(),
  collectorResults: SnapshotCollectorResultsSchema,
  networkExecuted: z.boolean(),
  networkBlockedByPolicy: z.boolean(),
});

export type SnapshotCollectorResults = {
  runtime?: { baseline: RuntimeCollectResult[]; target: RuntimeCollectResult[] };
  seo?: { baseline: SeoCollectResult[]; target: SeoCollectResult[] };
  jsonld?: { baseline: JsonLdCollectResult[]; target: JsonLdCollectResult[] };
};

export type SnapshotManifest = z.infer<typeof SnapshotManifestSchema>;
export type LiveSnapshotCapture = z.infer<typeof LiveSnapshotCaptureSchema>;

export const SNAPSHOT_ARTIFACT_FILENAMES = {
  capture: 'capture.json',
  manifest: 'manifest.json',
} as const;
