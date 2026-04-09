#!/bin/bash
# =============================================================================
# SitePilot — Production Deploy Script (VPS/Ubuntu)
# Використання: ./scripts/deploy.sh [--skip-build] [--rollback]
# Вимоги: Docker, Docker Compose v2, Git
# =============================================================================

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${BLUE}[→]${NC} $1"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1" >&2; exit 1; }
step() { echo -e "\n${BOLD}━━━ $1 ━━━${NC}"; }

# ── Config ────────────────────────────────────────────────────────────────────
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$DEPLOY_DIR/docker/docker-compose.prod.yml"
ENV_FILE="$DEPLOY_DIR/env/.env.production"
BACKUP_SCRIPT="$DEPLOY_DIR/scripts/backup.sh"
LOG_FILE="$DEPLOY_DIR/deploy.log"
DEPLOY_TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ── Args ──────────────────────────────────────────────────────────────────────
SKIP_BUILD=false
ROLLBACK=false

for arg in "$@"; do
  case $arg in
    --skip-build) SKIP_BUILD=true ;;
    --rollback)   ROLLBACK=true ;;
  esac
done

# ── Logging ───────────────────────────────────────────────────────────────────
exec > >(tee -a "$LOG_FILE") 2>&1
echo ""
echo "════════════════════════════════════════════"
echo "  SitePilot Deploy — $DEPLOY_TIMESTAMP"
echo "════════════════════════════════════════════"

# ── Rollback ──────────────────────────────────────────────────────────────────
if [[ "$ROLLBACK" == true ]]; then
  step "ROLLBACK"
  warn "Виконується відкат до попередньої версії..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
    rollback backend 2>/dev/null || {
    warn "rollback не підтримується — перезапускаємо поточну версію"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart backend
  }
  ok "Відкат виконано"
  exit 0
fi

# ── Pre-flight checks ─────────────────────────────────────────────────────────
step "1/7 · Pre-flight checks"

[[ -f "$ENV_FILE" ]] || err "Не знайдено $ENV_FILE. Скопіюйте .env.production.example"

# Перевіряємо що секрети змінені
# shellcheck disable=SC1090
source "$ENV_FILE"
[[ "${JWT_SECRET:-}" == *"CHANGE_ME"* ]] && err "JWT_SECRET не змінений! Відредагуйте .env.production"
[[ "${DB_PASS:-}"    == *"CHANGE_ME"* ]] && err "DB_PASS не змінений! Відредагуйте .env.production"

ok "Env файл валідний"
ok "Секрети змінені"

# ── Backup before deploy ──────────────────────────────────────────────────────
step "2/7 · Pre-deploy backup"

if [[ -x "$BACKUP_SCRIPT" ]]; then
  info "Запускаємо бекап перед деплоєм..."
  bash "$BACKUP_SCRIPT" --label "pre-deploy-$DEPLOY_TIMESTAMP" || warn "Бекап не вдався — продовжуємо"
  ok "Бекап завершено"
else
  warn "Скрипт бекапу не знайдено — пропускаємо"
fi

# ── Pull latest code ──────────────────────────────────────────────────────────
step "3/7 · Git pull"

if git -C "$DEPLOY_DIR" rev-parse --is-inside-work-tree &>/dev/null; then
  CURRENT_COMMIT=$(git -C "$DEPLOY_DIR" rev-parse --short HEAD)
  git -C "$DEPLOY_DIR" pull --ff-only origin main
  NEW_COMMIT=$(git -C "$DEPLOY_DIR" rev-parse --short HEAD)
  ok "Git: $CURRENT_COMMIT → $NEW_COMMIT"
else
  warn "Не в git-репозиторії — пропускаємо pull"
fi

# ── Build new image ───────────────────────────────────────────────────────────
step "4/7 · Docker build"

if [[ "$SKIP_BUILD" == false ]]; then
  info "Збираємо backend образ (production)..."
  docker build \
    -f "$DEPLOY_DIR/docker/Dockerfile" \
    --target production \
    -t sitepilot-backend:latest \
    -t "sitepilot-backend:$DEPLOY_TIMESTAMP" \
    "$(dirname "$DEPLOY_DIR")/backend"
  ok "Образ зібрано: sitepilot-backend:$DEPLOY_TIMESTAMP"
else
  info "Пропускаємо збірку (--skip-build)"
fi

# ── Run migrations ────────────────────────────────────────────────────────────
step "5/7 · Database migrations"

# Перевіряємо чи postgres запущений
if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps postgres | grep -q "healthy"; then
  info "PostgreSQL вже запущений"
else
  info "Запускаємо PostgreSQL..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres redis

  info "Чекаємо на PostgreSQL..."
  timeout 60 bash -c 'until docker inspect sitepilot-postgres --format="{{.State.Health.Status}}" | grep -q healthy; do sleep 3; done'
  ok "PostgreSQL готовий"
fi

# Запускаємо міграції через окремий контейнер
if [[ -f "$DEPLOY_DIR/scripts/sitepilot_migration.sql" ]]; then
  info "Перевіряємо схему БД..."
  TABLES_COUNT=$(docker exec sitepilot-postgres \
    psql -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" \
    2>/dev/null | tr -d ' ' || echo "0")

  if [[ "$TABLES_COUNT" -lt "5" ]]; then
    info "Застосовуємо міграцію (tables: $TABLES_COUNT)..."
    docker exec -i sitepilot-postgres \
      psql -U "$DB_USER" -d "$DB_NAME" \
      < "$DEPLOY_DIR/scripts/sitepilot_migration.sql"
    ok "Міграцію застосовано"
  else
    ok "Схема вже існує ($TABLES_COUNT таблиць)"
  fi
fi

# ── Zero-downtime deploy ──────────────────────────────────────────────────────
step "6/7 · Deploy (zero-downtime)"

info "Оновлюємо backend контейнер..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
  up -d --no-deps --build backend

info "Очікуємо health check нового контейнера..."
timeout 90 bash -c '
  while true; do
    STATUS=$(docker inspect sitepilot-backend --format="{{.State.Health.Status}}" 2>/dev/null || echo "missing")
    [[ "$STATUS" == "healthy" ]] && exit 0
    [[ "$STATUS" == "unhealthy" ]] && exit 1
    sleep 5
  done
' || {
  err "Backend не став healthy! Перевірте: docker logs sitepilot-backend --tail 50"
}

ok "Backend запущено і healthy"

# Переконуємось що nginx перезавантажено
if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps nginx &>/dev/null; then
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
    exec nginx nginx -s reload 2>/dev/null || true
  ok "Nginx перезавантажено"
fi

# ── Cleanup old images ────────────────────────────────────────────────────────
step "7/7 · Cleanup"

docker image prune -f --filter "label=app=sitepilot" &>/dev/null || true
ok "Старі образи очищено"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}  ✅ Деплой завершено успішно!${NC}"
echo ""
echo -e "  Timestamp: ${CYAN}$DEPLOY_TIMESTAMP${NC}"
echo -e "  Лог:       ${CYAN}$LOG_FILE${NC}"
echo ""
echo -e "  ${BOLD}Перевірка:${NC}"
echo -e "  curl https://api.solomiya-energy.com/health"
echo ""
