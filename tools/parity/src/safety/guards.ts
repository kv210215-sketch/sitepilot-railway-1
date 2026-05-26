import type { ParityConfig } from '../config/parity-config.schema.js';

/** Dependencies that must never appear in tools/parity/package.json. */
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

/**
 * Production host fragments blocked in parity config origins (staging-only policy).
 * Match rule: exact hostname OR subdomain (`host === fragment || host.endsWith('.${fragment}')`).
 */
export const FORBIDDEN_ORIGIN_HOST_FRAGMENTS = [
  'solomiya-energy.com',
  'www.solomiya-energy.com',
  'solomiya-landing.pages.dev',
  'solomiya-energy-landing.pages.dev',
  'sitepilot.app',
  'www.sitepilot.app',
] as const;

export interface SafetyGuarantees {
  noHttpWrites: boolean;
  noDeploySdks: boolean;
  noCloudflareSdk: boolean;
  noRailwaySdk: boolean;
  noMutationCode: boolean;
  liveModeDefault: boolean;
  collectorsImplemented: boolean;
  getOnlyWhenLive: boolean;
  networkInDryRun: boolean;
}

export const SAFETY_GUARANTEES: SafetyGuarantees = {
  noHttpWrites: true,
  noDeploySdks: true,
  noCloudflareSdk: true,
  noRailwaySdk: true,
  noMutationCode: true,
  liveModeDefault: false,
  collectorsImplemented: true,
  getOnlyWhenLive: true,
  networkInDryRun: false,
};

export interface SafetyCheckResult {
  ok: boolean;
  liveMode: boolean;
  violations: string[];
  warnings: string[];
  guarantees: SafetyGuarantees;
}

function originHostViolations(origin: string | null, label: string): string[] {
  if (!origin) {
    return [];
  }
  const hits: string[] = [];
  let host = '';
  try {
    host = new URL(origin).hostname.toLowerCase().replace(/\.+$/, '');
  } catch {
    hits.push(`${label}.origin is not a valid URL: ${origin}`);
    return hits;
  }
  for (const fragment of FORBIDDEN_ORIGIN_HOST_FRAGMENTS) {
    if (host === fragment || host.endsWith(`.${fragment}`)) {
      hits.push(`${label}.origin uses forbidden production host fragment: ${fragment}`);
    }
  }
  return hits;
}

/**
 * P2 dry-run safety: liveMode=false is always allowed (no network).
 * liveMode=true is allowed only with non-forbidden staging origins when explicitly configured.
 */
export function assertDryRunSafe(config: ParityConfig): SafetyCheckResult {
  const violations: string[] = [];
  const warnings: string[] = [];

  if (config.liveMode) {
    warnings.push(
      'liveMode=true: collectors may perform outbound GET requests when origins are configured.',
    );
    if (config.baseline.origin === null && config.target.origin === null) {
      warnings.push(
        'liveMode=true but both origins are null — collectors will plan GETs only (no network).',
      );
    }
  }

  violations.push(...originHostViolations(config.baseline.origin, 'baseline'));
  violations.push(...originHostViolations(config.target.origin, 'target'));

  return {
    ok: violations.length === 0,
    liveMode: config.liveMode,
    violations,
    warnings,
    guarantees: {
      ...SAFETY_GUARANTEES,
      networkInDryRun: config.liveMode && Boolean(config.baseline.origin || config.target.origin),
    },
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
