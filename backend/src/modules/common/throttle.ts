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
 * Read at module-load (decorator evaluation) — env is already populated by the
 * time controllers are imported, both in production boot and in the e2e
 * setup-env bootstrap.
 */
const GLOBAL_LIMIT = Number(process.env.THROTTLE_LIMIT ?? 100);
const TTL = Number(process.env.THROTTLE_TTL ?? 60_000);

export function throttle(fractionOfGlobal: number) {
  return {
    default: {
      limit: Math.max(1, Math.ceil(GLOBAL_LIMIT * fractionOfGlobal)),
      ttl: TTL,
    },
  };
}
