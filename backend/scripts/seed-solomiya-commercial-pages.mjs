#!/usr/bin/env node
/**
 * Programmatic SEO: commercial solar landing pages for Solomiya Energy.
 *
 * Idempotent and additive. Publishes a page per commercial segment at
 * /solar-<slug> with segment-tailored (truthful, non-fabricated) copy, the ROI
 * calculator defaulted to "business", an FAQ, a standard lead form (source=form)
 * and internal links to the other segments + home. Also adds a "Рішення для
 * бізнесу" links block to the homepage. Reuses the same rendering + SEO pipeline
 * as the city pages (sitemap + breadcrumb JSON-LD are automatic).
 *
 *   node scripts/seed-solomiya-commercial-pages.mjs
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

const SEGMENTS = [
  {
    slug: 'warehouses', nav: 'Склади',
    h1: 'Сонячні станції для складів',
    intro: 'Великі дахи складів — ідеальна площа для сонячної станції. Денне споживання збігається з піком генерації, що максимізує економію.',
    keywords: 'сонячна станція для складу, СЕС для складу, сонячні панелі склад',
    benefits: [
      ['Високі рахунки за освітлення та обладнання', 'Власна генерація вдень покриває основне споживання'],
      ['Простоюючий дах', 'Перетворюємо площу даху на джерело прибутку'],
      ['Зростання тарифів на електроенергію', 'Фіксуєте вартість енергії на роки вперед'],
    ],
    faq: [
      ['Чи витримає дах складу сонячні панелі?', 'Перед монтажем проводимо оцінку несучої здатності даху та підбираємо відповідну систему кріплення.'],
      ['Яка окупність станції для складу?', 'Завдяки збігу денного споживання з генерацією окупність комерційних станцій зазвичай коротша за домашні. Точний розрахунок — у калькуляторі вище.'],
    ],
  },
  {
    slug: 'factories', nav: 'Виробництва',
    h1: 'Сонячні станції для виробництв та заводів',
    intro: 'Виробництва з високим денним споживанням отримують максимальний ефект від власної генерації — менші рахунки та стабільна вартість енергії.',
    keywords: 'сонячна станція для заводу, СЕС для виробництва, промислова сонячна електростанція',
    benefits: [
      ['Велике споживання електроенергії', 'Сонячна станція суттєво знижує операційні витрати'],
      ['Залежність від тарифів мережі', 'Власна генерація зменшує залежність і ризики'],
      ['Перебої в електропостачанні', 'Гібридні рішення підтримують критичні процеси'],
    ],
    faq: [
      ['Яку потужність станції обрати для виробництва?', 'Потужність підбираємо під ваш профіль споживання після аудиту. Орієнтовний розрахунок дає калькулятор.'],
      ['Чи можна масштабувати станцію згодом?', 'Так, систему можна спроєктувати з можливістю розширення під майбутні потреби.'],
    ],
  },
  {
    slug: 'logistics', nav: 'Логістика',
    h1: 'Сонячні станції для логістичних центрів',
    intro: 'Логістичні центри з холодильним обладнанням, зарядкою техніки та великими дахами — чудові кандидати для сонячної генерації.',
    keywords: 'сонячна станція для логістичного центру, СЕС логістика, сонячні панелі логістичний центр',
    benefits: [
      ['Енергоємне холодильне обладнання', 'Сонячна генерація вдень покриває пікове споживання'],
      ['Зарядка електротехніки та навантажувачів', 'Живлення від власної станції здешевлює зарядку'],
      ['Велика площа даху без застосування', 'Перетворюємо дах на актив, що економить кошти'],
    ],
    faq: [
      ['Чи підходить станція для холодильних складів?', 'Так — денний пік споживання холодильних систем добре збігається з генерацією сонячної станції.'],
      ['Скільки часу займає монтаж?', 'Залежить від потужності; терміни узгоджуємо після проєктування та оцінки об’єкта.'],
    ],
  },
  {
    slug: 'hotels', nav: 'Готелі',
    h1: 'Сонячні станції для готелів',
    intro: 'Готелі мають стабільне споживання на гаряче водопостачання, кондиціювання та освітлення — сонячна станція знижує витрати та підвищує енергонезалежність.',
    keywords: 'сонячна станція для готелю, СЕС готель, сонячні панелі готель',
    benefits: [
      ['Високі рахунки за гарячу воду та кондиціювання', 'Власна генерація знижує енерговитрати'],
      ['Відключення електроенергії', 'Гібридна станція забезпечує комфорт гостей під час блекаутів'],
      ['Запит на еко-стандарти', 'Зелена енергія підсилює імідж закладу'],
    ],
    faq: [
      ['Чи працюватиме готель під час відключень?', 'З акумуляторним блоком станція підтримує освітлення та критичні системи під час блекаутів.'],
      ['Чи помітні панелі на фасаді?', 'Розміщення проєктуємо так, щоб зберегти зовнішній вигляд закладу.'],
    ],
  },
  {
    slug: 'gas-stations', nav: 'АЗС',
    h1: 'Сонячні станції для АЗС',
    intro: 'АЗС працюють цілодобово та потребують надійного живлення для насосів, освітлення та магазину. Сонячна станція з резервом знижує витрати й підвищує безперебійність.',
    keywords: 'сонячна станція для АЗС, СЕС АЗС, сонячні панелі заправка',
    benefits: [
      ['Цілодобове споживання', 'Сонячна генерація вдень покриває значну частину витрат'],
      ['Ризик зупинки під час відключень', 'Гібридна станція живить насоси та касу'],
      ['Навіси та дахи без застосування', 'Розміщуємо панелі на навісах і дахах АЗС'],
    ],
    faq: [
      ['Чи живитиме станція паливні насоси під час блекауту?', 'З відповідним акумуляторним блоком станція підтримує роботу критичного обладнання.'],
      ['Де розміщують панелі на АЗС?', 'Зазвичай на навісах над колонками та даху магазину — без втрати функціональності.'],
    ],
  },
  {
    slug: 'agriculture', nav: 'Агро',
    h1: 'Сонячні станції для агробізнесу',
    intro: 'Зрошення, сушіння зерна, тваринницькі комплекси та віддалені об’єкти — агробізнес отримує від сонячної станції економію та енергонезалежність.',
    keywords: 'сонячна станція для агро, СЕС для ферми, сонячні панелі сільське господарство',
    benefits: [
      ['Енергоємне зрошення та сушіння', 'Сонячна генерація здешевлює сезонні роботи'],
      ['Віддалені об’єкти без стабільної мережі', 'Автономні рішення живлять об’єкти поза мережею'],
      ['Вільні землі та дахи', 'Наземні та дахові станції під ваші площі'],
    ],
    faq: [
      ['Чи можна встановити наземну станцію на полі?', 'Так, для агрооб’єктів часто оптимальні наземні станції на невикористовуваних ділянках.'],
      ['Чи підходить станція для зрошення?', 'Так — денна генерація добре збігається з режимом роботи насосів зрошення.'],
    ],
  },
];

const pagePath = (slug) => `/solar-${slug}`;

function segmentLinks(currentSlug) {
  const items = SEGMENTS
    .filter((s) => s.slug !== currentSlug)
    .map((s) => ({ label: s.nav, href: pagePath(s.slug) }));
  items.unshift({ label: 'Головна', href: '/' });
  return items;
}

function buildContent(seg) {
  const blocks = [
    { type: 'hero', data: { title: seg.h1, subtitle: seg.intro, cta: 'Безкоштовний розрахунок для бізнесу' } },
    { type: 'pain', data: { title: 'Чому сонячна станція для вашого бізнесу', items: seg.benefits.map(([problem, solution]) => ({ problem, solution })) } },
    {
      type: 'steps',
      data: {
        title: 'Як ми працюємо',
        items: [
          { title: 'Енергоаудит і розрахунок', description: 'Аналізуємо споживання та рахуємо економію й окупність' },
          { title: 'Проєкт і підбір обладнання', description: 'Готуємо рішення під ваш об’єкт і навантаження' },
          { title: 'Монтаж під ключ', description: 'Встановлення, підключення та пусконалагодження' },
          { title: 'Сервіс і моніторинг', description: 'Технічна підтримка та контроль роботи станції' },
        ],
      },
    },
    { type: 'roi_calculator', data: { title: 'Розрахуйте економію для бізнесу', businessType: 'business' } },
    { type: 'faq', data: { items: seg.faq.map(([question, answer]) => ({ question, answer })) } },
    { type: 'links', data: { title: 'Інші рішення для бізнесу', items: segmentLinks(seg.slug) } },
    { type: 'cta', data: { title: 'Отримати розрахунок для бізнесу', text: 'Залиште контакти — підготуємо безкоштовний розрахунок під ваш об’єкт.', source: 'form' } },
  ];
  blocks.forEach((b, i) => { b.order = i + 1; });
  return { blocks };
}

function meta(seg) {
  return {
    title: `${seg.h1} під ключ | Solomiya Energy`,
    metaTitle: `${seg.h1} — проєктування та монтаж`,
    metaDescription: `${seg.intro} Безкоштовний розрахунок економії та окупності.`.slice(0, 320),
    seoKeywords: seg.keywords,
  };
}

async function upsert(client, projectId, seg) {
  const path = pagePath(seg.slug);
  const slug = `solar-${seg.slug}`;
  const content = buildContent(seg);
  const m = meta(seg);

  const existing = await client.query(
    'SELECT id FROM pages WHERE project_id = $1 AND path = $2 AND deleted_at IS NULL',
    [projectId, path],
  );
  if (existing.rowCount > 0) {
    await client.query(
      `UPDATE pages SET content=$1, title=$2, meta_title=$3, meta_description=$4, seo_keywords=$5,
         robots_index=true, robots_follow=true, status='published', page_type='landing',
         published_at=COALESCE(published_at, now()), updated_at=now()
       WHERE id=$6`,
      [JSON.stringify(content), m.title, m.metaTitle, m.metaDescription, m.seoKeywords, existing.rows[0].id],
    );
    return 'updated';
  }
  await client.query(
    `INSERT INTO pages
       (project_id, name, title, slug, path, page_type, status, is_homepage,
        content, meta_title, meta_description, seo_keywords, robots_index, robots_follow, published_at)
     VALUES ($1,$2,$3,$4,$5,'landing','published',false,$6,$7,$8,$9,true,true, now())`,
    [projectId, m.metaTitle, m.title, slug, path, JSON.stringify(content), m.metaTitle, m.metaDescription, m.seoKeywords],
  );
  return 'created';
}

async function addCommercialLinksToHomepage(client, projectId) {
  const res = await client.query(
    `SELECT id, content FROM pages
     WHERE project_id=$1 AND is_homepage=true AND status='published' AND deleted_at IS NULL
     ORDER BY sort_order ASC LIMIT 1`, [projectId],
  );
  if (res.rowCount === 0) return 'no-homepage';
  const page = res.rows[0];
  const content = page.content && typeof page.content === 'object' ? page.content : { blocks: [] };
  const blocks = Array.isArray(content.blocks) ? content.blocks : [];
  const items = SEGMENTS.map((s) => ({ label: s.nav, href: pagePath(s.slug) }));

  // Identify the commercial links block by its title (city links use a different one).
  const TITLE = 'Рішення для бізнесу';
  let block = blocks.find((b) => b.type === 'links' && b.data?.title === TITLE);
  let changed = false;
  if (!block) {
    const ctaIndex = blocks.findIndex((b) => b.type === 'cta');
    block = { type: 'links', data: { title: TITLE, items } };
    blocks.splice(ctaIndex === -1 ? blocks.length : ctaIndex, 0, block);
    changed = true;
  } else if (JSON.stringify(block.data.items) !== JSON.stringify(items)) {
    block.data.items = items;
    changed = true;
  }
  blocks.forEach((b, i) => { if (b.order !== i + 1) { b.order = i + 1; changed = true; } });
  if (changed) {
    content.blocks = blocks;
    await client.query('UPDATE pages SET content=$1, updated_at=now() WHERE id=$2', [JSON.stringify(content), page.id]);
  }
  return changed ? 'updated' : 'unchanged';
}

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
  await client.connect();

  const proj = await client.query(
    'SELECT id, name FROM projects WHERE slug=$1 AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1',
    [PROJECT_SLUG],
  );
  if (proj.rowCount === 0) { console.error(`✗ Project "${PROJECT_SLUG}" not found.`); process.exit(1); }
  const projectId = proj.rows[0].id;

  const results = {};
  for (const seg of SEGMENTS) results[seg.slug] = await upsert(client, projectId, seg);
  const homepage = await addCommercialLinksToHomepage(client, projectId);

  console.log(`✓ Commercial pages on "${proj.rows[0].name}":`);
  for (const seg of SEGMENTS) console.log(`  ${results[seg.slug].padEnd(8)} ${pagePath(seg.slug)}  (${seg.nav})`);
  console.log(`  homepage commercial links: ${homepage}`);
  await client.end();
}

main().catch((err) => { console.error('✗ Commercial seed failed:', err.message); process.exit(1); });
