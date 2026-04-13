import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config({ path: join(__dirname, '../../.env.local'), override: true });

const databaseUrl = process.env.DATABASE_URL;
const parsedDatabaseUrl = databaseUrl ? new URL(databaseUrl) : null;

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...(databaseUrl
    ? {
        url: databaseUrl,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'sitepilot',
      }),
  ssl: parsedDatabaseUrl
    ? parsedDatabaseUrl.hostname !== 'localhost'
      ? { rejectUnauthorized: false }
      : false
    : process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
  entities: [join(__dirname, '../modules/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, './migrations/*{.ts,.js}')],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
});
