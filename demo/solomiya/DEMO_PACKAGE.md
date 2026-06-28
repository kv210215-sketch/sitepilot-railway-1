# SitePilot — Demo Package
### Solomiya Energy · Commercial Solar (Львів)

> **Presentation-ready package for a live customer meeting.**
> Built and verified on the live SitePilot staging environment, 2026-06-15.
> Customer-facing lines (what you *say*) are in **Ukrainian**; presenter notes are in English.

**Live artifacts referenced throughout:**
- Public page (API): `https://sitepilot-railway-staging.up.railway.app/public/v1/pages/ses-dlya-biznesu-lviv`
- Admin app: `https://sitepilot-frontend-staging.up.railway.app`
- Screenshots: `demo/solomiya/artifacts/shots/01–11`

---

## 1. Project Summary

**SitePilot** is a platform that turns a short business brief into a published, SEO-optimized Ukrainian landing page in minutes — and then captures and tracks the leads that page generates, all from one dashboard.

For this demo we built a real, end-to-end example for a solar customer:

| Item | Value |
|---|---|
| Project | **Solomiya Energy Commercial Solar** (type: `solar_commercial`) |
| Landing page | **«Сонячні електростанції для бізнесу у Львові»** (`/ses-dlya-biznesu-lviv`) |
| Content | 6 conversion blocks, complete Ukrainian copy |
| SEO score (in-editor) | **90 / 100** |
| Publish | Real one-click publish · **100% success · ~0.5 s** |
| Lead capture | Public form → **Ліди** inbox (verified live) |
| Dashboard | 1 project · 1 page · 2 publications · **0 errors** |

**One-line:** *Бриф → готовий лендінг → заявки клієнтів — без розробників і без тижнів очікування.*

---

## 2. The Customer Problem

A solar company like Solomiya Energy lives or dies by **a steady flow of qualified B2B leads** — and the website is the bottleneck.

**Pain points (what you hear from the client):**
- 🐌 **Повільно.** Кожен новий лендінг (нове місто, нова послуга) — це тижні роботи з підрядником.
- 💸 **Дорого.** Розробник + дизайнер + SEO-спеціаліст за кожну сторінку.
- 🔁 **Залежність.** Будь-яка правка тексту чи ціни — через підрядника.
- 📉 **Слабке SEO.** Сторінки роблять «на дизайн», а не під пошукові запити на кшталт *«сонячні станції для бізнесу Львів»*.
- 📥 **Заявки губляться.** Ліди приходять у пошту, Telegram, дзвінки — немає єдиної воронки.
- 🌍 **Не масштабується.** Щоб покрити 10 міст × 5 послуг = 50 сторінок — нереально вручну.

**Business cost:** competitors who can spin up city-specific, SEO-targeted pages capture the search traffic and the leads first.

---

## 3. The SitePilot Solution

SitePilot collapses *brief → content → publish → leads → analytics* into one tool the **business owner** can run — no developer in the loop.

| Customer pain | SitePilot answer |
|---|---|
| Weeks per page | **Хвилини.** Проєкт + сторінка + контент за один сеанс. |
| Expensive | Один інструмент замість команди підрядників. |
| Dependent on devs | Власник редагує блоки й SEO самостійно. |
| Weak SEO | UA meta, OG, canonical, sitemap — вбудовано (SEO-оцінка 90). |
| Lost leads | Кожна заявка → єдина воронка **«Ліди»** зі статусами. |
| Doesn't scale | Один шаблон → багато міст і послуг. |

**The loop SitePilot owns:** Brief → **Generate** → **Edit** → **Publish (1 click)** → **Capture leads** → **Track & convert** → repeat for the next city/service.

---

## 4. Screenshots & Descriptions

> Files in `demo/solomiya/artifacts/shots/`. Show them in this order in the meeting.

| # | File | What it shows | Say this |
|---|---|---|---|
| 1 | `01-login.png` | Staging login | «Заходимо в кабінет — це справжнє середовище, не макет.» |
| 2 | `02-dashboard.png` | Live metrics: 1 project, 1 page, 2 publications, 0 errors, 100% success, 0.5 s | «Один екран — стан усього: проєкти, публікації, активність, здоров'я системи.» |
| 3 | `03-projects.png` | Project list incl. Solomiya Energy Commercial Solar | «Кожен напрям бізнесу — окремий проєкт.» |
| 4 | `04-pages.png` | Page list — «Сонячні електростанції…», status **Опубліковано**, SEO **90** | «Сторінка опублікована, SEO-оцінка 90 — одразу видно якість.» |
| 5 | `05-editor.png` | Block editor (Hero / Numbers / Pain) + **SEO** tab | «Контент — це блоки. Заголовок, цифри, болі клієнта — все редагується без коду.» |
| 6 | `06-app-preview.png` | In-app preview with Desktop / Tablet / **Mobile** toggle | «Бачимо сторінку як клієнт — і на телефоні теж.» |
| 7 | `07-publish.png` | Publish queue — 2 jobs, **100% success**, 0.5 s | «Публікація в один клік. 100% успішних, пів секунди.» |
| 8 | `08-activity.png` | Activity log: publish started / success, by user | «Повна історія дій — хто, що, коли.» |
| 9 | `09-rendered-public-page.png` | **The rendered Ukrainian landing page** (hero → CTA) | «Ось результат — готова продаюча сторінка українською.» |
| 10 | `10-public-api-json.png` | Live public API returning the page (200) | «Сторінка реально опублікована й доступна публічно.» |
| 11 | `11-leads.png` | **Ліди** inbox with captured lead (Олександр Петренко, 120 кВт) | «А ось і заявка з форми — одразу у воронці зі статусом „Новий".» |

