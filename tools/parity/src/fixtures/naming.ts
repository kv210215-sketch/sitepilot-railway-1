/** Deterministic on-disk fixture naming for offline parity harness tests. */
export const FIXTURE_PREFIX = 'parity-fixture-' as const;
export const FIXTURE_EXTENSION = '.html' as const;

export type FixtureRole = 'baseline' | 'target';

export type FixtureScenario =
  | 'reference-home'
  | 'identical'
  | 'warning-drift'
  | 'fail-drift'
  | 'malformed-jsonld'
  | 'missing-canonical'
  | 'robots-noindex'
  | 'missing-lead-form';

const PAIRED_SCENARIOS = new Set<FixtureScenario>([
  'identical',
  'warning-drift',
  'fail-drift',
]);

export function isPairedScenario(scenario: FixtureScenario): boolean {
  return PAIRED_SCENARIOS.has(scenario);
}

/** Build `parity-fixture-{scenario}[-{role}].html`. Single-page scenarios omit the role suffix. */
export function buildFixtureFilename(
  scenario: FixtureScenario,
  role?: FixtureRole,
): string {
  if (isPairedScenario(scenario)) {
    if (!role) {
      throw new Error(`paired scenario "${scenario}" requires baseline or target role`);
    }
    return `${FIXTURE_PREFIX}${scenario}-${role}${FIXTURE_EXTENSION}`;
  }
  return `${FIXTURE_PREFIX}${scenario}${FIXTURE_EXTENSION}`;
}

export function fixtureIdFromScenario(scenario: FixtureScenario, role?: FixtureRole): string {
  if (role) {
    return `${scenario}-${role}`;
  }
  return scenario;
}
