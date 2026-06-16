// Presenter helper: create a fresh, realistic Ukrainian lead on the live staging
// public endpoint (server-side fetch — not subject to browser CORS).
// Run right before the "Ліди" reveal:  node demo/solomiya/submit-lead.mjs
// Each run picks a different lead so repeat demos show a new entry.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Prefer the live values written by run-demo.mjs (artifacts/demo-state.json) so a
// reset/reproduced staging — which creates a new project id — still targets the
// correct inbox. Fall back to the originally captured values if the file is absent.
const HERE = fileURLToPath(new URL('.', import.meta.url));
let API = 'https://sitepilot-railway-staging.up.railway.app';
let PROJECT_ID = 'bc2a7b69-5b11-4b09-8a64-3a473b0db99f';
let PAGE_PATH = '/ses-dlya-biznesu-lviv';
try {
  const s = JSON.parse(readFileSync(HERE + 'artifacts/demo-state.json', 'utf8'));
  API = s.api ?? API;
  PROJECT_ID = s.steps?.project?.id ?? PROJECT_ID;
  PAGE_PATH = s.steps?.page?.path ?? PAGE_PATH;
} catch { /* demo-state.json not present — use captured defaults */ }

const LEADS = [
  { name: 'Олександр Петренко', phone: '+380671234567', email: 'o.petrenko@lvivsklad.ua',
    message: 'Цікавить СЕС ~120 кВт для складського комплексу у Львові. Який строк окупності та чи є фінансування?' },
  { name: 'Ірина Коваль', phone: '+380503217788', email: 'i.koval@agroteplo.ua',
    message: 'Маємо тепличне господарство під Львовом, споживання велике. Потрібен розрахунок СЕС 80–100 кВт.' },
  { name: 'Михайло Грицак', phone: '+380988112244', email: 'm.hrytsak@lvivtrade.ua',
    message: 'ТРЦ у Львові, хочемо знизити рахунки за електроенергію і мати резерв на час відключень.' },
  { name: 'Наталія Семенюк', phone: '+380677890011', email: 'n.semenyuk@karpatyhotel.ua',
    message: 'Готель на 60 номерів, цікавить гібридна СЕС з акумуляторами. Коли можна на аудит?' },
];

// Pick by current minute so successive demo runs rotate without Date.now-based randomness issues.
const idx = new Date().getMinutes() % LEADS.length;
const lead = LEADS[idx];

const res = await fetch(API + '/public/v1/leads', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ projectId: PROJECT_ID, pagePath: PAGE_PATH, consent: true, ...lead }),
});
const body = await res.json().catch(() => ({}));
if (res.ok) {
  console.log('✓ Лід створено:', lead.name, '|', lead.phone, '| id:', body.id);
  console.log('→ Відкрийте «Ліди» у кабінеті й натисніть «Оновити».');
} else {
  console.error('✗ Помилка', res.status, JSON.stringify(body));
  process.exit(1);
}
