# SitePilot — First Production Deploy Checklist

## PRODUCTION STATUS — 2026-05-02

| Component | Status |
|---|---|
| Backend | READY |
| GitHub Actions (deploy-railway.yml) | SUCCESS |
| Railway deployment (triumphant-purpose) | SUCCESS |
| Health endpoint `/health` | 200 OK |
| Railway GitHub App auto-deploy | OFF |
| Deploy channel | GitHub Actions → railway up (single channel) |

**Backend URL:** https://sitepilot-railway-production.up.railway.app
**Health:** https://sitepilot-railway-production.up.railway.app/health → `{"status":"ok","env":"production"}`

---

## ✅ КРОК 1 — ЛОКАЛЬНО (запусти скрипт)

```powershell
cd "C:\Users\Andriy\sitepilot\sitepilot-v2\sitepilot-monorepo-v2\sitepilot"
.\deploy-bootstrap.ps1
```

Скрипт автоматично:
- Запускає postgres
- Запускає 4 міграції
- Верифікує 14 таблиць
- Робить git commit + push

Якщо postgres не стартував через `docker compose`, спробуй альтернативу:
```powershell
docker run -d --name sitepilot_db `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=sitepilot `
  -p 5432:5432 `
  postgres:15
Start-Sleep -Seconds 5
cd backend
npm run migration:run
```

---

## ✅ КРОК 2 — GITHUB SECRET

1. Відкрити: https://railway.app/account/tokens
2. **New Token** → Name: `github-actions` → скопіювати токен
3. Відкрити: https://github.com/USERNAME/sitepilot-railway/settings/secrets/actions
4. **New repository secret**:
   - Name: `RAILWAY_TOKEN`
   - Value: `<токен з кроку 1>`

---

## ✅ КРОК 3 — RAILWAY PROJECT + POSTGRES

1. Відкрити https://railway.app → **New Project**
2. **Deploy from GitHub repo** → вибрати `sitepilot-railway`
3. У проекті: **+ New** → **Database** → **Add PostgreSQL**
4. Дочекатись `Connected` статусу

---

## ✅ КРОК 4 — RAILWAY BACKEND SERVICE

1. **+ New** → **GitHub Repo** → `sitepilot-railway`
2. Settings → **Root Directory**: `backend`
3. Rename service → `backend`
4. **Variables** → додати:

```
NODE_ENV=production
API_PREFIX=api/v1
BCRYPT_ROUNDS=12
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
DB_SYNC=false
DB_LOGGING=false
CORS_ORIGINS=*
FRONTEND_URL=https://placeholder.up.railway.app
ADMIN_EMAIL=andriy555solar@gmail.com
ADMIN_PASSWORD=<придумай надійний пароль>
ADMIN_NAME=Andriy
```

Для JWT_SECRET та JWT_REFRESH_SECRET — згенерувати в PowerShell:
```powershell
# JWT_SECRET:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
# JWT_REFRESH_SECRET (запустити ще раз — отримати інший рядок):
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

```
JWT_SECRET=<результат 1>
JWT_REFRESH_SECRET=<результат 2>
```

**DATABASE_URL не додавати вручну** — він auto-linked з PostgreSQL plugin.

Якщо auto-link не спрацював:
- Variables → **Add Reference** → PostgreSQL → DATABASE_URL

5. Дочекатись деплою → `Active`
6. Перевірити: `GET https://<backend-url>/health` → `{"status":"ok"}`

---

## ✅ КРОК 5 — ЗАПУСТИТИ МІГРАЦІЇ НА RAILWAY

Railway не запускає міграції автоматично. Виконати **одноразово**.

### Варіант A — Railway CLI (рекомендовано):
```powershell
npm install -g @railway/cli
railway login
railway link   # вибрати проект → backend service
railway run npm run migration:run
```

### Варіант B — через Railway Dashboard:
1. backend service → **Settings** → **Deploy**
2. Тимчасово замінити **Start Command** на: `npm run migration:run`
3. **Deploy** → дочекатись виконання → перевірити логи
4. Повернути Start Command: `npm run start:prod`
5. **Deploy** знову

**В логах повинно бути:**
```
All migrations have been run successfully.
```

---

## ✅ КРОК 6 — RAILWAY FRONTEND SERVICE

1. **+ New** → **GitHub Repo** → `sitepilot-railway`
2. Settings → **Root Directory**: `frontend`
3. Rename service → `frontend`
4. Settings → **Domains** → **Generate Domain**
5. Скопіювати frontend URL (наприклад: `sitepilot-frontend.up.railway.app`)
6. **Variables** → додати:

```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_API_URL=https://<BACKEND-URL>/api/v1
```

де `<BACKEND-URL>` — URL бекенд-сервісу з кроку 4.

7. Дочекатись деплою → `Active`
8. Перевірити: `GET https://<frontend-url>/api/health` → `{"status":"ok"}`

---

## ✅ КРОК 7 — ОНОВИТИ CORS У BACKEND

1. backend service → **Variables** → оновити:

```
CORS_ORIGINS=https://<FRONTEND-URL>
FRONTEND_URL=https://<FRONTEND-URL>
```

де `<FRONTEND-URL>` — URL з кроку 6.

2. Backend автоматично redeploy після зміни Variables

---

## ✅ КРОК 8 — SMOKE TEST

Виконати в порядку:

```
# 1. Backend health
GET https://<backend-url>/health
Очікування: {"status":"ok","env":"production","ts":"..."}

# 2. Реєстрація
POST https://<backend-url>/api/v1/auth/register
Body: {"email":"test@example.com","password":"Test1234!","name":"Test User"}
Очікування: {"user":{...},"accessToken":"eyJ..."}

# 3. Логін
POST https://<backend-url>/api/v1/auth/login
Body: {"email":"test@example.com","password":"Test1234!"}
Очікування: {"user":{...},"accessToken":"eyJ..."}

# 4. Frontend
GET https://<frontend-url>
Очікування: login/register page завантажується

# 5. Admin login через UI або API
POST https://<backend-url>/api/v1/auth/login
Body: {"email":"andriy555solar@gmail.com","password":"<ADMIN_PASSWORD>"}
Очікування: {"user":{"role":"super_admin",...},"accessToken":"eyJ..."}
```

---

## ⏭️ ПІСЛЯ ПЕРШОГО DEPLOY (не зараз)

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_AGENCY=price_...
TILDA_EMAIL=your@email.com
TILDA_PASSWORD=your_password
```

---

## 📊 ОЧІКУВАНИЙ РЕЗУЛЬТАТ

| Компонент | URL | Статус |
|---|---|---|
| Backend API | `https://<backend>.up.railway.app` | Active |
| Health check | `.../health` | `{"status":"ok"}` |
| Swagger (dev) | вимкнено в production | — |
| Frontend | `https://<frontend>.up.railway.app` | Active |
| Database | Railway PostgreSQL | Connected |
| Migrations | 4/4 виконані | ✅ |
| Admin user | andriy555solar@gmail.com | seeded |
