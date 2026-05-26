export {
  FIXTURE_PREFIX,
  FIXTURE_EXTENSION,
  buildFixtureFilename,
  fixtureIdFromScenario,
  isPairedScenario,
  type FixtureRole,
  type FixtureScenario,
} from './naming.js';
export {
  FIXTURES_DIR,
  FixtureManifestSchema,
  getFixtureById,
  loadFixtureManifest,
  resolveFixturePath,
  type FixtureManifest,
  type FixtureManifestEntry,
} from './manifest.js';
export { collectFixtureSnapshot, type FixtureHtmlSnapshot } from './collect-from-html.js';
export {
  classifySnapshotDrift,
  type SnapshotDriftReport,
  type SyntheticParityVerdict,
} from './compare-snapshot.js';
export {
  SYNTHETIC_PARITY_CASES,
  getSyntheticParityCase,
  type SyntheticParityCase,
} from './synthetic-cases.js';