**Headline visuals for the deck:** #9 (the page), #2 (dashboard), #11 (leads).

---

## 5. Demo Flow Script (live, ~6–8 min)

> Run it live if possible; fall back to screenshots #1–11 in the same order.

1. **Login** (`01`) — «Це живий кабінет.»
2. **Dashboard** (`02`) — point at *Публікацій 2 · Помилки 0 · Успішність 100%*.
3. **Create/open project** (`03`) — «Solomiya Energy Commercial Solar — напрям „СЕС для бізнесу".»
4. **Open the page + editor** (`04`→`05`) — show blocks: Hero, цифри (до 70% економії, окупність 2–4 роки), болі→рішення. Flip to **SEO tab** — score **90**.
5. **Preview** (`06`) — toggle **Mobile**. «Адаптив із коробки.»
6. **Publish** (`07`) — click Publish All → job **success** in ~0.5 s. «Один клік.»
7. **Show it's public** (`09`→`10`) — open the rendered page, then the live public API (200).
8. **Submit a lead** — fill the contact form (or POST `/public/v1/leads`) as a prospective client: *«СЕС ~120 кВт для складу у Львові»*.
9. **Leads inbox** (`11`) — refresh **Ліди**: the lead appears as **Новий** with phone, email, message, source. «Заявка вже у воронці.»
10. **Activity** (`08`) — «Усе зафіксовано в журналі.»

**Close:** «Від ідеї до опублікованої сторінки, що збирає заявки — за один сеанс. Уявіть це для 10 міст.»

---

## 6. Objection Handling

| Objection (client) | Response (say this) |
|---|---|
| «У нас вже є сайт.» | «Чудово. SitePilot — не заміна бренд-сайту, а машина для **посадкових сторінок під кожне місто/послугу**, які приводять заявки. Сайт — для іміджу, лендінги — для продажів.» |
| «А SEO буде працювати?» | «Так. Meta-теги, OG, canonical, sitemap — українською й автоматично. У демо SEO-оцінка сторінки — 90. Один шаблон → десятки сторінок під реальні запити.» |
| «Це дорого?» | «Дешевше за одного підрядника. Один інструмент замість дизайнера + розробника + SEO на кожну сторінку. Окупність — на перших же лідах.» |
| «Складно, в нас немає IT-команди.» | «У цьому й суть — це робить власник або маркетолог. Контент — це блоки, публікація — один клік. Жодного коду.» |
| «А заявки куди подіються?» | «У вбудовану воронку „Ліди" зі статусами: Новий → На зв'язку → Кваліфікований → Конвертований. Нічого не губиться у пошті чи Telegram.» |
| «Скільки часу на запуск?» | «Перша сторінка — сьогодні. Ви щойно бачили повний цикл за хвилини.» |
| «А якщо треба правити?» | «Самостійно, будь-коли. Змінили текст/ціну → опублікували → готово.» |
| «Чи це реально, чи демо-макет?» | «Це живе середовище. Ось публічний URL і реальна заявка в кабінеті — не картинка.» |

---

## 7. The 2-Minute Pitch (Ukrainian)

> Для першого контакту / ліфт-пітч.

«Solomiya Energy заробляє на потоці B2B-заявок, а вузьке місце — сайт. Кожен новий лендінг під місто чи послугу — це тижні роботи з підрядником і витрати на дизайнера, розробника й SEO.

**SitePilot** прибирає це вузьке місце. З короткого брифу платформа за **хвилини** робить готову, SEO-оптимізовану посадкову сторінку українською — і ви публікуєте її в **один клік**.

Ось реальний приклад, який ми зробили для вас: лендінг **„Сонячні електростанції для бізнесу у Львові"** — з перевагами, цифрами окупності, етапами робіт і гарантіями. SEO-оцінка — 90. Опубліковано за пів секунди, 100% успішних публікацій.

А найголовніше — **заявки**. Клієнт залишає форму на сторінці, і вона **миттєво з'являється у вашій воронці „Ліди"** зі статусами від „Новий" до „Конвертований". Ось реальна заявка на станцію 120 кВт, яку ми щойно отримали.

Уявіть це для 10 міст і 5 послуг — 50 сторінок, що працюють на пошук і збирають ліди, без жодного розробника. **Першу сторінку запускаємо вже сьогодні.»**

---

## 8. The 5-Minute Pitch (Ukrainian)

> Для повноцінної зустрічі з демонстрацією екрана.

