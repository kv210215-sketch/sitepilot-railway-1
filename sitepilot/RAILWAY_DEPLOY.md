# SitePilot — Railway Deploy Guide

## Quick Deploy (6 clicks)

### Step 1 — Create project
1. railway.app → **New Project** → **Deploy from GitHub repo**
2. Connect `andriy555solar-afk/sitepilot-railway`

---

### Step 2 — Add PostgreSQL
In the new project: **+ New** → **Database** → **Add PostgreSQL**

Railway auto-creates `DATABASE_URL` and links it. Done.

---

### Step 3 — Create Backend service
**+ New** → **GitHub Repo** → `sitepilot-railway`

Settings → **Root Directory**: `sitepilot/backend`

#### Backend Variables tab — add:
```
NODE_ENV=production
JWT_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>
DB_SYNC=true
CORS_ORIGINS=*

# Stripe Billing (optional — leave empty to skip billing)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_AGENCY=price_...

# Tilda Publish Engine (optional — leave empty for simulation mode)
TILDA_EMAIL=your@email.com
TILDA_PASSWORD=your_tilda_password
```
`DATABASE_URL` is auto-linked from Postgres — no need to add manually.

Railway auto-deploys via `railway.toml` (Nixpacks, `node dist/main.js`).

Healthcheck: `GET /health` → `{"status":"ok"}`

---

### Step 4 — Create Frontend service
**+ New** → **GitHub Repo** → `sitepilot-railway`

Settings → **Root Directory**: `sitepilot/frontend`

#### Frontend Variables tab — add:
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://<your-backend-railway-domain>
```
Get the backend domain from the backend service's **Settings → Domains**.

Railway auto-deploys via `railway.toml` (Nixpacks, `npm run start`).

---

### Step 5 — Lock down CORS (after you know frontend URL)
Backend Variables → update:
```
CORS_ORIGINS=https://<your-frontend-railway-domain>
```

---

## Railway Settings Reference

| Service  | Root Directory      | Build      | Start Command         | Healthcheck |
|----------|---------------------|------------|-----------------------|-------------|
| backend  | `sitepilot/backend` | Nixpacks   | `node dist/main.js`   | `/health`   |
| frontend | `sitepilot/frontend`| Nixpacks   | `npm run start`       | `/`         |

Build commands are auto-detected (NestJS: `npm run build`, Next.js: `npm run build`).

---

## All Backend ENV vars

| Variable            | Required | Value                              |
|---------------------|----------|------------------------------------|
| `DATABASE_URL`      | auto     | Set by Railway Postgres plugin     |
| `NODE_ENV`          | yes      | `production`                       |
| `JWT_SECRET`        | yes      | `openssl rand -hex 32`             |
| `JWT_REFRESH_SECRET`| yes      | `openssl rand -hex 32`             |
| `DB_SYNC`           | yes*     | `true` on first deploy, then `false` |
| `CORS_ORIGINS`      | yes      | `*` or `https://frontend.railway.app` |
| `PORT`              | auto     | Set by Railway                     |

## All Frontend ENV vars

| Variable              | Required | Value                             |
|-----------------------|----------|-----------------------------------|
| `NEXT_PUBLIC_API_URL` | yes      | `https://backend.railway.app`     |
| `NODE_ENV`            | yes      | `production`                      |
| `PORT`                | auto     | Set by Railway                    |

---

## After First Deploy

1. Set `DB_SYNC=false` in backend vars (schema is created, no longer needed)
2. Add custom domain in Railway if needed
3. Update `CORS_ORIGINS` to actual frontend URL

---

## Health Check

```bash
curl https://<backend-railway-url>/health
# → {"status":"ok","timestamp":"...","env":"production"}
```
