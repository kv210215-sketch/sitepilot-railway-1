import { runDeterminismVerification } from '../harness/determinism-verify.js';

async function main(): Promise<void> {
  const configArg = process.argv.find((a) => a.startsWith('--config='));
  const configPath = configArg?.slice('--config='.length);

  const result = await runDeterminismVerification({ configPath });
  console.log(`[parity-harness] determinism verdict: ${result.report.verdict}`);
  console.log(`[parity-harness] report: ${result.reportPath}`);
  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  console.error('[parity-harness] determinism verification failed:', err);
  process.exitCode = 1;
});