**(0:00 — Проблема)**
«Розкажіть, скільки часу й грошей йде на новий лендінг? Зазвичай у солар-бізнесі це тижні: підрядник, дизайнер, SEO-спеціаліст — і так на кожне місто й кожну послугу. А поки ви чекаєте, конкурент уже зібрав заявки з пошуку. Заявки часто розкидані по пошті, Telegram і дзвінках — частина просто губиться.»

**(1:00 — Рішення + дашборд `02`)**
«SitePilot стискає весь цикл — від брифу до заявки — в один інструмент, яким керує власник, без розробників. Ось живий кабінет: проєкти, публікації, активність, здоров'я системи. Дві публікації, нуль помилок, 100% успішних.»

**(2:00 — Контент і SEO `04`,`05`,`06`)**
«Ось проєкт „Solomiya Energy Commercial Solar" і сторінка „Сонячні електростанції для бізнесу у Львові". Контент — це блоки: заголовок, цифри окупності (до 70% економії, 2–4 роки окупності), болі клієнта й наші рішення, етапи робіт, гарантії, заклик до дії. Усе редагується без коду. Вкладка SEO — оцінка 90: meta, OG, canonical українською. Перегляд — одразу бачимо мобільну версію.»

**(3:00 — Публікація `07`,`09`,`10`)**
«Публікація — один клік. Завдання виконано за пів секунди. Ось готова сторінка очима клієнта, а ось публічний API, що віддає її зі статусом 200 — вона реально в мережі.»

**(4:00 — Ліди `11`,`08`)**
«А тепер головне для продажів. Клієнт залишає заявку на сторінці — і вона миттєво у воронці „Ліди": ім'я, телефон, повідомлення, джерело, статус „Новий". Ось реальна заявка на станцію 120 кВт для складу у Львові. Воронка веде ліда від „Новий" до „Конвертований". І вся історія дій — у журналі активності.»

**(4:30 — Масштаб і заклик)**
«Тепер уявіть: один шаблон → 10 міст × 5 послуг = 50 сторінок, що працюють на SEO й збирають заявки, без жодного розробника. Пропоную запустити вашу першу справжню сторінку вже цього тижня й виміряти перші ліди. Почнемо?»

---

## 9. Why SitePilot ≠ a Normal Website

| | Звичайний сайт / підрядник | **SitePilot** |
|---|---|---|
| Time to launch | Тижні | **Хвилини** |
| Who runs it | Розробник + дизайнер | **Власник / маркетолог** |
| Cost per page | Висока, разова за кожну | Один інструмент на всі сторінки |
| Edits | Через підрядника | **Самостійно, будь-коли** |
| SEO | Окрема послуга | **Вбудовано** (meta/OG/canonical/sitemap, UA) |
| Scaling to N cities | Лінійно дорого | **Один шаблон → багато сторінок** |
| Leads | Розкидані по каналах | **Єдина воронка „Ліди"** зі статусами |
| Visibility | Немає | **Дашборд + журнал активності** |
| Mobile | Окремо тестувати | **Превʼю Desktop/Tablet/Mobile із коробки** |

**The distinction to land:** *«Звичайний сайт — це вітрина. SitePilot — це машина продажів: вона не просто показує, вона публікує під SEO і ловить заявки. І масштабується на скільки завгодно міст.»*

---

## 10. Roadmap (Next)

> Frame as "where we're taking it next" — honest about what's coming.

**Near-term**
- 🌐 **Публічний сайт-хостинг** — окремий публічний домен/рендеринг для опублікованих сторінок (зараз сторінка доступна через публічний API та рендер; додаємо повноцінний публічний фронт `marketing-web`).
- 🤖 **AI-генерація контенту** — автоматичне створення повного UA-лендінгу з брифу (тип бізнесу, бюджет, місто, потужність). Зараз доступно на платних тарифах; розширюємо.
- 🧱 **Більше типів блоків** — FAQ, спецпропозиції, «для дому/бізнесу» — у публічному рендері.
- 📱 **Лід-сповіщення** — Telegram/email при новій заявці (інтеграція вже закладена через `LEAD_SINK`).

**Mid-term**
- 📊 **Аналітика лендінгів** — конверсія сторінки → ліда, джерела трафіку.
- 🧩 **Бібліотека шаблонів** під ніші (солар, послуги, каталог).
- 🌍 **Bulk-генерація** — десятки міст з одного шаблону за один прохід.
- 👥 **Команда й ролі** — спільна робота агенції з кількома клієнтами.

**Later**
- 🔗 **CRM / зелений тариф** інтеграції, A/B-тести заголовків і CTA, мультимовність.

---

### Pre-meeting checklist
- [ ] Open admin app and log in (`$DEMO_EMAIL` / `$DEMO_PASSWORD`, from env / Railway / secure note — see `demo/solomiya/.env.example`) before the call.
- [ ] Have screenshots `01–11` ready as fallback.
- [ ] Have the public page URL open in a tab.
- [ ] Decide: live lead submission, or pre-submitted lead in `Ліди`.
- [ ] Lead with the **rendered page (#9)**, end on **leads (#11)**.
