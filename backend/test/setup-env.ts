/**
 * E2E env defaults. Applied (via jest setupFiles) before the app bootstraps.
 * Uses a LOCAL test database only — never staging/production.
 * Override any value with a real env var (e.g. DATABASE_URL) in CI.
 */
function def(key: string, value: string): void {
  if (!process.env[key]) process.env[key] = value;
}

def('NODE_ENV', 'test');
def('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/sitepilot_test');
def('DB_SSL', 'false');
def('DB_SYNC', 'false');
def('DB_LOGGING', 'false');
def('API_PREFIX', 'api/v1');
def('JWT_SECRET', 'e2e_test_jwt_secret_change_me');
def('JWT_REFRESH_SECRET', 'e2e_test_refresh_secret_change_me');
def('PUBLIC_API_ENABLED', 'true');
def('PUBLIC_DEFAULT_PROJECT_SLUG', 'solomiya-energy');
// Keep rate limiting out of the way of fast test bursts.
def('THROTTLE_LIMIT', '100000');
def('THROTTLE_TTL', '60000');
