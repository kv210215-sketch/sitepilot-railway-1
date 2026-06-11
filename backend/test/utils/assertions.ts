/**
 * Shared assertion + polling helpers for the e2e suite.
 * Pure test utilities — no application source is imported here.
 */

/**
 * Asserts the standard paginated envelope used across the API:
 *   { data: [], total, page, limit, totalPages }
 */
export function assertPaginatedShape(body: unknown): void {
  expect(body).toEqual(
    expect.objectContaining({
      data: expect.any(Array),
      total: expect.any(Number),
      page: expect.any(Number),
      limit: expect.any(Number),
      totalPages: expect.any(Number),
    }),
  );
}

/** Resolves after `ms` milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Bounded polling: repeatedly calls `probe` until it returns a truthy value,
 * or throws once `timeoutMs` elapses. Avoids arbitrary fixed sleeps.
 */
export async function waitFor<T>(
  probe: () => Promise<T | undefined | null | false>,
  {
    timeoutMs = 15000,
    intervalMs = 150,
    label = 'condition',
  }: { timeoutMs?: number; intervalMs?: number; label?: string } = {},
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  // First attempt is immediate; subsequent attempts wait `intervalMs`.
  for (;;) {
    const result = await probe();
    if (result) return result;
    if (Date.now() >= deadline) {
      throw new Error(`waitFor timed out after ${timeoutMs}ms waiting for: ${label}`);
    }
    await sleep(intervalMs);
  }
}
