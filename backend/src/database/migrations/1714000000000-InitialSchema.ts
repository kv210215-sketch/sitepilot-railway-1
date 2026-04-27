import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * InitialSchema — creates the full database from scratch.
 *
 * Timestamp 1714000000000 ensures this runs BEFORE migrations 001/002/003,
 * which are all written with IF NOT EXISTS / DO $$ EXCEPTION patterns
 * and therefore execute harmlessly on top of this schema.
 *
 * Tables created (dependency order):
 *   users → organizations → organization_members
 *   → projects → project_members
 *   → templates, content_blocks
 *   → pages → publish_jobs → publish_job_logs
 *   → audit_logs → subscriptions → onboarding_sessions
 */
export class InitialSchema1714000000000 implements MigrationInterface {
  name = 'InitialSchema1714000000000';

  // ── UP ───────────────────────────────────────────────────────────────────────

  async up(queryRunner: QueryRunner): Promise<void> {

    // ══════════════════════════════════════════════════════════════════════════
    // ENUM TYPES
    // All wrapped in DO $$ EXCEPTION to be idempotent (safe if re-run or if
    // migrations 001/002/003 try to create the same types afterward).
    // ══════════════════════════════════════════════════════════════════════════

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE user_status_enum AS ENUM (
          'active', 'inactive', 'banned', 'pending_verification'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE system_role_enum AS ENUM (
          'super_admin', 'admin', 'user'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE org_role_enum AS ENUM (
          'owner', 'admin', 'member'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE project_type_enum AS ENUM (
          'landing', 'multi_page', 'catalog', 'service_site', 'solar_commercial'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE project_status_enum AS ENUM (
          'draft', 'active', 'archived', 'deleted'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE user_role_enum AS ENUM (
          'owner', 'manager', 'editor', 'technical', 'viewer'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE page_status_enum AS ENUM (
          'draft', 'generated', 'ready', 'published', 'archived', 'scheduled'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE page_type_enum AS ENUM (
          'page', 'landing', 'service', 'category', 'article'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE publish_scope_enum AS ENUM (
          'page', 'project', 'selected'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE publish_status_enum AS ENUM (
          'pending', 'queued', 'processing', 'success', 'failed', 'cancelled', 'retrying'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE billing_plan_enum AS ENUM (
          'free', 'starter', 'pro', 'agency'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE subscription_status_enum AS ENUM (
          'active', 'trialing', 'past_due', 'canceled', 'inactive'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE onboarding_step_enum AS ENUM (
          'start', 'type', 'goal', 'data', 'generate', 'publish', 'done'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE business_type_enum AS ENUM (
          'solar', 'services', 'other'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE business_goal_enum AS ENUM (
          'leads', 'sales', 'reserve'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // ══════════════════════════════════════════════════════════════════════════
    // TABLE 1: users
    // No FK dependencies. Root of the dependency graph.
    // ══════════════════════════════════════════════════════════════════════════

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
        email                 VARCHAR(255)  NOT NULL UNIQUE,
        password_hash         VARCHAR(255)  NOT NULL,
        name                  VARCHAR(150)  NOT NULL,
        avatar_url            VARCHAR(500)  NULL,
        status                user_status_enum NOT NULL DEFAULT 'pending_verification',
        role                  system_role_enum NOT NULL DEFAULT 'user',
        email_verified        BOOLEAN       NOT NULL DEFAULT false,
        email_verify_token    VARCHAR(255)  NULL,
        email_verify_expires  TIMESTAMPTZ   NULL,
        reset_password_token  VARCHAR(255)  NULL,
        reset_password_expires TIMESTAMPTZ  NULL,
        last_login_at         TIMESTAMPTZ   NULL,
        last_login_ip         INET          NULL,
        timezone              VARCHAR(100)  NOT NULL DEFAULT 'Europe/Kiev',
        locale                VARCHAR(10)   NOT NULL DEFAULT 'uk',
        metadata              JSONB         NOT NULL DEFAULT '{}',
        refresh_token_hash    VARCHAR(255)  NULL,
        created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
        updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
        deleted_at            TIMESTAMPTZ   NULL
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);`);

    // ══════════════════════════════════════════════════════════════════════════
    // TABLE 2: organizations
    // Depends on: users (owner_id)
    // ══════════════════════════════════════════════════════════════════════════

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(200) NOT NULL,
        slug        VARCHAR(200) NOT NULL UNIQUE,
        description TEXT         NULL,
        is_active   BOOLEAN      NOT NULL DEFAULT true,
        owner_id    UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        settings    JSONB        NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        deleted_at  TIMESTAMPTZ  NULL
      );
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON organizations(deleted_at);`);

    // ══════════════════════════════════════════════════════════════════════════
    // TABLE 3: organization_members
    // Depends on: organizations, users
    // ══════════════════════════════════════════════════════════════════════════

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS organization_members (
        id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id     UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id             UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role                org_role_enum NOT NULL DEFAULT 'member',
        is_active           BOOLEAN      NOT NULL DEFAULT true,
        invited_by_user_id  UUID         NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
        UNIQUE(organization_id, user_id)
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);`);

    // ══════════════════════════════════════════════════════════════════════════
    // TABLE 4: projects
    // Depends on: users (created_by_user_id), organizations (organization_id)
    // ══════════════════════════════════════════════════════════════════════════

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id     UUID              NULL REFERENCES organizations(id) ON DELETE RESTRICT,
        created_by_user_id  UUID              NULL REFERENCES users(id) ON DELETE SET NULL,
        name                VARCHAR(200)      NOT NULL,
        slug                VARCHAR(200)      NOT NULL,
        description         TEXT              NULL,
        is_active           BOOLEAN           NOT NULL DEFAULT true,
        status              project_status_enum NOT NULL DEFAULT 'draft',
        project_type        project_type_enum NOT NULL DEFAULT 'service_site',
        domain              VARCHAR(255)      NULL,
        favicon_url         VARCHAR(500)      NULL,
        thumbnail_url       VARCHAR(500)      NULL,
        settings            JSONB             NOT NULL DEFAULT '{}',
        seo_defaults        JSONB             NOT NULL DEFAULT '{}',
        created_at          TIMESTAMPTZ       NOT NULL DEFAULT now(),
        updated_at          TIMESTAMPTZ       NOT NULL DEFAULT now(),
        archived_at         TIMESTAMPTZ       NULL,
        deleted_at          TIMESTAMPTZ       NULL
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by_user_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);`);
    // Unique slug within an org (partial index — mirrors entity decorator)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_org_slug
        ON projects(organization_id, slug)
        WHERE organization_id IS NOT NULL AND deleted_at IS NULL;
    `);

    // ══════════════════════════════════════════════════════════════════════════
    // TABLE 5: project_members
    // Depends on: projects, users
    // ══════════════════════════════════════════════════════════════════════════

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id          UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id  UUID             NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id     UUID             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role        user_role_enum   NOT NULL DEFAULT 'viewer',
        added_by    UUID             NULL,
        permissions JSONB            NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ      NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ      NOT NULL DEFAULT now(),
        UNIQUE(project_id, user_id)
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);`);

    // ══════════════════════════════════════════════════════════════════════════
    // TABLE 6: templates
    // project_id and created_by are plain UUID columns (no FK constraint in entity)
    // ══════════════════════════════════════════════════════════════════════════

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id    UUID        NULL,
        created_by    UUID        NULL,
        name          VARCHAR(200) NOT NULL,
        description   TEXT        NULL,
        category      VARCHAR(100) NULL,
        tags          TEXT[]      NOT NULL DEFAULT '{}',
        structure     JSONB       NOT NULL DEFAULT '{"blocks":[],"seoRules":{},"requiredVars":[]}',
        thumbnail_url VARCHAR(500) NULL,
        is_global     BOOLEAN     NOT NULL DEFAULT false,
        is_active     BOOLEAN     NOT NULL DEFAULT true,
        usage_count   INT         NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at    TIMESTAMPTZ NULL
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_templates_is_global ON templates(is_global);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);`);

    // ══════════════════════════════════════════════════════════════════════════
    // TABLE 7: content_blocks
    // No FK dependencies
    // ══════════════════════════════════════════════════════════════════════════

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS content_blocks (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        key        VARCHAR(100) NOT NULL UNIQUE,
        name       VARCHAR(200) NOT NULL,
        category   VARCHAR(100) NULL,
        data       JSONB       NOT NULL DEFAULT '{}',
        is_active  BOOLEAN     NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_content_blocks_key ON content_blocks(key);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_content_blocks_category ON content_blocks(category);`);

    // ══════════════════════════════════════════════════════════════════════════
    // TABLE 8: pages
    // Depends on: projects, users (created_by)
    // ══════════════════════════════════════════════════════════════════════════

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id                UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id        UUID             NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        parent_id         UUID             NULL,
        template_id       UUID             NULL,
        name              VARCHAR(200)     NULL,
        title             VARCHAR(300)     NOT NULL,
        slug              VARCHAR(300)     NOT NULL,
        path              VARCHAR(500)     NULL,
        page_type         page_type_enum   NOT NULL DEFAULT 'page',
        status            page_status_enum NOT NULL DEFAULT 'draft',
        is_homepage       BOOLEAN          NOT NULL DEFAULT false,
        sort_order        INT              NOT NULL DEFAULT 0,
        h1                TEXT             NULL,
        body              TEXT             NULL,
        content           JSONB            NOT NULL DEFAULT '{"blocks":[]}',
        preview_html      TEXT             NULL,
        meta_title        VARCHAR(300)     NULL,
        meta_description  TEXT             NULL,
        seo_title         VARCHAR(300)     NULL,
        seo_description   TEXT             NULL,
        seo_keywords      TEXT             NULL,
        og_title          VARCHAR(300)     NULL,
        og_description    TEXT             NULL,
        og_image_url      VARCHAR(500)     NULL,
        canonical_url     VARCHAR(500)     NULL,
        robots            VARCHAR(100)     NOT NULL DEFAULT 'index, follow',
        robots_index      BOOLEAN          NOT NULL DEFAULT true,
        robots_follow     BOOLEAN          NOT NULL DEFAULT true,
        structured_data   JSONB            NOT NULL DEFAULT '{}',
        created_by        UUID             NULL REFERENCES users(id) ON DELETE SET NULL,
        updated_by        UUID             NULL,
        created_at        TIMESTAMPTZ      NOT NULL DEFAULT now(),
        updated_at        TIMESTAMPTZ      NOT NULL DEFAULT now(),
        published_at      TIMESTAMPTZ      NULL,
        scheduled_at      TIMESTAMPTZ      NULL,
        archived_at       TIMESTAMPTZ      NULL,
        deleted_at        TIMESTAMPTZ      NULL
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_pages_project_id ON pages(project_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_pages_page_type ON pages(page_type);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_pages_deleted_at ON pages(deleted_at);`);
    // Unique (project_id, slug) — partial, mirrors entity @Index decorator
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_project_slug
        ON pages(project_id, slug)
        WHERE deleted_at IS NULL;
    `);
    // Unique (project_id, path) — partial, mirrors entity @Index decorator
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_project_path
        ON pages(project_id, path)
        WHERE path IS NOT NULL AND deleted_at IS NULL;
    `);

    // ══════════════════════════════════════════════════════════════════════════
    // TABLE 9: publish_jobs
    // Depends on: projects, users (initiated_by)
    // ══════════════════════════════════════════════════════════════════════════

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS publish_jobs (
        id             UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id     UUID               NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        initiated_by   UUID               NULL REFERENCES users(id) ON DELETE SET NULL,
        scope          publish_scope_enum NOT NULL,
        status         publish_status_enum NOT NULL DEFAULT 'pending',
        page_ids       UUID[]             NOT NULL DEFAULT '{}',
        pages_total    INT                NOT NULL DEFAULT 0,
        pages_success  INT                NOT NULL DEFAULT 0,
        pages_failed   INT                NOT NULL DEFAULT 0,
        attempt        INT                NOT NULL DEFAULT 1,
        max_attempts   INT                NOT NULL DEFAULT 3,
        priority       INT                NOT NULL DEFAULT 5,
        payload        JSONB              NOT NULL DEFAULT '{}',
        result         JSONB              NOT NULL DEFAULT '{}',
        error_message  TEXT               NULL,
        started_at     TIMESTAMPTZ        NULL,
        completed_at   TIMESTAMPTZ        NULL,
        duration_ms    INT                NULL,
        next_retry_at  TIMESTAMPTZ        NULL,
        queued_at      TIMESTAMPTZ        NOT NULL DEFAULT now(),
        created_at     TIMESTAMPTZ        NOT NULL DEFAULT now(),
        updated_at     TIMESTAMPTZ        NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_publish_jobs_project ON publish_jobs(project_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_publish_jobs_status ON publish_jobs(status);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_publish_jobs_queued_at ON publish_jobs(queued_at);`);

    // ══════════════════════════════════════════════════════════════════════════
    // TABLE 10: publish_job_logs
    // Depends on: publish_jobs
    // ══════════════════════════════════════════════════════════════════════════

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS publish_job_logs (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id      UUID        NOT NULL REFERENCES publish_jobs(id) ON DELETE CASCADE,
        page_id     UUID        NULL,
        level       VARCHAR(10) NOT NULL DEFAULT 'info',
        message     TEXT        NOT NULL,
        context     JSONB       NOT NULL DEFAULT '{}',
        duration_ms INT         NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_publish_job_logs_job ON publish_job_logs(job_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_publish_job_logs_created_at ON publish_job_logs(created_at);`);

    // ══════════════════════════════════════════════════════════════════════════
    // TABLE 11: audit_logs
    // Depends on: users (user_id), projects (project_id)
    // ══════════════════════════════════════════════════════════════════════════

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID         NULL REFERENCES users(id) ON DELETE SET NULL,
        project_id   UUID         NULL REFERENCES projects(id) ON DELETE CASCADE,
        action       VARCHAR(80)  NOT NULL,
        entity_type  VARCHAR(50)  NULL,
        entity_id    TEXT         NULL,
        entity_name  VARCHAR(300) NULL,
        changes      JSONB        NOT NULL DEFAULT '{}',
        metadata     JSONB        NOT NULL DEFAULT '{}',
        ip_address   INET         NULL,
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_project_created ON audit_logs(project_id, created_at);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);`);

    // ══════════════════════════════════════════════════════════════════════════
    // TABLE 12: subscriptions
    // Depends on: users
    // ══════════════════════════════════════════════════════════════════════════

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id                      UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id                 UUID                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan                    billing_plan_enum        NOT NULL DEFAULT 'free',
        status                  subscription_status_enum NOT NULL DEFAULT 'inactive',
        stripe_customer_id      TEXT                     NULL,
        stripe_subscription_id  TEXT                     NULL,
        stripe_price_id         TEXT                     NULL,
        current_period_start    TIMESTAMPTZ              NULL,
        current_period_end      TIMESTAMPTZ              NULL,
        cancel_at_period_end    BOOLEAN                  NOT NULL DEFAULT false,
        trial_end               TIMESTAMPTZ              NULL,
        created_at              TIMESTAMPTZ              NOT NULL DEFAULT now(),
        updated_at              TIMESTAMPTZ              NOT NULL DEFAULT now(),
        UNIQUE(user_id)
      );
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);`);

    // ══════════════════════════════════════════════════════════════════════════
    // TABLE 13: onboarding_sessions
    // No FK dependencies (user_id is a plain UUID column, nullable)
    // ══════════════════════════════════════════════════════════════════════════

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS onboarding_sessions (
        id              UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID                  NULL,
        step            onboarding_step_enum  NOT NULL DEFAULT 'start',
        business_type   business_type_enum    NULL,
        business_goal   business_goal_enum    NULL,
        data            JSONB                 NOT NULL DEFAULT '{}',
        generated_site  JSONB                 NULL,
        published       BOOLEAN               NOT NULL DEFAULT false,
        completed       BOOLEAN               NOT NULL DEFAULT false,
        created_at      TIMESTAMPTZ           NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ           NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user ON onboarding_sessions(user_id);`);
  }

  // ── DOWN ─────────────────────────────────────────────────────────────────────
  // Drop in reverse dependency order.

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS onboarding_sessions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS subscriptions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs;`);
    await queryRunner.query(`DROP TABLE IF EXISTS publish_job_logs;`);
    await queryRunner.query(`DROP TABLE IF EXISTS publish_jobs;`);
    await queryRunner.query(`DROP TABLE IF EXISTS pages;`);
    await queryRunner.query(`DROP TABLE IF EXISTS content_blocks;`);
    await queryRunner.query(`DROP TABLE IF EXISTS templates;`);
    await queryRunner.query(`DROP TABLE IF EXISTS project_members;`);
    await queryRunner.query(`DROP TABLE IF EXISTS projects;`);
    await queryRunner.query(`DROP TABLE IF EXISTS organization_members;`);
    await queryRunner.query(`DROP TABLE IF EXISTS organizations;`);
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);

    await queryRunner.query(`DROP TYPE IF EXISTS business_goal_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS business_type_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS onboarding_step_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS subscription_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS billing_plan_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS publish_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS publish_scope_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS page_type_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS page_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS project_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS project_type_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS org_role_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS system_role_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_status_enum;`);
  }
}
