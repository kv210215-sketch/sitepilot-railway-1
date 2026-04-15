/**
 * Validates critical environment variables at application startup.
 * Called by ConfigModule.forRoot({ validate }) — throws on missing required vars.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const missing: string[] = [];

  if (!config['JWT_SECRET']) {
    missing.push('JWT_SECRET');
  }
  if (!config['JWT_REFRESH_SECRET']) {
    missing.push('JWT_REFRESH_SECRET');
  }
  if (!config['DATABASE_URL'] && !config['DB_HOST']) {
    missing.push('DATABASE_URL  (or DB_HOST + DB_USER + DB_PASS)');
  }

  if (missing.length > 0) {
    throw new Error(
      `\n[Config] Missing required environment variables:\n` +
      missing.map(v => `  ✗  ${v}`).join('\n') +
      `\n\nCopy backend/.env.example to backend/.env and fill in the values.\n`,
    );
  }

  if (
    config['NODE_ENV'] === 'production' &&
    (config['JWT_SECRET'] === 'change_me_in_production' ||
      config['JWT_REFRESH_SECRET'] === 'change_refresh_me_in_production')
  ) {
    throw new Error(
      `[Config] JWT_SECRET / JWT_REFRESH_SECRET must not use default values in production.`,
    );
  }

  return config;
}
