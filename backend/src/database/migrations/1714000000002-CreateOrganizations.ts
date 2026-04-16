import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizations1714000000002 implements MigrationInterface {
  name = 'CreateOrganizations1714000000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create org_role_enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE org_role_enum AS ENUM ('owner', 'admin', 'member');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. organizations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(200) NOT NULL UNIQUE,
        description TEXT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        settings JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ NULL
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);`);

    // 3. organization_members table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS organization_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role org_role_enum NOT NULL DEFAULT 'member',
        is_active BOOLEAN NOT NULL DEFAULT true,
        invited_by_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(organization_id, user_id)
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);`);

    // 4. Add organization_id to projects (nullable for safe migration)
    await queryRunner.query(`
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS organization_id UUID NULL REFERENCES organizations(id) ON DELETE RESTRICT;
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE projects DROP COLUMN IF EXISTS organization_id;`);
    await queryRunner.query(`DROP TABLE IF EXISTS organization_members;`);
    await queryRunner.query(`DROP TABLE IF EXISTS organizations;`);
    await queryRunner.query(`DROP TYPE IF EXISTS org_role_enum;`);
  }
}
