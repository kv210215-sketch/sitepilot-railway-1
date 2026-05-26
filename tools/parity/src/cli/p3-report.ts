#!/usr/bin/env node
import { runP3Report } from '../harness/p3-report.js';

function parseArgs(argv: string[]): { configPath?: string } {
  const out: { configPath?: string } = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--config' || arg === '-c') {
      out.configPath = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const result = await runP3Report(opts);

  console.log('[parity-harness] P3 report pipeline');
  console.log(`  runId:       ${result.runId}`);
  console.log(`  generatedAt: ${result.bundle.diffSummary.generatedAt}`);
  console.log(`  verdict:     ${result.bundle.diffSummary.overall.verdict}`);
  console.log(`  run dir:     ${result.writeResult.runDirectory}`);
  console.log(`  diff:        ${result.writeResult.files.diffSummary}`);
  if (result.writeResult.files.evRuntime) {
    console.log(`  runtime:     ${result.writeResult.files.evRuntime}`);
  }
  if (result.writeResult.files.evSeo) {
    console.log(`  seo:         ${result.writeResult.files.evSeo}`);
  }
  if (result.writeResult.files.evJsonLd) {
    console.log(`  jsonld:      ${result.writeResult.files.evJsonLd}`);
  }
  console.log(`  p4 blockers: ${result.bundle.diffSummary.p4Readiness.blockers.join(', ') || '(none)'}`);

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  console.error('[parity-harness] P3 report failed:', err);
  process.exitCode = 1;
});
