#!/bin/bash
# =============================================================================
# SitePilot — PostgreSQL Backup Script
# Використання: ./scripts/backup.sh [--label my-backup]
# Cron: 0 2 * * * /path/to/sitepilot-deploy/scripts/backup.sh >> /var/log/sitepilot-backup.log 2>&1
# =============================================================================

set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$DEPLOY_DIR/backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LABEL="${2:-auto}"

# ── Завантаження env ──────────────────────────────────────────────────────────
ENV_FILE="$DEPLOY_DIR/env/.env.production"
[[ -f "$DEPLOY_DIR/env/.env.local" ]] && ENV_FILE="$DEPLOY_DIR/env/.env.local"
# shellcheck disable=SC1090
source "$ENV_FILE"

BACKUP_FILE="$BACKUP_DIR/sitepilot_${LABEL}_${TIMESTAMP}.sql.gz"
mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ▶ Backup start: $BACKUP_FILE"

# ── Дамп через docker exec ────────────────────────────────────────────────────
docker exec sitepilot-postgres \
  pg_dump -U "${DB_USER}" "${DB_NAME}" \
  --no-owner --no-acl --clean --if-exists \
  | gzip > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ Backup: $BACKUP_FILE ($SIZE)"

# ── Видалення старих бекапів ──────────────────────────────────────────────────
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime "+$RETENTION_DAYS" -print -delete | wc -l)
[[ "$DELETED" -gt 0 ]] && echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🗑  Видалено $DELETED старих бекапів"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Done"
