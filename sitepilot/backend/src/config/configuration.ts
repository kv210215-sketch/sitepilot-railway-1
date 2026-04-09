import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  url: process.env.APP_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
}));

export const dbConfig = registerAs('db', () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const url = new URL(databaseUrl);
    return {
      host:    url.hostname,
      port:    parseInt(url.port || '5432', 10),
      name:    url.pathname.replace(/^\//, ''),
      user:    url.username,
      pass:    decodeURIComponent(url.password),
      ssl:     url.hostname !== 'localhost',
      sync:    process.env.DB_SYNC === 'true',
      logging: process.env.DB_LOGGING === 'true',
    };
  }
  return {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT || '5432', 10),
    name:    process.env.DB_NAME || 'sitepilot',
    user:    process.env.DB_USER || 'postgres',
    pass:    process.env.DB_PASS || '',
    ssl:     process.env.DB_SSL === 'true',
    sync:    process.env.DB_SYNC === 'true',
    logging: process.env.DB_LOGGING === 'true',
  };
});

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'change_me_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'change_refresh_me_in_production',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));

export const throttleConfig = registerAs('throttle', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
}));
