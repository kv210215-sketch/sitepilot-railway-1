#!/usr/bin/env node
/**
 * Programmatic SEO: publish solar city landing pages for Solomiya Energy.
 *
 * Idempotent and additive. Each city becomes a published page at /solar-<slug>
 * with localized (truthful, non-fabricated) solar copy, the ROI calculator, an
 * FAQ, a standard lead form (source=form), and internal links to the other
 * cities + home. A "Сонячні станції по містах" links block is also added to the
 * homepage so the cities are internally linked and crawlable.
 *
 * Pages auto-appear in sitemap.xml and get breadcrumb JSON-LD via marketing-web.
 *
 *   node scripts/seed-solomiya-city-pages.mjs
 *
 * Reads DATABASE_URL from backend/.env(.local). Never deploys.
 */
import pg from 'pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });
config({ path: join(__dirname, '..', '.env.local'), override: true });

const PROJECT_SLUG = process.env.PUBLIC_DEFAULT_PROJECT_SLUG || 'solomiya-energy';

// nameIn = locative ("у Львові"); nameGen used in keywords/nominative contexts.
const CITIES = [
  { slug: 'lviv',            name: 'Львів',            nameIn: 'у Львові' },
  { slug: 'kyiv',            name: 'Київ',             nameIn: 'у Києві' },
  { slug: 'ternopil',        name: 'Тернопіль',        nameIn: 'у Тернополі' },
  { slug: 'ivano-frankivsk', name: 'Івано-Франківськ', nameIn: 'в Івано-Франківську' },
  { slug: 'lutsk',           name: 'Луцьк',            nameIn: 'у Луцьку' },
  { slug: 'rivne',           name: 'Рівне',            nameIn: 'у Рівному' },
  { slug: 'uzhhorod',        name: 'Ужгород',          nameIn: 'в Ужгороді' },
  { slug: 'khmelnytskyi',    name: 'Хмельницький',     nameIn: 'у Хмельницькому' },
];

const pagePath = (slug) => `/solar-${slug}`;

function cityLinksItems(currentSlug) {
  const items = CITIES
    .filter((c) => c.slug !== currentSlug)
    .map((c) => ({ label: c.name, href: pagePath(c.slug) }));
  items.unshift({ label: 'Головна', href: '/' });
  return items;
}

function buildCityContent(city) {
  const blocks = [
    {
      type: 'hero',
      data: {
        title: `Сонячні електростанції ${city.nameIn} під ключ`,
        subtitle: `Проєктування, монтаж та підключення СЕС для дому та бізнесу ${city.nameIn}. Економте на електроенергії та майте світло навіть під час відключень.`,
        cta: 'Безкоштовний розрахунок економії',
      },
    },
    {
      type: 'pain',
      data: {
        title: `Чому сонячна станція ${city.nameIn}`,
        items: [
          { problem: 'Високі рахунки за електроенергію', solution: 'Власна генерація знижує платіж за світло' },
          { problem: 'Відключення електроенергії', solution: 'Станція з акумулятором живить дім під час блекаутів' },
          { problem: 'Зростання тарифів', solution: 'Фіксуєте вартість енергії на десятиліття вперед' },
        ],
      },
    },
    {
      type: 'steps',
      data: {
        title: 'Як ми працюємо',
        items: [
          { title: 'Консультація і розрахунок', description: 'Безкоштовно визначаємо потужність, економію та окупність' },
          { title: 'Проєкт і підбір обладнання', description: 'Готуємо рішення під ваш об’єкт і бюджет' },
          { title: 'Монтаж під ключ', description: 'Встановлення, підключення та пусконалагодження' },
          { title: 'Сервіс і гарантія', description: 'Супровід та технічна підтримка після запуску' },
        ],
      },
    },
    { type: 'roi_calculator', data: { title: `Розрахуйте економію ${city.nameIn}` } },
    {
      type: 'faq',
      data: {
        items: [
          { question: `Скільки коштує сонячна станція ${city.nameIn}?`, answer: 'Вартість залежить від потужності та обладнання. Скористайтеся калькулятором вище для орієнтовного розрахунку — точну ціну підготуємо після консультації.' },
          { question: 'Чи працює станція під час відключень світла?', answer: 'Так, якщо станція укомплектована акумулятором — вона забезпечує живлення дому під час блекаутів.' },
          { question: 'Скільки часу займає монтаж?', answer: 'Типовий монтаж домашньої станції займає 1–3 дні після узгодження проєкту та постачання обладнання.' },
          { question: 'Яка окупність сонячної станції?', answer: 'Орієнтовну окупність показує калькулятор. Вона залежить від споживання, тарифу та потужності станції.' },
        ],
      },
    },
    {
      type: 'city_links',
      data: { title: 'Сонячні станції в інших містах', items: cityLinksItems(city.slug) },
    },
    {
      type: 'cta',
      data: {
        title: `Отримати розрахунок ${city.nameIn}`,
        text: 'Залиште контакти — підготуємо безкоштовний розрахунок економії та окупності.',
        source: 'form',
      },
    },
  ];
  blocks.forEach((b, i) => { b.order = i + 1; });
  return { blocks };
}

