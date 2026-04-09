#!/bin/bash
# =============================================================================
# SitePilot — Локальний автозапуск
# Використання: ./scripts/start.sh [--tools] [--reset]
# =============================================================================

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "${GREEN}  ✓${NC} $1"; }
info() { echo -e "${BLUE}  →${NC} $1"; }
warn() { echo -e "${YELLOW}  ⚠${NC} $1"; }
err()  { echo -e "${RED}  ✗${NC} $1"; exit 1; }
step() { echo -e "\n${BOLD}${CYAN}$1${NC}"; }

# ── Args ──────────────────────────────────────────────────────────────────────
WITH_TOOLS=false
RESET=false

for arg in "$@"; do
  case $arg in
    --tools) WITH_TOOLS=true ;;
    --reset) RESET=true ;;
    --help)
      echo "Використання: $0 [--tools] [--reset]"
      echo "  --tools   Запустити pgAdmin (http://localhost:5050)"
      echo "  --reset   Повне очищення volumes і перезапуск"
      exit 0 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$DEPLOY_DIR/docker/docker-compose.yml"

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}  ╔═══════════════════════════════╗"
echo -e "  ║   SitePilot  ·  Dev Start    ║"
echo -e "  ╚═══════════════════════════════╝${NC}"
echo ""

# ── Prerequisites ─────────────────────────────────────────────────────────────
step "[ 1/6 ] Перевірка залежностей"

command -v docker &>/dev/null || err "Docker не встановлено. https://docs.docker.com/get-docker/"
command -v docker compose &>/dev/null || err "Docker Compose v2 не знайдено"

DOCKER_VERSION=$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo "unknown")
COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "unknown")

ok "Docker $DOCKER_VERSION"
ok "Docker Compose $COMPOSE_VERSION"

# Перевірка портів
check_port() {
  local port=$1 name=$2
  if lsof -Pi :$port -sTCP:LISTEN -t &>/dev/null 2>&1; then
    warn "Порт $port ($name) вже зайнятий — можливий конфлікт"
  fi
}
check_port 5432 "PostgreSQL"
check_port 6379 "Redis"
check_port 3001 "Backend"

# ── Env file ──────────────────────────────────────────────────────────────────
step "[ 2/6 ] Перевірка конфігурації"

ENV_FILE="$DEPLOY_DIR/env/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  warn ".env.local не знайдено — копіюю з прикладу"
  cp "$DEPLOY_DIR/env/.env.production.example" "$ENV_FILE"
  info "Відредагуйте $ENV_FILE перед запуском"
fi

ok "Env файл: $ENV_FILE"

# Копіюємо SQL міграцію
MIGRATION_SRC="$DEPLOY_DIR/../sitepilot_migration.sql"
MIGRATION_DST="$DEPLOY_DIR/scripts/sitepilot_migration.sql"

if [[ -f "$MIGRATION_SRC" ]] && [[ ! -f "$MIGRATION_DST" ]]; then
  cp "$MIGRATION_SRC" "$MIGRATION_DST"
  ok "Міграцію скопійовано"
elif [[ ! -f "$MIGRATION_DST" ]]; then
  warn "sitepilot_migration.sql не знайдено в scripts/ — БД буде без схеми"
fi

# ── Reset volumes ─────────────────────────────────────────────────────────────
if [[ "$RESET" == true ]]; then
  step "[ R ] Скидання volumes"
  warn "Увага: всі дані БД будуть видалені!"
  read -r -p "  Продовжити? (y/N): " confirm
  if [[ "$confirm" =~ ^[Yy]$ ]]; then
    docker compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true
    ok "Volumes очищено"
  else
    info "Скасовано"
  fi
fi

# ── Build ─────────────────────────────────────────────────────────────────────
step "[ 3/6 ] Збірка образів"

BACKEND_DOCKERFILE="$DEPLOY_DIR/docker/Dockerfile"
BACKEND_CONTEXT="$(dirname "$DEPLOY_DIR")/backend"

if [[ -f "$BACKEND_CONTEXT/package.json" ]]; then
  info "Збираємо backend образ..."
  docker build \
    -f "$BACKEND_DOCKERFILE" \
    --target development \
    -t sitepilot-backend:dev \
    "$BACKEND_CONTEXT" \
    --quiet
  ok "Backend образ зібрано"
else
  warn "backend/ не знайдено поруч — пропускаємо збірку"
fi

# ── Start services ────────────────────────────────────────────────────────────
step "[ 4/6 ] Запуск сервісів"

COMPOSE_ARGS="-f $COMPOSE_FILE"
[[ "$WITH_TOOLS" == true ]] && COMPOSE_ARGS="$COMPOSE_ARGS --profile tools"

info "Запускаємо контейнери..."
docker compose $COMPOSE_ARGS up -d --remove-orphans

ok "Контейнери запущено"

# ── Wait for healthy ──────────────────────────────────────────────────────────
step "[ 5/6 ] Очікування готовності сервісів"

wait_healthy() {
  local name=$1 max_wait=${2:-60} interval=3 elapsed=0
  echo -ne "  Чекаємо ${name}..."
  while true; do
    status=$(docker inspect --format='{{.State.Health.Status}}' "$name" 2>/dev/null || echo "missing")
    case $status in
      healthy)  echo -e " ${GREEN}✓ healthy${NC}"; return 0 ;;
      missing)  echo -e " ${YELLOW}⚠ контейнер не знайдено${NC}"; return 1 ;;
    esac
    if (( elapsed >= max_wait )); then
      echo -e " ${RED}✗ timeout${NC}"
      docker logs "$name" --tail 20
      return 1
    fi
    echo -n "."
    sleep $interval
    (( elapsed += interval ))
  done
}

wait_healthy "sitepilot-postgres" 60
wait_healthy "sitepilot-redis"    30
wait_healthy "sitepilot-backend"  90
wait_healthy "sitepilot-frontend" 120

# ── Summary ───────────────────────────────────────────────────────────────────
step "[ 6/6 ] Готово!"
echo ""
echo -e "  ${BOLD}Сервіси:${NC}"
echo -e "  ${GREEN}●${NC} Backend API    ${CYAN}http://localhost:3001${NC}"
echo -e "  ${GREEN}●${NC} Swagger Docs   ${CYAN}http://localhost:3001/docs${NC}"
echo -e "  ${GREEN}●${NC} Health check   ${CYAN}http://localhost:3001/health${NC}"
echo -e "  ${GREEN}●${NC} Frontend       ${CYAN}http://localhost:3000${NC}"
  echo -e "  ${GREEN}●${NC} PostgreSQL     ${CYAN}localhost:5432${NC}  db=${BOLD}sitepilot${NC}"
echo -e "  ${GREEN}●${NC} Redis          ${CYAN}localhost:6379${NC}"
[[ "$WITH_TOOLS" == true ]] && \
  echo -e "  ${GREEN}●${NC} pgAdmin        ${CYAN}http://localhost:5050${NC}  admin@sitepilot.local / admin"
echo ""
echo -e "  ${BOLD}Команди:${NC}"
echo -e "  ${YELLOW}docker compose -f $COMPOSE_FILE logs -f backend${NC}   — логи бекенду"
echo -e "  ${YELLOW}docker compose -f $COMPOSE_FILE down${NC}              — зупинити"
echo -e "  ${YELLOW}./scripts/start.sh --reset${NC}                        — скинути БД"
echo -e "  ${YELLOW}./scripts/start.sh --tools${NC}                        — з pgAdmin"
echo ""
