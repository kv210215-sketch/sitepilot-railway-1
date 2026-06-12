import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Stage 13 — Lead Capture MVP
 *
 * Creates the `leads` table for visitor submissions from published sites.
 *  - lead_status_enum (new/contacted/qualified/converted/archived/spam)
 *  - leads table, FK project_id → projects(id) ON DELETE CASCADE
 *  - indexes: project_id, status, and (project_id, created_at) for dashboard lists
 *
 * Idempotent (IF NOT EXISTS / guarded enum create) to match existing migrations.
 */
export class CreateLeads1714000000004 implements MigrationInterface {
  name = 'CreateLeads1714000000004';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE lead_status_enum AS ENUM
          ('new', 'contacted', 'qualified', 'converted', 'archived', 'spam');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        page_id     UUID NULL,
        name        VARCHAR(200) NOT NULL,
        email       VARCHAR(320) NULL,
        phone       VARCHAR(50)  NULL,
        message     TEXT NULL,
        page_path   VARCHAR(500) NULL,
        source      VARCHAR(50)  NOT NULL DEFAULT 'public_form',
        consent     BOOLEAN NOT NULL DEFAULT false,
        metadata    JSONB NOT NULL DEFAULT '{}',
        status      lead_status_enum NOT NULL DEFAULT 'new',
        ip_address  INET NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at  TIMESTAMPTZ NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_leads_project_id      ON leads(project_id);
      CREATE INDEX IF NOT EXISTS idx_leads_status          ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_project_created ON leads(project_id, created_at);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_leads_project_created;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_leads_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_leads_project_id;`);
    await queryRunner.query(`DROP TABLE IF EXISTS leads;`);
    await queryRunner.query(`DROP TYPE IF EXISTS lead_status_enum;`);
  }
}
