import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ParityConfigSchema, type ParityConfig } from './parity-config.schema.js';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PARITY_ROOT = path.resolve(MODULE_DIR, '../..');
export const DEFAULT_CONFIG_PATH = path.join(PARITY_ROOT, 'config', 'default.parity.json');

export async function loadParityConfig(configPath?: string): Promise<ParityConfig> {
  const resolved = configPath
    ? path.isAbsolute(configPath)
      ? configPath
      : path.resolve(process.cwd(), configPath)
    : DEFAULT_CONFIG_PATH;

  const raw = await readFile(resolved, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  return ParityConfigSchema.parse(parsed);
}