function cityMeta(city) {
  return {
    title: `Сонячні електростанції ${city.nameIn} під ключ | Solomiya Energy`,
    metaTitle: `Сонячні електростанції ${city.nameIn} — встановлення під ключ`,
    metaDescription: `Проєктування та монтаж сонячних електростанцій ${city.nameIn} для дому та бізнесу. Безкоштовний розрахунок економії та окупності. Гарантія та сервіс.`,
    seoKeywords: `сонячні панелі ${city.name}, сонячна електростанція ${city.name}, СЕС ${city.name}, монтаж сонячних панелей ${city.name}`,
  };
}

async function upsertCityPage(client, projectId, city) {
  const path = pagePath(city.slug);
  const slug = `solar-${city.slug}`;
  const content = buildCityContent(city);
  const meta = cityMeta(city);

  const existing = await client.query(
    'SELECT id FROM pages WHERE project_id = $1 AND path = $2 AND deleted_at IS NULL',
    [projectId, path],
  );

  if (existing.rowCount > 0) {
    await client.query(
      `UPDATE pages SET content = $1, title = $2, meta_title = $3, meta_description = $4,
         seo_keywords = $5, robots_index = true, robots_follow = true,
         status = 'published', page_type = 'landing',
         published_at = COALESCE(published_at, now()), updated_at = now()
       WHERE id = $6`,
      [JSON.stringify(content), meta.title, meta.metaTitle, meta.metaDescription, meta.seoKeywords, existing.rows[0].id],
    );
    return 'updated';
  }

  await client.query(
    `INSERT INTO pages
       (project_id, name, title, slug, path, page_type, status, is_homepage,
        content, meta_title, meta_description, seo_keywords,
        robots_index, robots_follow, published_at)
     VALUES ($1,$2,$3,$4,$5,'landing','published',false,$6,$7,$8,$9,true,true, now())`,
    [projectId, meta.metaTitle, meta.title, slug, path,
      JSON.stringify(content), meta.metaTitle, meta.metaDescription, meta.seoKeywords],
  );
  return 'created';
}

async function addCityLinksToHomepage(client, projectId) {
  const res = await client.query(
    `SELECT id, content FROM pages
     WHERE project_id = $1 AND is_homepage = true AND status = 'published' AND deleted_at IS NULL
     ORDER BY sort_order ASC LIMIT 1`,
    [projectId],
  );
  if (res.rowCount === 0) return 'no-homepage';

  const page = res.rows[0];
  const content = page.content && typeof page.content === 'object' ? page.content : { blocks: [] };
  const blocks = Array.isArray(content.blocks) ? content.blocks : [];

  // Homepage links out to the city pages.
  const cityItems = CITIES.map((c) => ({ label: c.name, href: pagePath(c.slug) }));

  let block = blocks.find((b) => b.type === 'city_links');
  let changed = false;
  if (!block) {
    const ctaIndex = blocks.findIndex((b) => b.type === 'cta');
    block = { type: 'city_links', data: { title: 'Сонячні станції по містах', items: cityItems } };
    blocks.splice(ctaIndex === -1 ? blocks.length : ctaIndex, 0, block);
    changed = true;
  } else {
    const next = JSON.stringify(cityItems);
    if (JSON.stringify(block.data?.items ?? []) !== next) {
      block.data = { title: 'Сонячні станції по містах', items: cityItems };
      changed = true;
    }
  }
  blocks.forEach((b, i) => { if (b.order !== i + 1) { b.order = i + 1; changed = true; } });

  if (changed) {
    content.blocks = blocks;
    await client.query('UPDATE pages SET content = $1, updated_at = now() WHERE id = $2',
      [JSON.stringify(content), page.id]);
  }
  return changed ? 'updated' : 'unchanged';
}

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
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

  const results = {};
  for (const city of CITIES) {
    results[city.slug] = await upsertCityPage(client, projectId, city);
  }
  const homepage = await addCityLinksToHomepage(client, projectId);

  console.log(`✓ City pages on "${proj.rows[0].name}":`);
  for (const city of CITIES) {
    console.log(`  ${results[city.slug].padEnd(8)} ${pagePath(city.slug)}  (${city.name})`);
  }
  console.log(`  homepage city_links: ${homepage}`);
  await client.end();
}

main().catch((err) => {
  console.error('✗ City seed failed:', err.message);
  process.exit(1);
});
