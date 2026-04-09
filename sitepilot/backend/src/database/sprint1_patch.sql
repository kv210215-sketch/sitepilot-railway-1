-- =============================================================================
-- SitePilot Sprint 1 — Migration patch
-- Додає таблицю content_blocks (не була у вихідній міграції)
-- Запуск: psql -U sitepilot -d sitepilot -f sprint1_patch.sql
-- =============================================================================

BEGIN;

-- content_blocks — маркетинговий пакет Solomiya Energy
CREATE TABLE IF NOT EXISTS content_blocks (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        VARCHAR(100) NOT NULL UNIQUE,
  name       VARCHAR(200) NOT NULL,
  category   VARCHAR(100),
  data       JSONB        NOT NULL DEFAULT '{}',
  is_active  BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE content_blocks IS 'Маркетинговий пакет Solomiya Energy — блоки контенту для генератора сторінок';

CREATE INDEX IF NOT EXISTS idx_content_blocks_key      ON content_blocks(key);
CREATE INDEX IF NOT EXISTS idx_content_blocks_category ON content_blocks(category);

-- Тригер updated_at
CREATE TRIGGER trg_content_blocks_updated_at
  BEFORE UPDATE ON content_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Додаємо поле preview_html до pages якщо не існує
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS preview_html TEXT;

COMMIT;

-- Перевірка:
-- SELECT key, name FROM content_blocks ORDER BY key;
-- \d pages
