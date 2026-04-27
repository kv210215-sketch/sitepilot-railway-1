#!/bin/bash
# =============================================================================
# SitePilot — PostgreSQL Init Script
# Виконується автоматично при першому запуску контейнера
# =============================================================================
set -e

echo "▶ SitePilot DB init: створення розширень..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Необхідні розширення
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

    -- Налаштування для production
    ALTER SYSTEM SET log_min_duration_statement = '1000';  -- логуємо запити > 1s
    ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

    SELECT pg_reload_conf();

    -- Перевірка
    SELECT extname, extversion FROM pg_extension ORDER BY extname;
EOSQL

echo "✅ SitePilot DB init: завершено"
