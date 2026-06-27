#!/usr/bin/env node
/**
 * Import Solomiya Tilda → SitePilot draft pages.  DRY-RUN BY DEFAULT.
 *
 * Reads scripts/data/solomiya-tilda-pages.draft.json (31 pages) and, by default,
 * ONLY validates + prints a plan. It writes NOTHING unless you pass --apply.
 * Even with --apply it creates pages as status='draft' (never published) and
 * skips the homepage '/' unless --include-homepage is given.
 *
 * Modes:
 *   (no flags) | --dry-run        Structural validation + plan. NO DB connection.
 *   --check-existing              Dry-run + READ-ONLY DB lookup of existing paths
 *                                 (needs DATABASE_URL). Still writes nothing.
 *   --apply --confirm-apply       ACTUALLY insert missing pages as draft.
 *                                 Refuses without BOTH flags and DATABASE_URL.
 *
 * Extra flags:
 *   --include-homepage            Allow creating/touching '/' (off by default).
 *   --update-existing             With --apply, update pages whose path already
 *                                 exists (default: skip existing, never overwrite).
 *   --only=<p1,p2,...>            Restrict the ENTIRE run to this path allowlist.
 *                                 Any page in the file whose path is not listed is
 *                                 ignored (never created, updated, or read). A path
 *                                 in the list but absent from the file aborts the run.
 *                                 Use this to guarantee a tightly-scoped re-sync.
 *   --file=<path>                 Override draft JSON path.
 *
 * NEVER: publishes, changes DNS/env/Cloudflare/Tilda, deploys, or deletes pages.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valOf = (k) => { const a = argv.find((x) => x.startsWith(k + '=')); return a ? a.split('=').slice(1).join('=') : null; };

const APPLY = has('--apply');
const CONFIRM = has('--confirm-apply');
const CHECK_EXISTING = has('--check-existing');
const INCLUDE_HOMEPAGE = has('--include-homepage');
const UPDATE_EXISTING = has('--update-existing');
const ONLY = valOf('--only'); // comma-separated path allowlist, or null
const ONLY_SET = ONLY ? new Set(ONLY.split(',').map((s) => s.trim()).filter(Boolean)) : null;
const FILE = valOf('--file') || join(__dirname, 'data', 'solomiya-tilda-pages.draft.json');
const PROJECT_SLUG = process.env.PUBLIC_DEFAULT_PROJECT_SLUG || 'solomiya-energy';

// ── --help / -h : print usage and exit. Never connects to a DB. ──
if (has('--help') || has('-h')) {
  console.log(`import-solomiya-tilda-pages.mjs — import Solomiya/Tilda pages into SitePilot.

DEFAULT: dry-run. Validates + prints a plan. Writes NOTHING and does NOT connect to any DB.

Usage:
  node scripts/import-solomiya-tilda-pages.mjs [flags]

Flags:
  (none) | --dry-run     Structural validation + plan. No DB connection. (default)
  --check-existing       Dry-run + READ-ONLY lookup of existing paths (needs DATABASE_URL).
                         Still writes nothing.
  --apply --confirm-apply  Insert MISSING pages as status='draft' (never published).
                         BOTH flags required; --apply alone aborts before any DB connection.
                         Needs DATABASE_URL.
  --include-homepage     Allow creating/touching '/' (skipped by default).
  --update-existing      With --apply, update pages whose path already exists
                         (default: skip existing, never overwrite).
  --file=<path>          Override the draft JSON path.
  --help, -h             Show this help and exit (no DB).

Safety: default is dry-run; --apply requires --confirm-apply; homepage is guarded;
existing paths are not overwritten without --update-existing; all pages are draft;
nothing is ever published; no DNS/env/Cloudflare/Tilda/deploy actions.`);
  process.exit(0);
}

// ── known block types (must match marketing-web BlockRenderer.tsx switch) ──
const SUPPORTED = new Set([
  'hero','pain','steps','numbers','audience','guarantees','offers','trust','trust_badges',
  'testimonials','cases','customer_cases','links','city_links','cta','roi_calculator',
  'calculator','roi','lead_form','form','contact','faq','custom',
]);
const NEWLY_SUPPORTED = new Set(['contact_info','seo_text']); // added on this branch
const isRenderable = (t) => SUPPORTED.has(t) || NEWLY_SUPPORTED.has(t);

// page_type enum (backend page.entity.ts: page/landing/service/category/article)
const PAGE_TYPE_MAP = {
  homepage:'page', category_hub:'category', subcategory_page:'category',
  power_page:'landing', segment_landing:'landing', vendor_page:'landing',
  product_page:'landing', service_landing:'service', portfolio:'page', contact:'page',
};
const slugFromPath = (p) => (p === '/' ? 'home' : p.replace(/^\//, '').replace(/\//g, '-'));

function loadDrafts() {
  const raw = readFileSync(FILE, 'utf-8');
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) throw new Error('Draft file is not a JSON array');
  return arr;
}

// ── structural validation (no DB) ──
function validate(pages) {
  const errors = [], warnings = [], seen = new Map();
  for (const p of pages) {
    const id = p.path ?? '(no path)';
    if (!p.path || !p.path.startsWith('/')) errors.push(`${id}: invalid/absent path`);
    if (p.status !== 'draft') errors.push(`${id}: status must be "draft" (got ${p.status})`);
    if (!p.title) errors.push(`${id}: missing title`);
    if (!p.metaDescription) warnings.push(`${id}: empty metaDescription`);
    if (!PAGE_TYPE_MAP[p.pageType]) warnings.push(`${id}: unknown pageType "${p.pageType}" → will map to 'page'`);
    const blocks = p?.content?.blocks;
    if (!Array.isArray(blocks) || blocks.length === 0) errors.push(`${id}: no content.blocks`);
    else {
      for (const b of blocks) {
        if (!b.type) errors.push(`${id}: block without type`);
        else if (!isRenderable(b.type)) errors.push(`${id}: UNSUPPORTED block type "${b.type}"`);
      }
    }
    if (seen.has(p.path)) errors.push(`${id}: DUPLICATE path in file (also at index ${seen.get(p.path)})`);
    else seen.set(p.path, true);
  }
  return { errors, warnings };
}

// ── optional READ-ONLY existing-path lookup ──
async function readEnvDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  // minimal .env reader (no dotenv dep) — read-only
  for (const f of ['.env.local', '.env']) {
    try {
      const txt = readFileSync(join(__dirname, '..', f), 'utf-8');
      const m = txt.match(/^DATABASE_URL\s*=\s*(.+)$/m);
      if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    } catch { /* ignore */ }
  }
  return null;
}

