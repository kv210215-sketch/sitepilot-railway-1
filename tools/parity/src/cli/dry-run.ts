#!/usr/bin/env node
import { runDryRun } from '../harness/dry-run.js';

function parseArgs(argv: string[]): { configPath?: string } {
  const opts: { configPath?: string } = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--config' || arg === '-c') {
      const next = argv[i + 1];
      if (!next) {
        throw new Error('Missing value for --config');
      }
      opts.configPath = next;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: npm run dry-run [-- --config <path>]

Local parity harness dry-run (P2):
  - Validates ParityConfig (liveMode defaults false)
  - Plans read-only GET collectors (runtime / seo / jsonld)
  - When liveMode=false: no outbound HTTP; prints planned actions
  - When liveMode=true + origins set: executes GET-only collection
  - Writes JSON report under tools/parity/reports/
  - No deploy SDKs, no mutation methods
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv);
  const result = await runDryRun(opts);

  console.log('[parity-harness] dry-run complete');
  console.log(`  harness:     ${result.report.harnessVersion}`);
  console.log(`  liveMode:    ${result.report.config.liveMode}`);
  console.log(`  vectors:     ${result.report.config.vectors.join(', ')}`);
  console.log(
    `  network:     ${result.report.collectors.networkExecuted ? 'executed' : 'none'} (blockedByPolicy=${result.report.collectors.networkBlockedByPolicy})`,
  );
  console.log(`  safety:      ${result.ok ? 'PASS' : 'FAIL'}`);
  console.log(`  report:      ${result.reportPath}`);
  console.log(`  p2 readonly: ${result.report.p2Readiness.readOnlyCollectors}`);
  console.log(`  p2 live:     ${result.report.p2Readiness.liveCollectors}`);
  console.log(`  p3 diff:     ${result.report.p3Readiness.diffEngine}`);

  if (!result.ok) {
    for (const v of result.report.safety.violations) {
      console.error(`  violation:   ${v}`);
    }
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error('[parity-harness] fatal:', err);
  process.exit(1);
});
