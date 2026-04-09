-- =============================================================================
-- SitePilot Sprint 3 — Migration patch
-- Перевіряє і доповнює таблиці publish_jobs та audit_logs
-- Запуск: psql -U sitepilot -d sitepilot -f sprint3_patch.sql
-- =============================================================================

BEGIN;

-- Таблиці publish_jobs і publish_job_logs вже є у вихідній міграції.
-- Перевіряємо і додаємо лише відсутні поля.

-- audit_logs — вже є у вихідній міграції як activity_logs.
-- Якщо використовуємо нову назву audit_logs — створюємо view-alias:
CREATE OR REPLACE VIEW audit_logs_view AS
  SELECT
    id,
    user_id,
    project_id,
    action::text,
    entity_type,
    entity_id,
    entity_name,
    changes,
    metadata,
    ip_address,
    created_at
  FROM activity_logs;

COMMENT ON VIEW audit_logs_view IS 'Alias для activity_logs — використовується AuditModule';

-- Індекси для швидкого пошуку по activity_logs (якщо не існують)
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_project
  ON activity_logs(action, project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_publish_jobs_project_status
  ON publish_jobs(project_id, status, queued_at DESC);

CREATE INDEX IF NOT EXISTS idx_publish_jobs_active
  ON publish_jobs(project_id, queued_at DESC)
  WHERE status IN ('pending','queued','processing','retrying');

COMMIT;

-- Перевірка:
-- SELECT COUNT(*) FROM publish_jobs;
-- SELECT COUNT(*) FROM activity_logs;
-- SELECT action, COUNT(*) FROM activity_logs GROUP BY action ORDER BY count DESC;
