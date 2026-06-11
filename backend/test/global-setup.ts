/**
 * Jest globalSetup: runs once before the suite.
 * Ensures the LOCAL test database has the schema by running TypeORM migrations.
 * Runs in its own module context, so env defaults are applied here too.
 */
import 'reflect-metadata';

function def(key: string, value: string): void {
  if (!process.env[key]) process.env[key] = value;
}

export default async function globalSetup(): Promise<void> {
  def('NODE_ENV', 'test');
  def('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/sitepilot_test');
  def('DB_SSL', 'false');

  // Import AFTER env is set (data-source.ts reads process.env.DATABASE_URL at import).
  const { AppDataSource } = await import('../src/database/data-source');

  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  await AppDataSource.destroy();
}
