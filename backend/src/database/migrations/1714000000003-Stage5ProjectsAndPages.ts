import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Stage 5 — Projects & Pages schema migration
 *
 * Projects changes:
 *  - Rename owner_id → created_by_user_id (authorship, no longer used for access control)
 *  - Add is_active column (default true)
 *  - Unique partial index on (organization_id, slug) where org IS NOT NULL AND deleted_at IS NULL
 *
 * Pages changes:
 *  - Create page_type_enum (page/landing/service/category/article)
 *  - Rename url_path → path (normalized URL path)
 *  - Add columns: name, page_type, is_homepage, h1, body,
 *                 meta_title, meta_description, robots_index, robots_follow
 *  - Unique partial index on (project_id, path) where deleted_at IS NULL
 *  - (project_id, slug) unique index already exists from entity definition
 *
 * Backfill notes:
 *  - projects.organization_id remains nullable transitionally.
 *    To make it NOT NULL: ensure all existing rows have organization_id set,
 *    then run: ALTER TABLE projects ALTER COLUMN organization_id SET NOT NULL;
 *    This is intentionally NOT done here — Stage 6 responsibility.
 *
 *  - pages.path is initially populated from the old url_path column value.
 */
export class Stage5ProjectsAndPages1714000000003 implements MigrationInterface {
  name = 'Stage5ProjectsAndPages1714000000003';

  async up(queryRunner: QueryRunner): Promise<void> {

    // ─────────────────────────────────────────────────────────────────────────
    // PROJECTS
    // ─────────────────────────────────────────────────────────────────────────

    // 1. Rename owner_id → created_by_user_id
    //    Safe: wrap in DO/EXCEPTION so re-running migration is idempotent.
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE projects RENAME COLUMN owner_id TO created_by_user_id;
      EXCEPTION WHEN undefined_column THEN null;
      END $$;
    `);

    // 2. Relax FK if it was RESTRICT — now SET NULL is appropriate for authorship
    //    (If constraint doesn't exist or already correct, ignore errors)
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE projects
          DROP CONSTRAINT IF EXISTS "FK_projects_owner_id";
      EXCEPTION WHEN others THEN null;
      END $$;
    `);

    // 3. Add is_active column
    await queryRunner.query(`
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
    `);

