#!/usr/bin/env node
/**
 * Download Solomiya image originals (Tilda → local import dir).  DRY-RUN BY DEFAULT.
 *
 * Reads scripts/data/solomiya-image-manifest.json and, by default, ONLY prints the
 * download plan. It writes NOTHING unless you pass --apply. Even with --apply it
 * downloads ONLY into a local import dir OUTSIDE the committed tree (gitignored) —
 * never into marketing-web/public. These are unoptimized originals; run
 * optimize-solomiya-images.mjs afterwards to produce the self-hosted AVIF/WebP set.
 *
 * Modes:
 *   (no flags) | --dry-run     Validate manifest + print plan. Downloads nothing.
 *   --apply                    Actually download non-skip originals into the import dir.
 *
 * Flags:
 *   --out=<dir>                Import dir (default: <repo>/.solomiya-image-import).
 *   --only=<category,...>      Restrict to categories (hero,project,background,card,brand,icon).
 *   --critical-only            Download only priority=critical-lcp assets (hero + logo).
 *   --force                    Re-download even if the target file already exists.
 *   --gap-ms=<n>               Politeness spacing between requests (default 250).
 *   --file=<path>             Override manifest path.
 *
 * NEVER: writes into marketing-web/public, commits binaries, changes DNS/env/Tilda,
 *        deploys, publishes, or touches the DB. Skips Tilda system assets (skip:true).
 * NOTE: confirm licensing of stock/AI-generated files before publishing (see
 *       docs/solomiya-image-migration-plan.md §Risks). Downloading for local prep is fine.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valOf = (k) => { const a = argv.find((x) => x.startsWith(k + '=')); return a ? a.split('=').slice(1).join('=') : null; };

const APPLY = has('--apply');
const CRITICAL_ONLY = has('--critical-only');
const FORCE = has('--force');
const GAP_MS = Number(valOf('--gap-ms') ?? 250);
const ONLY = (valOf('--only') || '').split(',').map((s) => s.trim()).filter(Boolean);
const MANIFEST = valOf('--file') || join(__dirname, 'data', 'solomiya-image-manifest.json');
const OUT = resolve(valOf('--out') || join(repoRoot, '.solomiya-image-import'));

function die(msg) { console.error('ERROR:', msg); process.exit(1); }
if (!existsSync(MANIFEST)) die(`manifest not found: ${MANIFEST}`);

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
let assets = (manifest.assets || []).filter((a) => !a.skip);
if (ONLY.length) assets = assets.filter((a) => ONLY.includes(a.category));
if (CRITICAL_ONLY) assets = assets.filter((a) => a.priority === 'critical-lcp');
// The logo is intentionally NOT downloaded — it is replaced, not migrated (logoFix).
const logoAssets = assets.filter((a) => a.isLogo);
assets = assets.filter((a) => !a.isLogo);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`Solomiya image download — ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`  manifest : ${MANIFEST}`);
  console.log(`  import   : ${OUT}`);
  console.log(`  selected : ${assets.length} asset(s)${ONLY.length ? ` (categories: ${ONLY.join(',')})` : ''}${CRITICAL_ONLY ? ' (critical-lcp only)' : ''}`);
  if (logoAssets.length) console.log(`  logo     : ${logoAssets.length} skipped on purpose (replaced, not migrated — see manifest.logoFix)`);

  if (!APPLY) {
    const byCat = {};
    let kb = 0;
    for (const a of assets) { byCat[a.category] = (byCat[a.category] || 0) + 1; kb += a.originalKB || 0; }
    console.log('  plan by category:', JSON.stringify(byCat));
    console.log(`  approx original weight: ${(kb / 1024).toFixed(1)} MB`);
    console.log('\nDRY-RUN: nothing downloaded. Re-run with --apply to fetch originals into the import dir.');
    return;
  }

  mkdirSync(OUT, { recursive: true });
  const mapping = [];
  let ok = 0, skipped = 0, failed = 0;
  for (const a of assets) {
    const sub = join(OUT, a.targetDir.replace(/^public\/images\/solomiya\//, ''));
    mkdirSync(sub, { recursive: true });
    const dest = join(sub, a.importFilename);
    if (existsSync(dest) && !FORCE) { skipped++; continue; }
    try {
      const res = await fetch(a.sourceUrl, { headers: { 'user-agent': 'solomiya-owner-maintenance/1.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(dest, buf);
      mapping.push({ id: a.id, source: a.sourceUrl, file: dest, bytes: buf.length, category: a.category });
      ok++;
      process.stdout.write(`\r  downloaded ${ok}/${assets.length} ...`);
    } catch (e) {
      failed++;
      mapping.push({ id: a.id, source: a.sourceUrl, error: String(e.message || e) });
    }
    await sleep(GAP_MS);
  }
  const mapPath = join(OUT, '_download-map.json');
  writeFileSync(mapPath, JSON.stringify({ generated: new Date().toISOString(), ok, skipped, failed, mapping }, null, 2));
  console.log(`\n  done: ${ok} downloaded, ${skipped} already-present, ${failed} failed.`);
  console.log(`  map: ${mapPath}`);
  console.log('  next: node backend/scripts/optimize-solomiya-images.mjs --apply');
}
main().catch((e) => die(e.stack || String(e)));
