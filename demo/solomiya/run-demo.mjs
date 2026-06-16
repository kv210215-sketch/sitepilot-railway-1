// Solomiya Energy — SitePilot staging customer demo driver.
// Drives the REAL deployed staging backend end-to-end via its public/JWT APIs.
// No new services, no product changes. Artifacts written to ./artifacts.

import { writeFileSync, mkdirSync } from 'node:fs';

const API = 'https://sitepilot-railway-staging.up.railway.app';
const ART = new URL('./artifacts/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
mkdirSync(ART, { recursive: true });

// Credentials are NOT hard-coded. Provide via env (see demo/solomiya/.env.example),
// sourced from Railway or a secure note.
const CREDS = {
  email: process.env.DEMO_EMAIL,
  password: process.env.DEMO_PASSWORD,
  name: process.env.DEMO_NAME ?? 'Solomiya Energy Demo',
};
if (!CREDS.email || !CREDS.password) {
  console.error('Missing DEMO_EMAIL / DEMO_PASSWORD env vars — see demo/solomiya/.env.example');
  process.exit(1);
}

const log = (...a) => console.log(...a);
let TOKEN = null;

async function api(method, path, body, { auth = true, raw = false } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (auth && TOKEN) headers.authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (raw) return { status: res.status, json };
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${typeof json === 'string' ? json : JSON.stringify(json)}`);
  }
  return json;
}

// ---- Ukrainian landing-page content ----
// NOTE: the DEPLOYED staging renderer (commit d4f5776) handles only these block
// types: hero, numbers, pain, steps, guarantees, cta. The block types audience/
// offers/faq render as empty sections on the live preview, so we keep the page to
// the 6 supported types for a clean, polished rendered page. The public JSON API
// returns whatever blocks we store regardless.
const BLOCKS = [
  { type: 'hero', order: 0, data: {
    title: 'Сонячні електростанції для бізнесу у Львові',
    subtitle: 'Комерційні СЕС «під ключ» для виробництв, складів, торгових центрів та фермерських господарств. Знижуйте рахунки за електроенергію до 70% і захистіть бізнес від відключень.',
    cta: 'Отримати безкоштовний розрахунок',
    subtext: 'Проєктування • Монтаж • Гарантія 25 років • Зелений тариф для бізнесу',
  }},
  { type: 'numbers', order: 1, data: { items: [
    { value: 'до 70%', label: 'економія на електроенергії' },
    { value: '2–4 роки', label: 'окупність інвестиції' },
    { value: '25 років', label: 'гарантія на панелі' },
    { value: '120+', label: 'реалізованих проєктів' },
  ]}},
  { type: 'pain', order: 2, data: {
    title: 'Проблеми бізнесу — і як ми їх вирішуємо',
    items: [
      { problem: 'Рахунки за електроенергію щороку зростають', solution: 'Фіксована вартість власної генерації на 25 років' },
      { problem: 'Планові та аварійні відключення зупиняють виробництво', solution: 'Гібридні системи з акумуляторами працюють автономно' },
      { problem: 'Великі капітальні витрати лякають власника', solution: 'Розрахунок ROI, лізинг та фінансування від партнерів' },
      { problem: 'Незрозуміло, з чого почати та як оформити документи', solution: 'Безкоштовний аудит, проєкт «під ключ» і супровід зеленого тарифу' },
    ],
  }},
  { type: 'steps', order: 3, data: {
    title: 'Як ми працюємо',
    items: [
      { title: 'Аудит об’єкта', description: 'Виїзд інженера, аналіз споживання та даху/території, технічне завдання — безкоштовно.' },
      { title: 'Проєкт і розрахунок', description: 'Підбір потужності, фінансова модель, строк окупності та зелений тариф.' },
      { title: 'Монтаж', description: 'Постачання обладнання Tier-1, монтаж сертифікованою бригадою за 2–6 тижнів.' },
      { title: 'Запуск і сервіс', description: 'Підключення, документи, моніторинг 24/7 та сервісне обслуговування.' },
    ],
  }},
  { type: 'guarantees', order: 4, data: { items: [
    'Гарантія 25 років на сонячні панелі та 10 років на інвертори',
    'Обладнання Tier-1: JA Solar, Huawei, Deye',
    'Офіційний договір, акти та повний пакет документів для зеленого тарифу',
    'Власна сервісна служба у Львові — реагування протягом 24 годин',
    'Безкоштовний аудит об’єкта та комерційна пропозиція з трьома варіантами бюджету',
  ]}},
  { type: 'cta', order: 5, data: {
    title: 'Готові рахувати економію вашого бізнесу?',
    text: 'Залиште заявку — інженер Solomiya Energy зв’яжеться з вами та підготує безкоштовний розрахунок окупності для вашого об’єкта у Львові за 2 дні.',
    button: 'Замовити безкоштовний аудит',
    subtext: 'Solomiya Energy • Львів • +380 (32) 000-00-00',
  }},
];

const SEO = {
  metaTitle: 'Сонячні електростанції для бізнесу у Львові | Solomiya Energy',
  metaDescription: 'Комерційні сонячні електростанції «під ключ» у Львові та області. Економія до 70% на електроенергії, окупність 2–4 роки, гарантія 25 років. Безкоштовний аудит.',
  seoTitle: 'Сонячні електростанції для бізнесу у Львові | Solomiya Energy',
  seoDescription: 'Комерційні СЕС «під ключ» у Львові: економія до 70%, окупність 2–4 роки, зелений тариф. Безкоштовний аудит об’єкта.',
  ogTitle: 'Сонячні електростанції для бізнесу у Львові — Solomiya Energy',
  ogDescription: 'Знижуйте рахунки за електроенергію до 70% та захистіть бізнес від відключень з комерційними СЕС від Solomiya Energy.',
  seoKeywords: 'сонячні електростанції Львів, СЕС для бізнесу, комерційна сонячна станція, зелений тариф, сонячні панелі Львів',
  robotsIndex: true,
  robotsFollow: true,
};

const out = { api: API, account: { source: 'env DEMO_EMAIL/DEMO_PASSWORD (see .env.example) — not stored' }, steps: {} };

async function main() {
  // 1) Auth: try register, fall back to login.
  log('== 1. Auth ==');
  let auth = await api('POST', '/api/v1/auth/register', CREDS, { auth: false, raw: true });
  if (auth.status >= 400) {
    log('  register ->', auth.status, '(likely exists) — logging in');
    auth = await api('POST', '/api/v1/auth/login', { email: CREDS.email, password: CREDS.password }, { auth: false, raw: true });
  }
  if (!auth.json?.tokens?.accessToken) throw new Error('auth failed: ' + JSON.stringify(auth.json));
  TOKEN = auth.json.tokens.accessToken;
  out.steps.auth = { status: auth.status, userId: auth.json.user?.id };
  log('  user:', auth.json.user?.email, auth.json.user?.id);

  // 2) Organization (reuse if present)
  log('== 2. Organization ==');
  let orgs = await api('GET', '/api/v1/organizations');
  let org = (Array.isArray(orgs) ? orgs : orgs?.data ?? []).find(o => o.slug === 'solomiya-energy') ?? (Array.isArray(orgs) ? orgs : orgs?.data ?? [])[0];
  if (!org) {
    org = await api('POST', '/api/v1/organizations', { name: 'Solomiya Energy', slug: 'solomiya-energy', description: 'Комерційні сонячні рішення для бізнесу' });
  }
  out.steps.org = { id: org.id, name: org.name, slug: org.slug };
  log('  org:', org.name, org.id);

  // 3) Project (reuse by slug)
  log('== 3. Project ==');
  let projects = await api('GET', '/api/v1/projects');
  let project = (Array.isArray(projects) ? projects : projects?.data ?? []).find(p => p.slug === 'solomiya-energy');
  if (!project) {
    project = await api('POST', '/api/v1/projects', {
      name: 'Solomiya Energy Commercial Solar',
      organizationId: org.id,
      slug: 'solomiya-energy',
      domain: 'solomiya-energy.com',
      projectType: 'solar_commercial',
      description: 'Комерційні сонячні електростанції «під ключ» для бізнесу у Львові та області.',
    });
  }
  // ensure active for public lookup
  try { await api('PATCH', `/api/v1/projects/${project.id}`, { status: 'active', isActive: true }); } catch (e) { log('  (patch project active skipped:', e.message, ')'); }
  out.steps.project = { id: project.id, name: project.name, slug: project.slug, domain: project.domain };
  log('  project:', project.name, project.id);

  // 3b) Probe AI generator (documents capability; plan-gated)
  log('== 3b. AI generator probe ==');
  const ai = await api('POST', '/api/v1/ai/generate-site', { type: 'business', budget: 'large', goal: 'leads', city: 'Львів', powerKw: 100, companyName: 'Solomiya Energy' }, { raw: true });
  out.steps.aiProbe = { status: ai.status, note: ai.status >= 400 ? 'plan-gated/unavailable — content authored manually' : 'available', sample: ai.status < 400 ? ai.json?.projectName : (ai.json?.message ?? ai.json) };
  log('  ai generate-site ->', ai.status);

  // 4) Page (reuse by slug)
  log('== 4. Landing page ==');
  const PAGE = {
    projectId: project.id,
    title: 'Сонячні електростанції для бізнесу у Львові',
    slug: 'ses-dlya-biznesu-lviv',
    path: '/ses-dlya-biznesu-lviv',
    pageType: 'landing',
    name: 'Landing — Commercial Solar Lviv',
  };
  let pages = await api('GET', `/api/v1/projects/${project.id}/pages`);
  let page = (Array.isArray(pages) ? pages : pages?.data ?? []).find(p => p.slug === PAGE.slug);
  if (!page) {
    page = await api('POST', `/api/v1/projects/${project.id}/pages`, PAGE);
  }
  log('  page:', page.title, page.id);

  // 5) Content + SEO (PATCH)
  log('== 5. Ukrainian content + SEO ==');
  page = await api('PATCH', `/api/v1/projects/${project.id}/pages/${page.id}`, {
    title: PAGE.title,
    h1: PAGE.title,
    pageType: 'landing',
    content: { blocks: BLOCKS },
    seo: SEO,
    status: 'ready',
  });
  out.steps.page = { id: page.id, title: page.title, slug: page.slug, path: page.path, blocks: BLOCKS.length, status: page.status };
  log('  content set:', BLOCKS.length, 'blocks; status:', page.status);

  // 6) Publish via real publish flow
  log('== 6. Publish ==');
  const job = await api('POST', `/api/v1/projects/${project.id}/publish`, { scope: 'project', priority: 8 });
  log('  job:', job.id, job.status);
  let final = job;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1500));
    final = await api('GET', `/api/v1/projects/${project.id}/publish/${job.id}`);
    if (['success', 'failed', 'cancelled'].includes(final.status)) break;
  }
  out.steps.publish = { jobId: final.id, status: final.status, pagesTotal: final.pagesTotal, pagesSuccess: final.pagesSuccess, pagesFailed: final.pagesFailed, durationMs: final.durationMs };
  log('  publish ->', final.status, `(${final.pagesSuccess}/${final.pagesTotal})`);

  // 7) Verify public JSON API
  log('== 7. Public URL verification ==');
  const publicUrl = `${API}/public/v1/pages${PAGE.path}`;
  const pub = await api('GET', `/public/v1/pages${PAGE.path}`, null, { auth: false, raw: true });
  out.steps.publicApi = { url: publicUrl, status: pub.status, title: pub.json?.title, path: pub.json?.path, blocks: pub.json?.blocks?.length, canonicalUrl: pub.json?.canonicalUrl };
  log('  public JSON ->', pub.status, pub.json?.title);
  // Hard-fail if the public URL used in the meeting is not actually live, so the
  // package never reports success with a broken/missing public page.
  if (pub.status !== 200) {
    throw new Error(`Public page verification failed: GET ${publicUrl} -> ${pub.status} ${typeof pub.json === 'string' ? pub.json : JSON.stringify(pub.json)}`);
  }

  // sitemap entries
  const sm = await api('GET', '/public/v1/sitemap-entries', null, { auth: false, raw: true });
  out.steps.sitemap = { status: sm.status, count: Array.isArray(sm.json) ? sm.json.length : 0, entries: sm.json };

  // 8) Rendered HTML preview (authed)
  const prev = await api('GET', `/api/v1/projects/${project.id}/pages/${page.id}/preview`, null, { raw: true });
  if (prev.status < 400 && prev.json?.html) {
    writeFileSync(`${ART}rendered-page.html`, prev.json.html, 'utf8');
    out.steps.preview = { status: prev.status, htmlBytes: prev.json.html.length, file: 'artifacts/rendered-page.html' };
    log('  preview HTML ->', prev.status, prev.json.html.length, 'bytes');
  } else {
    out.steps.preview = { status: prev.status, error: prev.json };
    log('  preview HTML ->', prev.status, '(no html)');
  }
  // also save public JSON
  writeFileSync(`${ART}public-page.json`, JSON.stringify(pub.json, null, 2), 'utf8');

  // 9) Activity feed
  log('== 9. Activity ==');
  const act = await api('GET', `/api/v1/projects/${project.id}/activity?limit=50`, null, { raw: true });
  const rows = act.json?.data ?? act.json ?? [];
  out.steps.activity = { status: act.status, total: act.json?.total ?? rows.length, actions: rows.slice(0, 12).map(r => ({ action: r.action, entity: r.entityName ?? r.entityType, at: r.createdAt, user: r.userName })) };
  log('  activity rows:', rows.length);

  // 10) Publish stats (dashboard metric source)
  const stats = await api('GET', `/api/v1/projects/${project.id}/publish/stats`, null, { raw: true });
  out.steps.publishStats = { status: stats.status, data: stats.json };

  writeFileSync(`${ART}demo-state.json`, JSON.stringify(out, null, 2), 'utf8');
  log('\n== DONE ==');
  log(JSON.stringify(out, null, 2));
}

main().catch(e => { console.error('FATAL:', e.message); writeFileSync(`${ART}error.json`, JSON.stringify({ error: e.message, out }, null, 2)); process.exit(1); });
