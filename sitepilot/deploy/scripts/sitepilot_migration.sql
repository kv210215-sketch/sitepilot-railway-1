-- =============================================================================
-- SitePilot — Повна міграція PostgreSQL
-- Версія: 1.0.0
-- Проєкт: solomiya-energy.com → SaaS SitePilot
-- =============================================================================
-- Запуск: psql -U postgres -d sitepilot -f sitepilot_migration.sql
-- =============================================================================

BEGIN;

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_status       AS ENUM ('active', 'inactive', 'banned', 'pending_verification');
CREATE TYPE user_role          AS ENUM ('owner', 'manager', 'editor', 'technical', 'viewer');
CREATE TYPE project_type       AS ENUM ('landing', 'multi_page', 'catalog', 'service_site', 'solar_commercial');
CREATE TYPE project_status     AS ENUM ('active', 'archived', 'draft', 'deleted');
CREATE TYPE page_status        AS ENUM ('draft', 'published', 'archived', 'scheduled');
CREATE TYPE publish_scope      AS ENUM ('page', 'project', 'selected');
CREATE TYPE publish_status     AS ENUM ('queued', 'processing', 'success', 'failed', 'cancelled', 'retrying');
CREATE TYPE backup_type        AS ENUM ('manual', 'auto', 'pre_publish', 'pre_restore');
CREATE TYPE backup_status      AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE invite_status      AS ENUM ('pending', 'accepted', 'declined', 'expired', 'revoked');
CREATE TYPE subscription_plan  AS ENUM ('free', 'basic', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing', 'expired');
CREATE TYPE activity_action    AS ENUM (
  'user_login', 'user_logout', 'user_registered',
  'project_created', 'project_updated', 'project_archived', 'project_deleted',
  'page_created', 'page_updated', 'page_archived', 'page_deleted',
  'publish_started', 'publish_success', 'publish_failed', 'publish_cancelled',
  'template_created', 'template_updated', 'template_applied', 'template_deleted',
  'backup_created', 'backup_restored', 'version_rolled_back',
  'team_member_invited', 'team_member_added', 'team_member_removed', 'role_changed',
  'content_changed', 'seo_updated',
  'integration_added', 'integration_updated', 'integration_removed',
  'settings_changed', 'api_key_generated'
);
CREATE TYPE integration_type   AS ENUM ('webhook', 'analytics', 'crm', 'smtp', 'storage', 'cdn', 'custom');
CREATE TYPE integration_status AS ENUM ('active', 'inactive', 'error');

-- =============================================================================
-- TABLE: tariffs
-- =============================================================================

CREATE TABLE tariffs (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan          subscription_plan NOT NULL UNIQUE,
  name          VARCHAR(100)  NOT NULL,
  description   TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly  NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_projects  INT           NOT NULL DEFAULT 1,
  max_pages     INT           NOT NULL DEFAULT 10,
  max_members   INT           NOT NULL DEFAULT 1,
  max_backups   INT           NOT NULL DEFAULT 5,
  max_templates INT           NOT NULL DEFAULT 3,
  features      JSONB         NOT NULL DEFAULT '[]',
  is_active     BOOLEAN       NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tariffs IS 'Тарифні плани SitePilot';
COMMENT ON COLUMN tariffs.features IS 'Масив назв фіч: ["publish_queue","team_roles","analytics","backups"]';

-- =============================================================================
-- TABLE: users
-- =============================================================================

CREATE TABLE users (
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  email                 VARCHAR(255)  NOT NULL UNIQUE,
  password_hash         VARCHAR(255)  NOT NULL,
  name                  VARCHAR(150)  NOT NULL,
  avatar_url            VARCHAR(500),
  status                user_status   NOT NULL DEFAULT 'pending_verification',
  email_verified        BOOLEAN       NOT NULL DEFAULT false,
  email_verify_token    VARCHAR(255),
  email_verify_expires  TIMESTAMPTZ,
  reset_password_token  VARCHAR(255),
  reset_password_expires TIMESTAMPTZ,
  last_login_at         TIMESTAMPTZ,
  last_login_ip         INET,
  timezone              VARCHAR(100)  NOT NULL DEFAULT 'Europe/Kiev',
  locale                VARCHAR(10)   NOT NULL DEFAULT 'uk',
  metadata              JSONB         NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

COMMENT ON TABLE users IS 'Користувачі платформи';
COMMENT ON COLUMN users.metadata IS 'Довільні налаштування: notification prefs, UI state тощо';

CREATE INDEX idx_users_email           ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status          ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_verify_token    ON users(email_verify_token) WHERE email_verify_token IS NOT NULL;
CREATE INDEX idx_users_reset_token     ON users(reset_password_token) WHERE reset_password_token IS NOT NULL;

-- =============================================================================
-- TABLE: sessions
-- =============================================================================

CREATE TABLE sessions (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    VARCHAR(255)  NOT NULL UNIQUE,
  refresh_hash  VARCHAR(255)  UNIQUE,
  ip_address    INET,
  user_agent    TEXT,
  device_info   JSONB         NOT NULL DEFAULT '{}',
  expires_at    TIMESTAMPTZ   NOT NULL,
  refresh_expires_at TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sessions IS 'Активні сесії та refresh-токени';

CREATE INDEX idx_sessions_user_id    ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash) WHERE revoked_at IS NULL;
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- =============================================================================
-- TABLE: subscriptions
-- =============================================================================

CREATE TABLE subscriptions (
  id                  UUID                NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tariff_id           UUID                NOT NULL REFERENCES tariffs(id),
  plan                subscription_plan   NOT NULL DEFAULT 'free',
  status              subscription_status NOT NULL DEFAULT 'active',
  trial_ends_at       TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  current_period_end  TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  external_id         VARCHAR(255),        -- ID у платіжній системі
  payment_method      JSONB               NOT NULL DEFAULT '{}',
  billing_email       VARCHAR(255),
  metadata            JSONB               NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE subscriptions IS 'Підписки користувачів на тарифні плани';

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status  ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan    ON subscriptions(plan);

-- =============================================================================
-- TABLE: projects
-- =============================================================================

CREATE TABLE projects (
  id            UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name          VARCHAR(200)    NOT NULL,
  slug          VARCHAR(200)    NOT NULL,
  domain        VARCHAR(255),
  project_type  project_type    NOT NULL DEFAULT 'service_site',
  description   TEXT,
  status        project_status  NOT NULL DEFAULT 'draft',
  favicon_url   VARCHAR(500),
  thumbnail_url VARCHAR(500),
  settings      JSONB           NOT NULL DEFAULT '{}',
  seo_defaults  JSONB           NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  archived_at   TIMESTAMPTZ,
  deleted_at    TIMESTAMPTZ,
  UNIQUE(owner_id, slug)
);

COMMENT ON TABLE projects IS 'Веб-проєкти платформи';
COMMENT ON COLUMN projects.settings IS 'Налаштування: publish_url, api_key, custom_headers тощо';
COMMENT ON COLUMN projects.seo_defaults IS 'Дефолтні SEO-значення для всіх сторінок проєкту';

CREATE INDEX idx_projects_owner_id  ON projects(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_status    ON projects(status)   WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_domain    ON projects(domain)   WHERE domain IS NOT NULL AND deleted_at IS NULL;

-- =============================================================================
-- TABLE: project_members
-- =============================================================================

CREATE TABLE project_members (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        user_role   NOT NULL DEFAULT 'viewer',
  added_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
  permissions JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

COMMENT ON TABLE project_members IS 'Учасники проєкту з ролями';
COMMENT ON COLUMN project_members.permissions IS 'Перевизначення дефолтних дозволів ролі';

CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id    ON project_members(user_id);
CREATE INDEX idx_project_members_role       ON project_members(role);

-- =============================================================================
-- TABLE: invitations
-- =============================================================================

CREATE TABLE invitations (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invited_by   UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email        VARCHAR(255)  NOT NULL,
  role         user_role     NOT NULL DEFAULT 'viewer',
  token        VARCHAR(255)  NOT NULL UNIQUE,
  status       invite_status NOT NULL DEFAULT 'pending',
  message      TEXT,
  accepted_by  UUID          REFERENCES users(id) ON DELETE SET NULL,
  expires_at   TIMESTAMPTZ   NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  responded_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE invitations IS 'Запрошення до проєктів';

CREATE INDEX idx_invitations_project_id ON invitations(project_id);
CREATE INDEX idx_invitations_email      ON invitations(email);
CREATE INDEX idx_invitations_token      ON invitations(token) WHERE status = 'pending';
CREATE INDEX idx_invitations_status     ON invitations(status);

-- =============================================================================
-- TABLE: pages
-- =============================================================================

CREATE TABLE pages (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id        UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id         UUID        REFERENCES pages(id) ON DELETE SET NULL,
  title             VARCHAR(300) NOT NULL,
  slug              VARCHAR(300) NOT NULL,
  url_path          VARCHAR(500),
  status            page_status NOT NULL DEFAULT 'draft',
  template_id       UUID,                -- FK додається нижче після таблиці templates
  content           JSONB       NOT NULL DEFAULT '{}',
  seo_title         VARCHAR(300),
  seo_description   TEXT,
  seo_keywords      TEXT,
  og_title          VARCHAR(300),
  og_description    TEXT,
  og_image_url      VARCHAR(500),
  canonical_url     VARCHAR(500),
  robots            VARCHAR(100) NOT NULL DEFAULT 'index, follow',
  structured_data   JSONB       NOT NULL DEFAULT '{}',
  sort_order        INT         NOT NULL DEFAULT 0,
  published_at      TIMESTAMPTZ,
  scheduled_at      TIMESTAMPTZ,
  created_by        UUID        REFERENCES users(id) ON DELETE SET NULL,
  updated_by        UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at       TIMESTAMPTZ,
  deleted_at        TIMESTAMPTZ,
  UNIQUE(project_id, slug)
);

COMMENT ON TABLE pages IS 'Сторінки проєктів';
COMMENT ON COLUMN pages.content IS 'Структура блоків сторінки у форматі JSON';

CREATE INDEX idx_pages_project_id   ON pages(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_status       ON pages(status)     WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_slug         ON pages(project_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_scheduled    ON pages(scheduled_at) WHERE status = 'scheduled' AND scheduled_at IS NOT NULL;

-- =============================================================================
-- TABLE: templates
-- =============================================================================

CREATE TABLE templates (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID        REFERENCES projects(id) ON DELETE CASCADE,  -- NULL = глобальний шаблон
  created_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  category      VARCHAR(100),
  tags          TEXT[]      NOT NULL DEFAULT '{}',
  structure     JSONB       NOT NULL DEFAULT '{}',
  thumbnail_url VARCHAR(500),
  is_global     BOOLEAN     NOT NULL DEFAULT false,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  usage_count   INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

COMMENT ON TABLE templates IS 'Шаблони секцій і сторінок';
COMMENT ON COLUMN templates.project_id IS 'NULL — глобальний шаблон, доступний всім проєктам';

CREATE INDEX idx_templates_project_id  ON templates(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_templates_is_global   ON templates(is_global)  WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_templates_category    ON templates(category)   WHERE deleted_at IS NULL;

-- FK з pages на templates (після створення обох таблиць)
ALTER TABLE pages ADD CONSTRAINT fk_pages_template
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL;

-- =============================================================================
-- TABLE: template_versions
-- =============================================================================

CREATE TABLE template_versions (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id  UUID        NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  version      INT         NOT NULL DEFAULT 1,
  structure    JSONB       NOT NULL DEFAULT '{}',
  change_note  TEXT,
  created_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_id, version)
);

COMMENT ON TABLE template_versions IS 'Версії шаблонів для відкату';

CREATE INDEX idx_template_versions_template_id ON template_versions(template_id);

-- =============================================================================
-- TABLE: publish_jobs
-- =============================================================================

CREATE TABLE publish_jobs (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID            NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  initiated_by    UUID            REFERENCES users(id) ON DELETE SET NULL,
  scope           publish_scope   NOT NULL,
  status          publish_status  NOT NULL DEFAULT 'queued',
  page_ids        UUID[]          NOT NULL DEFAULT '{}',
  pages_total     INT             NOT NULL DEFAULT 0,
  pages_success   INT             NOT NULL DEFAULT 0,
  pages_failed    INT             NOT NULL DEFAULT 0,
  attempt         INT             NOT NULL DEFAULT 1,
  max_attempts    INT             NOT NULL DEFAULT 3,
  priority        INT             NOT NULL DEFAULT 5,          -- 1=highest, 10=lowest
  payload         JSONB           NOT NULL DEFAULT '{}',
  result          JSONB           NOT NULL DEFAULT '{}',
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  duration_ms     INT,
  next_retry_at   TIMESTAMPTZ,
  timeout_at      TIMESTAMPTZ,
  queued_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE publish_jobs IS 'Черга задач публікації';
COMMENT ON COLUMN publish_jobs.page_ids IS 'Масив UUID сторінок для publish_scope=selected';

CREATE INDEX idx_publish_jobs_project_id  ON publish_jobs(project_id);
CREATE INDEX idx_publish_jobs_status      ON publish_jobs(status);
CREATE INDEX idx_publish_jobs_queued      ON publish_jobs(queued_at) WHERE status = 'queued';
CREATE INDEX idx_publish_jobs_retry       ON publish_jobs(next_retry_at) WHERE status = 'retrying';

-- =============================================================================
-- TABLE: publish_job_logs
-- =============================================================================

CREATE TABLE publish_job_logs (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID        NOT NULL REFERENCES publish_jobs(id) ON DELETE CASCADE,
  page_id     UUID        REFERENCES pages(id) ON DELETE SET NULL,
  level       VARCHAR(10) NOT NULL DEFAULT 'info',   -- info | warn | error
  message     TEXT        NOT NULL,
  context     JSONB       NOT NULL DEFAULT '{}',
  duration_ms INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE publish_job_logs IS 'Детальні логи виконання publish-задач';

CREATE INDEX idx_publish_logs_job_id  ON publish_job_logs(job_id);
CREATE INDEX idx_publish_logs_page_id ON publish_job_logs(page_id);
CREATE INDEX idx_publish_logs_level   ON publish_job_logs(level) WHERE level = 'error';

-- =============================================================================
-- TABLE: content_changes
-- =============================================================================

CREATE TABLE content_changes (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id     UUID        NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  changed_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  field       VARCHAR(100) NOT NULL,           -- 'content', 'seo_title', 'seo_description', ...
  value_before JSONB,
  value_after  JSONB,
  change_type VARCHAR(50) NOT NULL DEFAULT 'update',  -- create | update | delete | restore
  version     INT         NOT NULL DEFAULT 1,
  snapshot    JSONB       NOT NULL DEFAULT '{}',       -- повний снапшот сторінки
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE content_changes IS 'Журнал змін контенту сторінок (для rollback)';

CREATE INDEX idx_content_changes_page_id    ON content_changes(page_id);
CREATE INDEX idx_content_changes_project_id ON content_changes(project_id);
CREATE INDEX idx_content_changes_changed_by ON content_changes(changed_by);
CREATE INDEX idx_content_changes_created_at ON content_changes(created_at DESC);

-- =============================================================================
-- TABLE: backups
-- =============================================================================

CREATE TABLE backups (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id     UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by     UUID          REFERENCES users(id) ON DELETE SET NULL,
  name           VARCHAR(200)  NOT NULL,
  description    TEXT,
  type           backup_type   NOT NULL DEFAULT 'manual',
  status         backup_status NOT NULL DEFAULT 'pending',
  size_bytes     BIGINT,
  storage_path   VARCHAR(1000),
  checksum       VARCHAR(64),
  metadata       JSONB         NOT NULL DEFAULT '{}',
  includes       TEXT[]        NOT NULL DEFAULT '{}',  -- ['pages','templates','settings','integrations']
  error_message  TEXT,
  expires_at     TIMESTAMPTZ,
  restored_at    TIMESTAMPTZ,
  restored_by    UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE backups IS 'Резервні копії проєктів';

CREATE INDEX idx_backups_project_id ON backups(project_id);
CREATE INDEX idx_backups_status     ON backups(status);
CREATE INDEX idx_backups_type       ON backups(type);
CREATE INDEX idx_backups_created_at ON backups(created_at DESC);

-- =============================================================================
-- TABLE: backup_items
-- =============================================================================

CREATE TABLE backup_items (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_id   UUID        NOT NULL REFERENCES backups(id) ON DELETE CASCADE,
  item_type   VARCHAR(50) NOT NULL,    -- 'page', 'template', 'settings', 'integration'
  item_id     UUID,
  item_name   VARCHAR(300),
  data        JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE backup_items IS 'Окремі об'єкти у складі резервної копії';

CREATE INDEX idx_backup_items_backup_id  ON backup_items(backup_id);
CREATE INDEX idx_backup_items_item_type  ON backup_items(item_type);

-- =============================================================================
-- TABLE: activity_logs
-- =============================================================================

CREATE TABLE activity_logs (
  id          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID            REFERENCES users(id) ON DELETE SET NULL,
  project_id  UUID            REFERENCES projects(id) ON DELETE CASCADE,
  action      activity_action NOT NULL,
  entity_type VARCHAR(50),              -- 'project', 'page', 'template', 'user', ...
  entity_id   UUID,
  entity_name VARCHAR(300),
  changes     JSONB           NOT NULL DEFAULT '{}',
  metadata    JSONB           NOT NULL DEFAULT '{}',
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE activity_logs IS 'Журнал всіх дій в системі (аудит-лог)';

CREATE INDEX idx_activity_logs_user_id    ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX idx_activity_logs_action     ON activity_logs(action);
CREATE INDEX idx_activity_logs_entity     ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- =============================================================================
-- TABLE: integrations
-- =============================================================================

CREATE TABLE integrations (
  id            UUID                NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID                NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by    UUID                REFERENCES users(id) ON DELETE SET NULL,
  name          VARCHAR(200)        NOT NULL,
  type          integration_type    NOT NULL,
  status        integration_status  NOT NULL DEFAULT 'inactive',
  config        JSONB               NOT NULL DEFAULT '{}',  -- зберігати зашифрованим на рівні app
  secrets       JSONB               NOT NULL DEFAULT '{}',  -- API keys, tokens — шифрувати!
  last_used_at  TIMESTAMPTZ,
  error_message TEXT,
  created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

COMMENT ON TABLE integrations IS 'Зовнішні інтеграції проєктів';
COMMENT ON COLUMN integrations.secrets IS '⚠ Шифрувати на рівні застосунку перед збереженням';

CREATE INDEX idx_integrations_project_id ON integrations(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_integrations_type       ON integrations(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_integrations_status     ON integrations(status) WHERE deleted_at IS NULL;

-- =============================================================================
-- TABLE: analytics_events
-- =============================================================================

CREATE TABLE analytics_events (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  page_id     UUID        REFERENCES pages(id) ON DELETE SET NULL,
  job_id      UUID        REFERENCES publish_jobs(id) ON DELETE SET NULL,
  event_type  VARCHAR(100) NOT NULL,
  properties  JSONB       NOT NULL DEFAULT '{}',
  session_id  UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE analytics_events IS 'Сирі події для аналітики';

CREATE INDEX idx_analytics_events_project_id  ON analytics_events(project_id);
CREATE INDEX idx_analytics_events_user_id     ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type  ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at  ON analytics_events(created_at DESC);
-- Партиціонування за часом — рекомендується при > 10M рядків

-- =============================================================================
-- TABLE: analytics_daily_stats
-- =============================================================================

CREATE TABLE analytics_daily_stats (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id          UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stat_date           DATE        NOT NULL,
  publish_jobs_total  INT         NOT NULL DEFAULT 0,
  publish_success     INT         NOT NULL DEFAULT 0,
  publish_failed      INT         NOT NULL DEFAULT 0,
  publish_avg_ms      INT         NOT NULL DEFAULT 0,
  pages_changed       INT         NOT NULL DEFAULT 0,
  content_edits       INT         NOT NULL DEFAULT 0,
  active_users        INT         NOT NULL DEFAULT 0,
  team_actions        INT         NOT NULL DEFAULT 0,
  errors_total        INT         NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, stat_date)
);

COMMENT ON TABLE analytics_daily_stats IS 'Агреговані денні метрики по проєктах';

CREATE INDEX idx_analytics_daily_project_id ON analytics_daily_stats(project_id);
CREATE INDEX idx_analytics_daily_stat_date  ON analytics_daily_stats(stat_date DESC);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Автоматичне оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Застосовуємо тригер до всіх таблиць з updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tariffs', 'users', 'subscriptions', 'projects',
    'project_members', 'templates', 'backups',
    'integrations', 'analytics_daily_stats'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- Автоматичне збільшення версії шаблону
CREATE OR REPLACE FUNCTION auto_increment_template_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(
    (SELECT MAX(version) FROM template_versions WHERE template_id = NEW.template_id),
    0
  ) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_template_version_auto
  BEFORE INSERT ON template_versions
  FOR EACH ROW EXECUTE FUNCTION auto_increment_template_version();

-- Автоматичний лічильник версій контенту
CREATE OR REPLACE FUNCTION auto_increment_content_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(
    (SELECT MAX(version) FROM content_changes WHERE page_id = NEW.page_id),
    0
  ) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_content_version_auto
  BEFORE INSERT ON content_changes
  FOR EACH ROW EXECUTE FUNCTION auto_increment_content_version();

-- Оновлення usage_count при застосуванні шаблону
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_id IS NOT NULL AND (OLD.template_id IS DISTINCT FROM NEW.template_id) THEN
    UPDATE templates SET usage_count = usage_count + 1 WHERE id = NEW.template_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pages_template_usage
  AFTER UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION increment_template_usage();

-- =============================================================================
-- VIEWS
-- =============================================================================

CREATE VIEW v_project_summary AS
SELECT
  p.id,
  p.name,
  p.domain,
  p.project_type,
  p.status,
  p.owner_id,
  u.name        AS owner_name,
  u.email       AS owner_email,
  COUNT(DISTINCT pg.id) FILTER (WHERE pg.deleted_at IS NULL)        AS pages_total,
  COUNT(DISTINCT pg.id) FILTER (WHERE pg.status = 'published' AND pg.deleted_at IS NULL) AS pages_published,
  COUNT(DISTINCT pm.user_id)                                         AS members_count,
  MAX(al.created_at)                                                 AS last_activity_at,
  p.created_at,
  p.updated_at
FROM projects p
LEFT JOIN users u           ON u.id = p.owner_id
LEFT JOIN pages pg          ON pg.project_id = p.id
LEFT JOIN project_members pm ON pm.project_id = p.id
LEFT JOIN activity_logs al  ON al.project_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY p.id, u.name, u.email;

COMMENT ON VIEW v_project_summary IS 'Зведена інформація по проєктах для дашборду';

CREATE VIEW v_publish_queue AS
SELECT
  pj.id,
  pj.project_id,
  pr.name       AS project_name,
  pj.scope,
  pj.status,
  pj.pages_total,
  pj.pages_success,
  pj.pages_failed,
  pj.attempt,
  pj.max_attempts,
  pj.priority,
  pj.duration_ms,
  pj.error_message,
  pj.queued_at,
  pj.started_at,
  pj.completed_at,
  u.name        AS initiated_by_name
FROM publish_jobs pj
LEFT JOIN projects pr ON pr.id = pj.project_id
LEFT JOIN users u     ON u.id = pj.initiated_by
ORDER BY pj.priority ASC, pj.queued_at ASC;

COMMENT ON VIEW v_publish_queue IS 'Черга публікацій з деталями';

CREATE VIEW v_activity_feed AS
SELECT
  al.id,
  al.action,
  al.entity_type,
  al.entity_id,
  al.entity_name,
  al.created_at,
  al.project_id,
  pr.name  AS project_name,
  al.user_id,
  u.name   AS user_name,
  u.email  AS user_email,
  al.changes,
  al.metadata
FROM activity_logs al
LEFT JOIN users u    ON u.id = al.user_id
LEFT JOIN projects pr ON pr.id = al.project_id
ORDER BY al.created_at DESC;

COMMENT ON VIEW v_activity_feed IS 'Стрічка активності для UI (dashboard + project activity)';

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Тарифи
INSERT INTO tariffs (plan, name, description, price_monthly, price_yearly, max_projects, max_pages, max_members, max_backups, max_templates, features) VALUES
(
  'free',
  'Free',
  'Для ознайомлення з платформою',
  0, 0, 1, 10, 1, 3, 3,
  '["basic_publish","activity_log"]'
),
(
  'basic',
  'Basic',
  'Для малого бізнесу та фрілансерів',
  299, 2690, 3, 50, 5, 10, 10,
  '["basic_publish","activity_log","team_roles","templates","seo_fields"]'
),
(
  'pro',
  'Pro',
  'Для агенцій та команд',
  799, 7190, 15, 500, 20, 50, 100,
  '["basic_publish","activity_log","team_roles","templates","seo_fields","analytics","backups","publish_queue","integrations","versioning"]'
),
(
  'enterprise',
  'Enterprise',
  'Необмежений доступ для великих команд',
  0, 0, -1, -1, -1, -1, -1,
  '["basic_publish","activity_log","team_roles","templates","seo_fields","analytics","backups","publish_queue","integrations","versioning","white_label","sso","priority_support","custom_domain"]'
);

-- Системний адмін (змінити пароль після першого запуску!)
INSERT INTO users (email, password_hash, name, status, email_verified) VALUES
(
  'admin@solomiya-energy.com',
  crypt('ChangeMe123!', gen_salt('bf', 12)),
  'Solomiya Admin',
  'active',
  true
);

-- Підписка адміна на Pro
INSERT INTO subscriptions (user_id, tariff_id, plan, status)
SELECT
  u.id,
  t.id,
  'pro',
  'active'
FROM users u, tariffs t
WHERE u.email = 'admin@solomiya-energy.com'
  AND t.plan = 'pro';

-- Початковий проєкт Solomiya Energy
INSERT INTO projects (owner_id, name, slug, domain, project_type, description, status)
SELECT
  u.id,
  'Solomiya Energy',
  'solomiya-energy',
  'www.solomiya-energy.com',
  'service_site',
  'Головний сайт компанії Solomiya Energy — продаж та встановлення сонячних електростанцій',
  'active'
FROM users u
WHERE u.email = 'admin@solomiya-energy.com';

-- Глобальні шаблони секцій
INSERT INTO templates (project_id, created_by, name, description, category, tags, is_global) VALUES
(NULL, NULL, 'Hero Section', 'Головний банер сторінки з CTA', 'hero', ARRAY['hero','cta','banner'], true),
(NULL, NULL, 'FAQ Section', 'Блок питань та відповідей', 'content', ARRAY['faq','accordion'], true),
(NULL, NULL, 'Contact Form', 'Форма зворотного зв''язку', 'form', ARRAY['form','contact','lead'], true),
(NULL, NULL, 'SEO Defaults', 'Базовий шаблон SEO-полів', 'seo', ARRAY['seo','meta'], true),
(NULL, NULL, 'Gallery Block', 'Блок галереї зображень', 'media', ARRAY['gallery','images','portfolio'], true),
(NULL, NULL, 'Services Grid', 'Сітка послуг/переваг', 'content', ARRAY['services','grid','features'], true),
(NULL, NULL, 'Testimonials', 'Блок відгуків клієнтів', 'content', ARRAY['reviews','testimonials','social_proof'], true),
(NULL, NULL, 'CTA Banner', 'Заклик до дії з формою', 'cta', ARRAY['cta','conversion','lead'], true);

-- =============================================================================
-- PERMISSIONS (RLS — Row Level Security, вмикати за потреби)
-- =============================================================================

-- Приклад RLS для таблиці projects (розкоментувати для мультитенант-режиму):
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY projects_isolation ON projects
--   USING (
--     owner_id = current_setting('app.current_user_id')::UUID
--     OR EXISTS (
--       SELECT 1 FROM project_members pm
--       WHERE pm.project_id = projects.id
--         AND pm.user_id = current_setting('app.current_user_id')::UUID
--     )
--   );

-- =============================================================================
-- COMMENTS ON DATABASE
-- =============================================================================

COMMENT ON DATABASE sitepilot IS 'SitePilot — керуюча платформа для www.solomiya-energy.com';

COMMIT;

-- =============================================================================
-- ПЕРЕВІРКА ПІСЛЯ МІГРАЦІЇ
-- =============================================================================
-- Запустіть ці запити для верифікації:
--
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;
-- SELECT table_name, column_name, data_type FROM information_schema.columns
--   WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;
-- SELECT * FROM tariffs;
-- SELECT * FROM users WHERE email = 'admin@solomiya-energy.com';
-- SELECT * FROM v_project_summary;
-- =============================================================================
