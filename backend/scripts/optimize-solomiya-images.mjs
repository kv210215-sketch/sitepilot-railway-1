#!/usr/bin/env node
/**
 * Optimize Solomiya image originals → self-hosted AVIF/WebP set.  DRY-RUN BY DEFAULT.
 *
 * Reads scripts/data/solomiya-image-manifest.json + the local import dir produced by
 * download-solomiya-images.mjs, and writes optimized assets into
 * marketing-web/public/images/solomiya/<category>/.
 *
 *   - Photographic (jpg/png): re-encode AVIF (primary) + WebP (fallback) at responsive
 *     widths (640/960/1280/1920, never upscaling past the original).
 *   - True vector SVG / icons: copied as-is (optionally minified if SVGO present).
 *   - Logo: never processed here — replaced in design (manifest.logoFix), not migrated.
 *
 * `sharp` is OPTIONAL. If it is not installed, this script DOES NOT FAIL: it writes an
 * exact per-file optimization checklist + planned-output mapping JSON and exits 0, so the
 * plan is reproducible without adding a dependency. Install sharp to actually encode:
 *     (cd marketing-web && npm i -D sharp)   # or: npm i -D sharp in backend
 *
 * Modes:
 *   (no flags) | --dry-run     Print plan / write checklist. Encodes nothing.
 *   --apply                    Actually encode (requires sharp + downloaded originals).
 *
 * Flags:
 *   --in=<dir>                 Import dir (default: <repo>/.solomiya-image-import).
 *   --out=<dir>                Output dir (default: marketing-web/public/images/solomiya).
 *   --widths=<csv>             Override responsive widths (default 640,960,1280,1920).
 *   --file=<path>             Override manifest path.
 *
 * NEVER: commits binaries automatically, deploys, publishes, or touches DB/DNS/env.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valOf = (k) => { const a = argv.find((x) => x.startsWith(k + '=')); return a ? a.split('=').slice(1).join('=') : null; };

const APPLY = has('--apply');
const MANIFEST = valOf('--file') || join(__dirname, 'data', 'solomiya-image-manifest.json');
const IN = resolve(valOf('--in') || join(repoRoot, '.solomiya-image-import'));
const OUT = resolve(valOf('--out') || join(repoRoot, 'marketing-web', 'public', 'images', 'solomiya'));
const WIDTHS = (valOf('--widths') || '640,960,1280,1920').split(',').map(Number).filter(Boolean);

function die(msg) { console.error('ERROR:', msg); process.exit(1); }
if (!existsSync(MANIFEST)) die(`manifest not found: ${MANIFEST}`);
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const assets = (manifest.assets || []).filter((a) => !a.skip && !a.isLogo);

async function loadSharp() {
  try { const m = await import('sharp'); return m.default || m; } catch { return null; }
}

function planFor(a) {
  const catDir = a.targetDir.replace(/^public\/images\/solomiya\//, '');
  if (a.keepAsVector) {
    return { type: 'svg-copy', outputs: [`${catDir}/${a.targetBasename}.svg`] };
  }
  const outputs = [];
  for (const w of WIDTHS) {
    outputs.push(`${catDir}/${a.targetBasename}-${w}.avif`);
    outputs.push(`${catDir}/${a.targetBasename}-${w}.webp`);
  }
  return { type: 'avif+webp', widths: WIDTHS, outputs };
}

async function main() {
  const sharp = await loadSharp();
  console.log(`Solomiya image optimize — ${APPLY ? 'APPLY' : 'DRY-RUN'} — sharp: ${sharp ? 'available' : 'NOT installed (fallback)'}`);
  console.log(`  import : ${IN}`);
  console.log(`  output : ${OUT}`);
  console.log(`  widths : ${WIDTHS.join(', ')}`);
  console.log(`  assets : ${assets.length} (logo + 2 system assets excluded)`);

  // Build the planned-output mapping + checklist regardless of sharp/apply.
  const checklist = assets.map((a) => ({
    id: a.id,
    category: a.category,
    source: a.sourceUrl,
    importFile: a.importFilename,
    strategy: a.optimize?.strategy,
    priority: a.priority,
    ...planFor(a),
  }));
  mkdirSync(OUT, { recursive: true });
  const mapPath = join(OUT, '_optimization-plan.json');
  writeFileSync(mapPath, JSON.stringify({
    generated: new Date().toISOString(),
    note: 'Planned optimized outputs. AVIF primary + WebP fallback at responsive widths; vectors copied as-is. Logo replaced in design, not migrated.',
    widths: WIDTHS,
    totalAssets: checklist.length,
    plannedOutputFiles: checklist.reduce((n, c) => n + c.outputs.length, 0),
    checklist,
  }, null, 2));
  console.log(`  wrote optimization plan/checklist: ${mapPath} (${checklist.reduce((n, c) => n + c.outputs.length, 0)} planned output files)`);

  if (!APPLY) {
    console.log('\nDRY-RUN: nothing encoded. The plan/checklist above is the deliverable.');
    if (!sharp) console.log('Install sharp and re-run with --apply to actually encode: (cd marketing-web && npm i -D sharp)');
    return;
  }
  if (!sharp) {
    console.log('\nFALLBACK: sharp is not installed, so no encoding was performed.');
    console.log('The exact per-file checklist + planned outputs were written above. Install sharp to encode.');
    return; // exit 0 — do not fail the pipeline
  }
  if (!existsSync(IN)) die(`import dir not found: ${IN} — run download-solomiya-images.mjs --apply first`);

  let encoded = 0, copied = 0, missing = 0;
  for (const a of assets) {
    const catDir = a.targetDir.replace(/^public\/images\/solomiya\//, '');
    const src = join(IN, catDir, a.importFilename);
    const outDir = join(OUT, catDir);
    mkdirSync(outDir, { recursive: true });
    if (!existsSync(src)) { missing++; continue; }
    if (a.keepAsVector) { copyFileSync(src, join(outDir, `${a.targetBasename}.svg`)); copied++; continue; }
    const img = sharp(src);
    const meta = await img.metadata();
    for (const w of WIDTHS) {
      if (meta.width && w > meta.width) continue; // never upscale
      const base = sharp(src).resize({ width: w });
      await base.clone().avif({ quality: 50 }).toFile(join(outDir, `${a.targetBasename}-${w}.avif`));
      await base.clone().webp({ quality: 72 }).toFile(join(outDir, `${a.targetBasename}-${w}.webp`));
      encoded++;
    }
  }
  console.log(`\n  done: ${encoded} encoded variants, ${copied} vectors copied, ${missing} missing originals.`);
  if (missing) console.log('  (missing originals → run download-solomiya-images.mjs --apply, or download --only those categories)');
}
main().catch((e) => die(e.stack || String(e)));
