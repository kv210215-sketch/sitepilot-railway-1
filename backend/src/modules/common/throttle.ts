/**
 * Per-route rate-limit helper.
 *
 * All throttling is driven by a single knob — THROTTLE_LIMIT (the global
 * ThrottlerModule budget, default 100 req / 60s per IP). Sensitive routes take
 * a *fraction* of that budget via `throttle(fraction)` so there is exactly one
 * env var to tune in every environment:
 *   - prod default (THROTTLE_LIMIT=100): login/register ≈ 10, refresh ≈ 30,
 *     forgot/reset ≈ 5, public leads ≈ 20.
 *   - e2e (THROTTLE_LIMIT=100000): the same fractions scale up, so test bursts
 *     never hit the limit without per-test special-casing.
 *
 * limit/ttl are Resolvable functions evaluated per request — NOT read at
 * decorator evaluation. Controllers are imported before main.ts runs
 * dotenv.config() (ES imports are hoisted), so an import-time read would bake
 * in whatever process.env held at startup and ignore values loaded later from
 * .env files via ConfigModule.
 */
const envInt = (key: string, fallback: number): number => {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function throttle(fractionOfGlobal: number) {
  return {
    default: {
      limit: () => Math.max(1, Math.ceil(envInt('THROTTLE_LIMIT', 100) * fractionOfGlobal)),
      ttl: () => envInt('THROTTLE_TTL', 60_000),
    },
  };
}
