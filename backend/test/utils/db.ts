import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Truncates all entity tables (keeps the `migrations` table) so each test
 * starts from a clean slate. LOCAL test DB only.
 */
export async function resetDb(app: INestApplication): Promise<void> {
  const ds = app.get(DataSource);
  const tables = ds.entityMetadatas
    .map((m) => `"${m.tableName}"`)
    .join(', ');
  if (!tables) return;
  await ds.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
}
