import type { ParityConfig } from '../config/parity-config.schema.js';

/** Dependencies that must never appear in tools/parity/package.json (P1 guard). */
export const FORBIDDEN_DEPENDENCY_PREFIXES = [
  'wrangler',
  '@cloudflare/',
  '@railway/',
  'railway',
  'axios',
  'node-fetch',
  'got',
  'ky',
  'undici',
] as const;

export const SAFETY_GUARANTEES = {
  noHttpWrites: true,
  noDeploySdks: true,
  noCloudflareSdk: true,
  noRailwaySdk: true,
  noMutationCode: true,
  liveModeDefault: false,
  collectorsEnabled: false,
  networkInDryRun: false,
} as const;

export interface SafetyCheckResult {
  ok: boolean;
  liveMode: boolean;
  violations: string[];
  guarantees: typeof SAFETY_GUARANTEES;
}

export function assertDryRunSafe(config: ParityConfig): SafetyCheckResult {
  const violations: string[] = [];

  if (config.liveMode) {
    violations.push(
      'liveMode=true is not supported in P1 dry-run. Set liveMode to false or wait for P2 collectors.',
    );
  }

  if (config.baseline.origin !== null || config.target.origin !== null) {
    violations.push(
      'P1 config must keep baseline.origin and target.origin null. Do not embed production URLs in harness config.',
    );
  }

  return {
    ok: violations.length === 0,
    liveMode: config.liveMode,
    violations,
    guarantees: SAFETY_GUARANTEES,
  };
}

export function assertNoForbiddenDeps(dependencyNames: string[]): string[] {
  const hits: string[] = [];
  for (const name of dependencyNames) {
    const lower = name.toLowerCase();
    for (const forbidden of FORBIDDEN_DEPENDENCY_PREFIXES) {
      if (lower === forbidden || lower.startsWith(forbidden)) {
        hits.push(name);
        break;
      }
    }
  }
  return hits;
}
