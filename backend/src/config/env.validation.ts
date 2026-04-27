/**
 * Validates critical environment variables at application startup.
 * Called by ConfigModule.forRoot({ validate }) — throws on missing required vars.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const isProd = config['NODE_ENV'] === 'production';
  const missing: string[] = [];

  // ── Required in all environments ────────────────────────────────────────────
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

  // ── Production-only guards ───────────────────────────────────────────────────
  if (isProd) {
    const devJwtDefaults = ['dev_jwt_secret_change_me', 'dev_refresh_secret_change_me'];
    if (
      devJwtDefaults.includes(config['JWT_SECRET'] as string) ||
      devJwtDefaults.includes(config['JWT_REFRESH_SECRET'] as string)
    ) {
      throw new Error(
        `[Config] JWT_SECRET / JWT_REFRESH_SECRET must not use development default values in production.`,
      );
    }

    if (config['DB_SYNC'] === 'true') {
      throw new Error(
        `[Config] DB_SYNC must not be "true" in production. ` +
        `Use migrations (npm run migration:run) instead of auto-sync.`,
      );
    }
  }

  return config;
}
