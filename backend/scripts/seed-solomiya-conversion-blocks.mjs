#!/usr/bin/env node
/**
 * Conversion content seed for the Solomiya Energy homepage.
 *
 * Idempotent and additive: inserts a solar ROI calculator block before the
 * closing CTA, and marks the CTA's lead form as source=form. Re-running makes
 * no further changes. Safe to run against staging.
 *
 *   node scripts/seed-solomiya-conversion-blocks.mjs
 *
 * Reads DATABASE_URL from backend/.env(.local). Never deploys; only updates the
 * page content row in the connected database.
 */
import pg from 'pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });
config({ path: join(__dirname, '..', '.env.local'), override: true });

const PROJECT_SLUG = process.env.PUBLIC_DEFAULT_PROJECT_SLUG || 'solomiya-energy';

const CALCULATOR_BLOCK = {
  type: 'roi_calculator',
  data: {
    title: 'Розрахуйте економію на сонячній станції',
  },
};

async function main() {
  const url = process.env.DATABASE_URL;
  const ssl = url && !/localhost|127\.0\.0\.1/.test(url) ? { rejectUnauthorized: false } : false;
  const client = new pg.Client({ connectionString: url, ssl });
  await client.connect();

  const proj = await client.query(
    'SELECT id, name FROM projects WHERE slug = $1 AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1',
    [PROJECT_SLUG],
  );
  if (proj.rowCount === 0) {
    console.error(`✗ Project "${PROJECT_SLUG}" not found.`);
    process.exit(1);
  }
  const projectId = proj.rows[0].id;

  const pageRes = await client.query(
    `SELECT id, path, content FROM pages
     WHERE project_id = $1 AND status = 'published' AND deleted_at IS NULL AND is_homepage = true
     ORDER BY sort_order ASC LIMIT 1`,
    [projectId],
  );
  if (pageRes.rowCount === 0) {
    console.error('✗ No published homepage found.');
    process.exit(1);
  }
  const page = pageRes.rows[0];
  const content = page.content && typeof page.content === 'object' ? page.content : { blocks: [] };
  const blocks = Array.isArray(content.blocks) ? content.blocks : [];

  let changed = false;

  // 1) Mark the closing CTA's lead form as the standard "form" source.
  const ctaBlock = blocks.find((b) => b.type === 'cta');
  if (ctaBlock) {
    ctaBlock.data = ctaBlock.data || {};
    if (ctaBlock.data.source !== 'form') {
      ctaBlock.data.source = 'form';
      changed = true;
    }
  }

  // 2) Insert the ROI calculator block before the CTA (or at the end), once.
  const hasCalculator = blocks.some((b) =>
    ['roi_calculator', 'calculator', 'roi'].includes(b.type),
  );
  if (!hasCalculator) {
    const ctaIndex = blocks.findIndex((b) => b.type === 'cta');
    const insertAt = ctaIndex === -1 ? blocks.length : ctaIndex;
    blocks.splice(insertAt, 0, { ...CALCULATOR_BLOCK });
    changed = true;
  }

  // 3) Renumber order sequentially so the renderer sorts predictably.
  blocks.forEach((b, i) => {
    if (b.order !== i + 1) {
      b.order = i + 1;
      changed = true;
    }
  });

  if (!changed) {
    console.log('✓ Already seeded — no changes needed.');
    console.log('  Blocks:', blocks.map((b) => b.type).join(' → '));
    await client.end();
    return;
  }

  content.blocks = blocks;
  await client.query(
    'UPDATE pages SET content = $1, updated_at = now() WHERE id = $2',
    [JSON.stringify(content), page.id],
  );

  console.log(`✓ Updated ${page.path} on "${proj.rows[0].name}".`);
  console.log('  Blocks:', blocks.map((b) => `${b.order}:${b.type}`).join(' → '));
  await client.end();
}

main().catch((err) => {
  console.error('✗ Seed failed:', err.message);
  process.exit(1);
});
