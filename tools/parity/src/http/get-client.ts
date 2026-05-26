import { ParityHttpError } from './errors.js';
import {
  assertNetworkAllowed,
  createPolicyGuardedFetch,
  isNetworkBlockedByPolicy,
} from './network-policy.js';

export const PARITY_HARNESS_USER_AGENT = 'SitePilot-Parity-Harness/0.2 (read-only; GET-only)';

const ALLOWED_METHODS = new Set(['GET']);

export interface ParityGetClientOptions {
  liveMode: boolean;
  timeoutMs?: number;
  userAgent?: string;
  /** Injectable fetch for tests; always wrapped by network policy. */
  fetchImpl?: typeof fetch;
}

export interface ParityGetResponse {
  url: string;
  status: number;
  body: string;
  contentType: string | null;
}

/**
 * HTTP GET-only client. Outbound requests are permitted only when `liveMode=true`.
 */
export class ParityGetClient {
  readonly liveMode: boolean;
  readonly networkBlockedByPolicy: boolean;
  readonly timeoutMs: number;
  readonly userAgent: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ParityGetClientOptions) {
    this.liveMode = options.liveMode;
    this.networkBlockedByPolicy = isNetworkBlockedByPolicy(this.liveMode);
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.userAgent = options.userAgent ?? PARITY_HARNESS_USER_AGENT;
    const baseFetch = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.fetchImpl = createPolicyGuardedFetch(this.liveMode, baseFetch);
  }

  assertLiveModeEnabled(): void {
    assertNetworkAllowed(this.liveMode);
  }

  static assertSafeUrl(url: string): URL {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new ParityHttpError(`Invalid URL: ${url}`, 'INVALID_URL');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new ParityHttpError(
        `URL protocol not allowed (http/https only): ${parsed.protocol}`,
        'INVALID_URL',
      );
    }
    return parsed;
  }

  static assertSafeMethod(method: string): void {
    const upper = method.toUpperCase();
    if (!ALLOWED_METHODS.has(upper)) {
      throw new ParityHttpError(
        `HTTP method not allowed (GET only): ${method}`,
        'FORBIDDEN_METHOD',
      );
    }
  }

  async get(url: string): Promise<ParityGetResponse> {
    this.assertLiveModeEnabled();
    ParityGetClient.assertSafeMethod('GET');
    const parsed = ParityGetClient.assertSafeUrl(url);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(parsed.toString(), {
        method: 'GET',
        headers: {
          Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
          'User-Agent': this.userAgent,
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      const body = await response.text();
      return {
        url: parsed.toString(),
        status: response.status,
        body,
        contentType: response.headers.get('content-type'),
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ParityHttpError(`GET timed out after ${this.timeoutMs}ms: ${url}`, 'TIMEOUT');
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new ParityHttpError(`GET failed: ${message}`, 'REQUEST_FAILED');
    } finally {
      clearTimeout(timer);
    }
  }
}
