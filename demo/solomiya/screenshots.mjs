// Capture staging UI + rendered-page screenshots for the Solomiya Energy demo.
import pw from '../../backend/node_modules/playwright/index.js';
const { chromium } = pw;
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const SHOTS = HERE + 'artifacts/shots/';
mkdirSync(SHOTS, { recursive: true });

const state = JSON.parse(readFileSync(HERE + 'artifacts/demo-state.json', 'utf8'));
const FRONT = 'https://sitepilot-frontend-staging.up.railway.app';
const API = state.api;
const PROJECT = state.steps.project.id;
const PAGE = state.steps.page.id;
const email = process.env.DEMO_EMAIL, password = process.env.DEMO_PASSWORD; // not stored in repo — see .env.example
if (!email || !password) { console.error('Set DEMO_EMAIL / DEMO_PASSWORD (see demo/solomiya/.env.example)'); process.exit(1); }

const shot = async (page, name, full = true) => {
  await page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: full });
  console.log('  shot:', name);
};
const settle = (page, ms = 2500) => page.waitForTimeout(ms);

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'uk-UA' });
  const page = await ctx.newPage();

  // 1) Login page
  console.log('== login ==');
  await page.goto(`${FRONT}/auth/login`, { waitUntil: 'networkidle' });
  await settle(page, 1500);
  await page.fill('input[type="email"]', email).catch(() => {});
  await page.fill('input[type="password"]', password).catch(() => {});
  await shot(page, '01-login', false);

  // submit
  await Promise.allSettled([
    page.click('button[type="submit"]'),
    page.waitForURL('**/dashboard', { timeout: 20000 }).catch(() => {}),
  ]);
  await settle(page, 3500);

  // Fallback: if not authenticated, inject store + cookie and reload
  if (!page.url().includes('/dashboard')) {
    console.log('  form login did not redirect; injecting tokens');
    const auth = await fetch(`${API}/api/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) }).then(r => r.json());
    await ctx.addCookies([{ name: 'sitepilot-token', value: auth.tokens.accessToken, url: FRONT }]);
    await page.addInitScript((a) => {
      localStorage.setItem('sitepilot-auth', JSON.stringify({ state: { user: a.user, tokens: a.tokens, isAuthenticated: true }, version: 0 }));
    }, auth);
    await page.goto(`${FRONT}/dashboard`, { waitUntil: 'networkidle' });
    await settle(page, 3500);
  }

  console.log('== dashboard ==', page.url());
  await shot(page, '02-dashboard');

  // 3) Projects
  await page.goto(`${FRONT}/projects`, { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '03-projects');

  // 4) Pages list
  await page.goto(`${FRONT}/pages?projectId=${PROJECT}`, { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '04-pages');

  // 5) Page editor (blocks)
  await page.goto(`${FRONT}/pages/${PAGE}/edit?projectId=${PROJECT}`, { waitUntil: 'networkidle' });
  await settle(page, 3500);
  await shot(page, '05-editor');

  // 6) In-app preview (rendered)
  await page.goto(`${FRONT}/pages/${PAGE}/preview?projectId=${PROJECT}`, { waitUntil: 'networkidle' });
  await settle(page, 3500);
  await shot(page, '06-app-preview');

  // 7) Publish
  await page.goto(`${FRONT}/publish?projectId=${PROJECT}`, { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '07-publish');

  // 8) Activity
  await page.goto(`${FRONT}/activity?projectId=${PROJECT}`, { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, '08-activity');

  // 9) Rendered public page (the exact HTML the backend renderer produces)
  const fileUrl = 'file:///' + (HERE + 'artifacts/rendered-page.html').replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await settle(page, 800);
  await shot(page, '09-rendered-public-page');

  // 10) Live public API endpoint (JSON) in the browser
  await page.goto(`${API}/public/v1/pages/ses-dlya-biznesu-lviv`, { waitUntil: 'networkidle' });
  await settle(page, 800);
  await shot(page, '10-public-api-json', false);

  await browser.close();
  console.log('\nDONE — screenshots in', SHOTS);
};

run().catch(e => { console.error('SHOT FATAL:', e); process.exit(1); });