async function fetchExisting() {
  const url = await readEnvDatabaseUrl();
  if (!url) throw new Error('DATABASE_URL not set (needed for --check-existing/--apply)');
  const { default: pg } = await import('pg'); // dynamic — only when DB is needed
  const ssl = !/localhost|127\.0\.0\.1/.test(url) ? { rejectUnauthorized: false } : false;
  const client = new pg.Client({ connectionString: url, ssl });
  await client.connect();
  const proj = await client.query(
    'SELECT id, name FROM projects WHERE slug=$1 AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1',
    [PROJECT_SLUG]);
  if (proj.rowCount === 0) { await client.end(); throw new Error(`Project "${PROJECT_SLUG}" not found`); }
  const projectId = proj.rows[0].id;
  const rows = await client.query(
    'SELECT path FROM pages WHERE project_id=$1 AND deleted_at IS NULL', [projectId]);
  const existing = new Set(rows.rows.map((r) => r.path));
  return { client, projectId, projectName: proj.rows[0].name, existing };
}

// ── plan classification ──
function classify(pages, existing) {
  const create = [], skipExisting = [], skipHomepage = [];
  for (const p of pages) {
    if (p.path === '/' && !INCLUDE_HOMEPAGE) { skipHomepage.push(p); continue; }
    if (existing && existing.has(p.path)) { skipExisting.push(p); continue; }
    create.push(p);
  }
  return { create, skipExisting, skipHomepage };
}

function printPlan(title, pages, projectName) {
  console.log(`\n=== ${title} ${projectName ? `(project: ${projectName})` : '(no DB — structural only)'} ===`);
  const f = (p) => `  ${String(p.migrationQuality||'?').padEnd(6)} ${p.pageType.padEnd(16)} ${p.path}`;
  return pages.map(f);
}

// ── apply (guarded) ──
async function apply(ctx, create) {
  const { client, projectId } = ctx;
  let created = 0, updated = 0;
  for (const p of create) {
    const pageType = PAGE_TYPE_MAP[p.pageType] || 'page';
    const isHome = p.path === '/';
    const content = JSON.stringify(p.content);
    const existing = await client.query(
      'SELECT id FROM pages WHERE project_id=$1 AND path=$2 AND deleted_at IS NULL', [projectId, p.path]);
    if (existing.rowCount > 0) {
      if (!UPDATE_EXISTING) continue;
      await client.query(
        `UPDATE pages SET content=$1, title=$2, meta_title=$3, meta_description=$4,
           page_type=$5, status='draft', robots_index=true, robots_follow=true, updated_at=now()
         WHERE id=$6`,
        [content, p.title, p.metaTitle || p.title, p.metaDescription, pageType, existing.rows[0].id]);
      updated++;
    } else {
      await client.query(
        `INSERT INTO pages
           (project_id, name, title, slug, path, page_type, status, is_homepage,
            content, meta_title, meta_description, robots_index, robots_follow, published_at)
         VALUES ($1,$2,$3,$4,$5,$6,'draft',$7,$8,$9,$10,true,true, NULL)`, // published_at NULL → NOT published
        [projectId, p.metaTitle || p.title, p.title, slugFromPath(p.path), p.path, pageType,
         isHome, content, p.metaTitle || p.title, p.metaDescription]);
      created++;
    }
  }
  return { created, updated };
}

