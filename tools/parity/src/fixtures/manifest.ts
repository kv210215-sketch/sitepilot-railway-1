import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { FIXTURE_EXTENSION, FIXTURE_PREFIX } from './naming.js';

const FixtureEntrySchema = z.object({
  id: z.string().min(1),
  scenario: z.string().min(1),
  role: z.enum(['baseline', 'target']).optional(),
  file: z.string().min(1),
  kind: z.enum(['single', 'paired']),
  pairId: z.string().optional(),
  description: z.string().min(1),
});

const LegacyAliasSchema = z.object({
  file: z.string().min(1),
  equivalentId: z.string().min(1),
});

export const FixtureManifestSchema = z.object({
  version: z.literal('1'),
  naming: z.object({
    prefix: z.literal(FIXTURE_PREFIX),
    extension: z.literal(FIXTURE_EXTENSION),
  }),
  fixtures: z.array(FixtureEntrySchema).min(1),
  legacyAliases: z.array(LegacyAliasSchema).optional(),
});

export type FixtureManifest = z.infer<typeof FixtureManifestSchema>;
export type FixtureManifestEntry = z.infer<typeof FixtureEntrySchema>;

export const FIXTURES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures',
);

const MANIFEST_PATH = path.join(FIXTURES_DIR, 'manifest.json');

export async function loadFixtureManifest(
  manifestPath: string = MANIFEST_PATH,
): Promise<FixtureManifest> {
  const raw = await readFile(manifestPath, 'utf8');
  return FixtureManifestSchema.parse(JSON.parse(raw));
}

export function resolveFixturePath(entry: FixtureManifestEntry): string {
  return path.join(FIXTURES_DIR, entry.file);
}

export function getFixtureById(
  manifest: FixtureManifest,
  id: string,
): FixtureManifestEntry {
  const entry = manifest.fixtures.find((f) => f.id === id);
  if (!entry) {
    throw new Error(`unknown fixture id: ${id}`);
  }
  return entry;
}
