import { registerAs } from '@nestjs/config';

// Express 'trust proxy': hop count ('1' = the single Railway edge proxy),
// 'true'/'false', or a preset/subnet string passed through (e.g. 'loopback').
function parseTrustProxy(raw: string): boolean | number | string {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return /^\d+$/.test(raw) ? parseInt(raw, 10) : raw;
}

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY ?? '1'),
  port: parseInt(process.env.PORT || '3001', 10),
  url: process.env.APP_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  adminName: process.env.ADMIN_NAME ?? 'Super Admin',
}));

export const dbConfig = registerAs('db', () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const url = new URL(databaseUrl);
    return {
      url: databaseUrl,
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
    url: undefined,
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

// NOTE: fallback values are intentional for local dev only.
// validateEnv() blocks these defaults from being used in production.
export const jwtConfig = registerAs('jwt', () => ({
  secret:           process.env.JWT_SECRET           || 'dev_jwt_secret_change_me',
  expiresIn:        process.env.JWT_EXPIRES_IN        || '15m',
  refreshSecret:    process.env.JWT_REFRESH_SECRET    || 'dev_refresh_secret_change_me',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));

export const throttleConfig = registerAs('throttle', () => {
  const ttl = parseInt(process.env.THROTTLE_TTL || '60000', 10);
  const limit = parseInt(process.env.THROTTLE_LIMIT || '100', 10);
  return {
    // A NaN limit would make the Throttler comparison `totalHits > limit`
    // always false — silently disabling rate limiting.
    ttl: Number.isFinite(ttl) && ttl > 0 ? ttl : 60_000,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 100,
  };
});

export const billingConfig = registerAs('billing', () => ({
  stripeSecretKey:    process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  stripePriceStarter: process.env.STRIPE_PRICE_STARTER ?? '',
  stripePricePro:     process.env.STRIPE_PRICE_PRO ?? '',
  stripePriceAgency:  process.env.STRIPE_PRICE_AGENCY ?? '',
}));

export const automationConfig = registerAs('automation', () => ({
  tildaEmail:    process.env.TILDA_EMAIL ?? '',
  tildaPassword: process.env.TILDA_PASSWORD ?? '',
}));

/**
 * Outbound mail (SMTP). Used for lead notifications (Stage 13) and, later,
 * auth verification / password reset. When SMTP_HOST is unset the MailService
 * degrades to logging instead of sending — safe for dev / test / unconfigured
 * staging. `leadsNotifyEmail` is an optional catch-all recipient that always
 * receives lead notifications in addition to the project owner.
 */
export const mailConfig = registerAs('mail', () => ({
  host:     process.env.SMTP_HOST ?? '',
  port:     parseInt(process.env.SMTP_PORT || '587', 10),
  secure:   process.env.SMTP_SECURE === 'true',
  user:     process.env.SMTP_USER ?? '',
  pass:     process.env.SMTP_PASS ?? '',
  from:     process.env.MAIL_FROM || 'SitePilot <no-reply@sitepilot.local>',
  leadsNotifyEmail: process.env.LEADS_NOTIFY_EMAIL ?? '',
}));

/** Public read API (marketing-web). Production stays off unless PUBLIC_API_ENABLED=true. */
export const publicConfig = registerAs('public', () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const explicit = process.env.PUBLIC_API_ENABLED;

  const enabled =
    explicit === 'true' ||
    (explicit !== 'false' && nodeEnv !== 'production');

  return {
    enabled,
    defaultProjectSlug: process.env.PUBLIC_DEFAULT_PROJECT_SLUG || 'solomiya-energy',
  };
});
