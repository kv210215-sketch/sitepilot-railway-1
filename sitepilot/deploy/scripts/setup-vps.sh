#!/bin/bash
# =============================================================================
# SitePilot — VPS Setup Script (Ubuntu 22.04 / 24.04)
# Запускати як root або через sudo
# Використання: bash setup-vps.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${BLUE}[→]${NC} $1"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1" >&2; exit 1; }
step() { echo -e "\n${BOLD}━━━ $1 ━━━${NC}"; }

[[ $EUID -ne 0 ]] && err "Запускайте з правами root: sudo bash setup-vps.sh"

# ── System update ─────────────────────────────────────────────────────────────
step "1/6 · System update"
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl wget git ufw fail2ban unzip
ok "Система оновлена"

# ── Docker ────────────────────────────────────────────────────────────────────
step "2/6 · Docker"

if command -v docker &>/dev/null; then
  ok "Docker вже встановлено: $(docker --version)"
else
  info "Встановлюємо Docker..."
  curl -fsSL https://get.docker.com | bash
  systemctl enable docker
  systemctl start docker
  ok "Docker встановлено"
fi

# Docker Compose v2
if docker compose version &>/dev/null; then
  ok "Docker Compose v2 вже є"
else
  info "Встановлюємо Docker Compose plugin..."
  apt-get install -y docker-compose-plugin
  ok "Docker Compose встановлено"
fi

# ── Firewall ──────────────────────────────────────────────────────────────────
step "3/6 · Firewall (UFW)"

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp   comment "HTTP"
ufw allow 443/tcp  comment "HTTPS"
# НЕ відкривати 5432 і 6379 — тільки через docker network!
ufw --force enable

ok "UFW налаштовано"
ufw status numbered

# ── fail2ban ──────────────────────────────────────────────────────────────────
step "4/6 · Fail2ban"

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port    = ssh
EOF

systemctl enable fail2ban
systemctl restart fail2ban
ok "fail2ban налаштовано"

# ── Project directory ─────────────────────────────────────────────────────────
step "5/6 · Директорія проєкту"

APP_DIR="/opt/sitepilot"
mkdir -p "$APP_DIR"/{docker,nginx,scripts,env,backups,logs}

# Якщо не клоновано — підказуємо
if [[ ! -f "$APP_DIR/docker/docker-compose.prod.yml" ]]; then
  warn "Скопіюйте файли проєкту в $APP_DIR:"
  echo "  scp -r sitepilot-deploy/* user@server:$APP_DIR/"
fi

chmod +x "$APP_DIR/scripts/"*.sh 2>/dev/null || true
ok "Директорія: $APP_DIR"

# ── Systemd autostart ─────────────────────────────────────────────────────────
step "6/6 · Systemd автозапуск"

cat > /etc/systemd/system/sitepilot.service << EOF
[Unit]
Description=SitePilot Platform
Documentation=https://github.com/solomiya-energy/sitepilot
After=docker.service network-online.target
Wants=network-online.target
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/env/.env.production

ExecStartPre=/usr/bin/docker compose -f $APP_DIR/docker/docker-compose.prod.yml pull --quiet
ExecStart=/usr/bin/docker compose -f $APP_DIR/docker/docker-compose.prod.yml up -d --remove-orphans
ExecStop=/usr/bin/docker compose -f $APP_DIR/docker/docker-compose.prod.yml down
ExecReload=/usr/bin/docker compose -f $APP_DIR/docker/docker-compose.prod.yml restart backend

StandardOutput=append:$APP_DIR/logs/systemd.log
StandardError=append:$APP_DIR/logs/systemd-error.log

Restart=on-failure
RestartSec=10s
TimeoutStartSec=120s
TimeoutStopSec=30s

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable sitepilot.service
ok "Systemd сервіс: sitepilot.service"

# ── Cron для backup ───────────────────────────────────────────────────────────
CRON_JOB="0 2 * * * $APP_DIR/scripts/backup.sh >> $APP_DIR/logs/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v "sitepilot"; echo "$CRON_JOB") | crontab -
ok "Cron бекап: щодня о 02:00"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}  ✅ VPS налаштовано!${NC}"
echo ""
echo -e "${BOLD}  Наступні кроки:${NC}"
echo ""
echo -e "  1. Скопіюйте файли проєкту:"
echo -e "     ${YELLOW}scp -r sitepilot-deploy/* root@YOUR_IP:$APP_DIR/${NC}"
echo ""
echo -e "  2. Скопіюйте та заповніть .env.production:"
echo -e "     ${YELLOW}cp $APP_DIR/env/.env.production.example $APP_DIR/env/.env.production${NC}"
echo -e "     ${YELLOW}nano $APP_DIR/env/.env.production${NC}"
echo ""
echo -e "  3. Налаштуйте SSL (Let's Encrypt):"
echo -e "     ${YELLOW}apt install certbot${NC}"
echo -e "     ${YELLOW}certbot certonly --standalone -d app.solomiya-energy.com${NC}"
echo -e "     ${YELLOW}# Сертифікати: /etc/letsencrypt/live/app.solomiya-energy.com/${NC}"
echo ""
echo -e "  4. Запустіть:"
echo -e "     ${YELLOW}systemctl start sitepilot${NC}"
echo -e "     ${YELLOW}systemctl status sitepilot${NC}"
echo ""
echo -e "  5. Перевірте:"
echo -e "     ${YELLOW}curl http://localhost:3001/health${NC}"
echo ""
