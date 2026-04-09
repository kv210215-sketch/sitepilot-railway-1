# SitePilot — Запуск і деплой

## Структура

```
sitepilot-deploy/
├── docker/
│   ├── docker-compose.yml        # Local dev
│   ├── docker-compose.prod.yml   # Production
│   └── Dockerfile                # Multi-stage backend image
├── nginx/
│   └── nginx.conf                # Reverse proxy + SSL
├── scripts/
│   ├── start.sh                  # 🚀 Локальний автозапуск
│   ├── deploy.sh                 # 🚀 Production деплой
│   ├── setup-vps.sh              # 🖥  Підготовка Ubuntu VPS
│   ├── backup.sh                 # 💾 Бекап PostgreSQL
│   ├── init-db.sh                # 🗄  Init скрипт PostgreSQL
│   └── sitepilot_migration.sql   # 📋 Схема БД (скопіювати сюди)
└── env/
    ├── .env.local                # Dev змінні
    └── .env.production.example   # Шаблон для production
```

---

## 🖥 Локальний запуск (1 команда)

### Передумови
- Docker Desktop або Docker Engine
- Docker Compose v2

### Крок 1 — Підготовка
```bash
# Скопіюйте SQL міграцію
cp sitepilot_migration.sql sitepilot-deploy/scripts/

# Зробіть скрипти виконуваними
chmod +x sitepilot-deploy/scripts/*.sh
```

### Крок 2 — Запуск
```bash
./sitepilot-deploy/scripts/start.sh
```

Скрипт автоматично:
- Перевіряє Docker і порти
- Створює `.env.local` якщо не існує
- Будує backend образ
- Запускає PostgreSQL + Redis + Backend
- Застосовує міграцію БД
- Чекає поки всі сервіси стануть `healthy`
- Виводить адреси всіх сервісів

### Опції
```bash
./scripts/start.sh --tools    # + pgAdmin на http://localhost:5050
./scripts/start.sh --reset    # Повне скидання БД і volumes
```

### Доступні сервіси після запуску
| Сервіс | URL |
|---|---|
| Backend API | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/docs |
| Health check | http://localhost:3001/health |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |
| pgAdmin (--tools) | http://localhost:5050 |

---

## 🌐 Production деплой на VPS

### Крок 1 — Підготовка сервера (Ubuntu 22.04+)
```bash
# Завантажте setup-vps.sh на сервер і запустіть
sudo bash setup-vps.sh
```
Встановлює: Docker, UFW firewall, fail2ban, systemd сервіс, cron бекап.

### Крок 2 — Завантаження файлів
```bash
scp -r sitepilot-deploy/* root@YOUR_SERVER_IP:/opt/sitepilot/
scp sitepilot_migration.sql root@YOUR_SERVER_IP:/opt/sitepilot/scripts/
```

### Крок 3 — Налаштування .env
```bash
ssh root@YOUR_SERVER_IP
cp /opt/sitepilot/env/.env.production.example /opt/sitepilot/env/.env.production
nano /opt/sitepilot/env/.env.production
```

Обов'язково змінити:
- `DB_PASS` — сильний пароль БД
- `JWT_SECRET` — 64+ символи: `openssl rand -hex 64`
- `JWT_REFRESH_SECRET` — інший 64+ символи
- `REDIS_PASS` — сильний пароль Redis

### Крок 4 — SSL сертифікат
```bash
apt install certbot
certbot certonly --standalone -d app.solomiya-energy.com

# Посилання для nginx
ln -s /etc/letsencrypt/live/app.solomiya-energy.com/fullchain.pem \
      /opt/sitepilot/nginx/certs/fullchain.pem
ln -s /etc/letsencrypt/live/app.solomiya-energy.com/privkey.pem \
      /opt/sitepilot/nginx/certs/privkey.pem
```

### Крок 5 — Запуск
```bash
systemctl start sitepilot
systemctl status sitepilot

# Перевірка
curl https://app.solomiya-energy.com/health
```

### Оновлення (деплой нової версії)
```bash
./scripts/deploy.sh
```

### Відкат
```bash
./scripts/deploy.sh --rollback
```

---

## 📋 Корисні команди

```bash
# Логи
docker compose -f docker/docker-compose.yml logs -f backend
docker compose -f docker/docker-compose.yml logs -f postgres

# Зупинка
docker compose -f docker/docker-compose.yml down

# Shell в контейнері
docker exec -it sitepilot-backend sh
docker exec -it sitepilot-postgres psql -U sitepilot -d sitepilot

# Статус
docker compose -f docker/docker-compose.yml ps

# Ручний бекап
./scripts/backup.sh --label manual

# Перегляд таблиць БД
docker exec sitepilot-postgres psql -U sitepilot -d sitepilot \
  -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
```

---

## 🔐 Безпека

- PostgreSQL і Redis **не відкриті** назовні в production (тільки через docker network)
- Nginx обмежує rate limiting: 30 req/min для API, 5 req/min для auth
- UFW блокує всі порти крім 80, 443, SSH
- fail2ban захищає від брутфорсу SSH
- Сертифікати — Let's Encrypt з auto-renewal
- Секрети — тільки в `.env.production` (додайте в `.gitignore`!)