    // 4. Unique partial index (organization_id, slug) scoped within org
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_org_slug
        ON projects(organization_id, slug)
        WHERE organization_id IS NOT NULL AND deleted_at IS NULL;
    `);

    // ─────────────────────────────────────────────────────────────────────────
    // PAGES — new enum
    // ─────────────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE page_type_enum AS ENUM ('page', 'landing', 'service', 'category', 'article');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    // ─────────────────────────────────────────────────────────────────────────
    // PAGES — create table if not exists (fresh DB scenario)
    // ─────────────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        parent_id        UUID NULL,
        template_id      UUID NULL,
        name             VARCHAR(200) NULL,
        title            VARCHAR(300) NOT NULL,
        slug             VARCHAR(300) NOT NULL,
        path             VARCHAR(500) NULL,
        page_type        page_type_enum NOT NULL DEFAULT 'page',
        status           VARCHAR(50)  NOT NULL DEFAULT 'draft',
        is_homepage      BOOLEAN NOT NULL DEFAULT false,
        sort_order       INT NOT NULL DEFAULT 0,
        h1               TEXT NULL,
        body             TEXT NULL,
        content          JSONB NOT NULL DEFAULT '{"blocks":[]}',
        preview_html     TEXT NULL,
        meta_title       VARCHAR(300) NULL,
        meta_description TEXT NULL,
        seo_title        VARCHAR(300) NULL,
        seo_description  TEXT NULL,
        seo_keywords     TEXT NULL,
        og_title         VARCHAR(300) NULL,
        og_description   TEXT NULL,
        og_image_url     VARCHAR(500) NULL,
        canonical_url    VARCHAR(500) NULL,
        robots           VARCHAR(100) NOT NULL DEFAULT 'index, follow',
        robots_index     BOOLEAN NOT NULL DEFAULT true,
        robots_follow    BOOLEAN NOT NULL DEFAULT true,
        structured_data  JSONB NOT NULL DEFAULT '{}',
        created_by       UUID NULL REFERENCES users(id) ON DELETE SET NULL,
        updated_by       UUID NULL,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        published_at     TIMESTAMPTZ NULL,
        scheduled_at     TIMESTAMPTZ NULL,
        archived_at      TIMESTAMPTZ NULL,
        deleted_at       TIMESTAMPTZ NULL
      );
    `);

    // ─────────────────────────────────────────────────────────────────────────
    // PAGES — add columns to existing table (ALTER path for existing DBs)
    // ─────────────────────────────────────────────────────────────────────────

    // 5. Rename url_path → path (the canonical URL path column)
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE pages RENAME COLUMN url_path TO path;
      EXCEPTION WHEN undefined_column THEN null;
      END $$;
    `);

    // 6. New columns (all idempotent)
    await queryRunner.query(`
      ALTER TABLE pages
        ADD COLUMN IF NOT EXISTS name             VARCHAR(200)   NULL,
        ADD COLUMN IF NOT EXISTS page_type        page_type_enum NOT NULL DEFAULT 'page',
        ADD COLUMN IF NOT EXISTS is_homepage      BOOLEAN        NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS h1               TEXT           NULL,
        ADD COLUMN IF NOT EXISTS body             TEXT           NULL,
        ADD COLUMN IF NOT EXISTS meta_title       VARCHAR(300)   NULL,
        ADD COLUMN IF NOT EXISTS meta_description TEXT           NULL,
        ADD COLUMN IF NOT EXISTS robots_index     BOOLEAN        NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS robots_follow    BOOLEAN        NOT NULL DEFAULT true;
    `);

    // 7. Add path column if it doesn't exist yet (fresh DB where CREATE TABLE didn't run)
    await queryRunner.query(`
      ALTER TABLE pages
        ADD COLUMN IF NOT EXISTS path VARCHAR(500) NULL;
    `);

    // ─────────────────────────────────────────────────────────────────────────
    // PAGES — indexes
    // ─────────────────────────────────────────────────────────────────────────

    // Unique (project_id, slug) — partial, ignores soft-deleted rows
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_project_slug
        ON pages(project_id, slug)
        WHERE deleted_at IS NULL;
    `);

    // Unique (project_id, path) — partial, ignores null paths and soft-deleted
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_project_path
        ON pages(project_id, path)
        WHERE path IS NOT NULL AND deleted_at IS NULL;
    `);

    // Supporting indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pages_project_id ON pages(project_id);
      CREATE INDEX IF NOT EXISTS idx_pages_status     ON pages(status);
      CREATE INDEX IF NOT EXISTS idx_pages_page_type  ON pages(page_type);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Pages
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pages_project_path;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pages_project_slug;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pages_project_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pages_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pages_page_type;`);
    await queryRunner.query(`
      ALTER TABLE pages
        DROP COLUMN IF EXISTS name,
        DROP COLUMN IF EXISTS page_type,
        DROP COLUMN IF EXISTS is_homepage,
        DROP COLUMN IF EXISTS h1,
        DROP COLUMN IF EXISTS body,
        DROP COLUMN IF EXISTS meta_title,
        DROP COLUMN IF EXISTS meta_description,
        DROP COLUMN IF EXISTS robots_index,
        DROP COLUMN IF EXISTS robots_follow;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE pages RENAME COLUMN path TO url_path;
      EXCEPTION WHEN undefined_column THEN null;
      END $$;
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS page_type_enum;`);

    // Projects
    await queryRunner.query(`DROP INDEX IF EXISTS idx_projects_org_slug;`);
    await queryRunner.query(`ALTER TABLE projects DROP COLUMN IF EXISTS is_active;`);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE projects RENAME COLUMN created_by_user_id TO owner_id;
      EXCEPTION WHEN undefined_column THEN null;
      END $$;
    `);
  }
}
