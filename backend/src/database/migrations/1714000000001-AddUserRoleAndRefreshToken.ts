import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoleAndRefreshToken1714000000001 implements MigrationInterface {
  name = 'AddUserRoleAndRefreshToken1714000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Create system_role enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE system_role_enum AS ENUM ('super_admin', 'admin', 'user');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add role column (NOT NULL with default, backfills existing rows as 'user')
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS role system_role_enum NOT NULL DEFAULT 'user',
        ADD COLUMN IF NOT EXISTS refresh_token_hash VARCHAR(255) NULL;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS refresh_token_hash,
        DROP COLUMN IF EXISTS role;
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS system_role_enum;`);
  }
}
