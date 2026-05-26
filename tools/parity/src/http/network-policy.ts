import { ParityHttpError } from './errors.js';

/** True when outbound HTTP is forbidden by harness policy (liveMode=false). */
export function isNetworkBlockedByPolicy(liveMode: boolean): boolean {
  return !liveMode;
}

/**
 * Runtime assertion: outbound HTTP is only permitted when liveMode=true.
 * Call immediately before any fetch or client.get invocation.
 */
export function assertNetworkAllowed(liveMode: boolean): void {
  if (isNetworkBlockedByPolicy(liveMode)) {
    throw new ParityHttpError(
      'Outbound HTTP blocked by policy: liveMode=false. fetch must not execute.',
      'NETWORK_DISABLED',
    );
  }
}

/**
 * Wraps fetch so the underlying implementation is never invoked when liveMode=false.
 */
export function createPolicyGuardedFetch(
  liveMode: boolean,
  underlyingFetch: typeof fetch = globalThis.fetch.bind(globalThis),
): typeof fetch {
  return async (
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1],
  ): Promise<Response> => {
    assertNetworkAllowed(liveMode);
    return underlyingFetch(input, init);
  };
}