// ── main ──
async function main() {
  console.log('SitePilot ← Solomiya Tilda draft import');
  console.log(`file: ${FILE}`);
  console.log(`mode: ${APPLY ? 'APPLY' : CHECK_EXISTING ? 'DRY-RUN + check-existing' : 'DRY-RUN (default)'}`);

  let pages = loadDrafts();
  console.log(`loaded: ${pages.length} pages`);

  // ── --only path allowlist: hard scope guard applied BEFORE anything else ──
  if (ONLY_SET) {
    const inFile = new Set(pages.map((p) => p.path));
    const missing = [...ONLY_SET].filter((p) => !inFile.has(p));
    if (missing.length) {
      console.log(`\n✗ --only includes path(s) not present in the draft file — refusing to proceed:`);
      missing.forEach((m) => console.log('  - ' + m));
      process.exit(1);
    }
    pages = pages.filter((p) => ONLY_SET.has(p.path));
    console.log(`scope: --only restricts run to ${pages.length} page(s): ${[...ONLY_SET].join(', ')}`);
  }

  const { errors, warnings } = validate(pages);
  if (warnings.length) { console.log(`\n⚠ warnings (${warnings.length}):`); warnings.forEach((w) => console.log('  - ' + w)); }
  if (errors.length) {
    console.log(`\n✗ ERRORS (${errors.length}) — refusing to proceed:`);
    errors.forEach((e) => console.log('  - ' + e));
    process.exit(1);
  }
  console.log('\n✓ structural validation passed (paths, status=draft, block types renderable)');

  // Guard BEFORE any DB connection: --apply must be paired with --confirm-apply.
  if (APPLY && !CONFIRM) {
    console.log('\n✗ --apply requires explicit --confirm-apply. Aborting (no DB touched, nothing written).');
    process.exit(2);
  }

  let ctx = null, existing = null, projectName = null;
  if (CHECK_EXISTING || APPLY) {
    ctx = await fetchExisting();
    existing = ctx.existing; projectName = ctx.projectName;
    console.log(`\nDB read-only: project "${projectName}" has ${existing.size} existing page(s).`);
  }

  const plan = classify(pages, existing);
  // Existing in-scope pages are UPDATE candidates only when --update-existing is set;
  // otherwise they are skipped (never overwritten). New pages are CREATE candidates.
  const wouldUpdate = UPDATE_EXISTING ? plan.skipExisting : [];
  const wouldSkipExisting = UPDATE_EXISTING ? [] : plan.skipExisting;
  console.log(printPlan(`WOULD CREATE (${plan.create.length})`, plan.create, projectName).join('\n') || '  (none)');
  console.log(printPlan(`WOULD UPDATE — existing draft, --update-existing (${wouldUpdate.length})`, wouldUpdate, projectName).join('\n') || '  (none)');
  console.log(printPlan(`WOULD SKIP — already exists (${wouldSkipExisting.length})`, wouldSkipExisting, projectName).join('\n') || '  (none / DB not queried)');
  console.log(printPlan(`WOULD SKIP — homepage guard (${plan.skipHomepage.length})`, plan.skipHomepage, projectName).join('\n') || '  (none)');
  console.log(`\nplan summary → create:${plan.create.length} update:${wouldUpdate.length} delete:0 publish:0 (homepage-guard:${plan.skipHomepage.length}, skip-existing:${wouldSkipExisting.length})`);

  // quality rollup
  const byQ = pages.reduce((a, p) => ((a[p.migrationQuality] = (a[p.migrationQuality]||0)+1), a), {});
  const ownerVerify = pages.filter((p) => p.needsOwnerVerification).length;
  console.log(`\nquality: ${JSON.stringify(byQ)} | needsOwnerVerification: ${ownerVerify} | with-forms: ${pages.filter((p)=>p.leadForm?.present).length}`);

  if (!APPLY) {
    console.log('\nDRY-RUN complete. Nothing was written. Use --apply --confirm-apply to insert as draft.');
    if (ctx) await ctx.client.end();
    return;
  }

  // ── apply guard rails ──
  if (!CONFIRM) {
    console.log('\n✗ --apply requires explicit --confirm-apply. Aborting (nothing written).');
    if (ctx) await ctx.client.end();
    process.exit(2);
  }
  console.log('\n● APPLY mode: writing pages as status=draft (never published)…');
  // apply() re-checks existence per page and routes to UPDATE (only when --update-existing)
  // or INSERT. Pass new pages plus, when updating, the existing in-scope pages.
  const applySet = UPDATE_EXISTING ? [...plan.create, ...plan.skipExisting] : plan.create;
  const res = await apply(ctx, applySet);
  console.log(`✓ created ${res.created}, updated ${res.updated}, skipped-existing ${wouldSkipExisting.length}, homepage-guard ${plan.skipHomepage.length}`);
  console.log('NOTE: all pages are DRAFT. Nothing published, no DNS/env/deploy changes.');
  await ctx.client.end();
}

main().catch((err) => { console.error('✗ import failed:', err.message); process.exit(1); });
