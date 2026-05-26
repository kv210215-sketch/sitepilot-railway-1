import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HttpJsonLdCollector } from '../collectors/jsonld-collector.js';
import { HttpRuntimeCollector } from '../collectors/runtime-collector.js';
import { HttpSeoCollector } from '../collectors/seo-collector.js';
import type { CollectorContext } from '../collectors/types.js';
import { ParityHttpError } from './errors.js';
import { ParityGetClient } from './get-client.js';
import {
  assertNetworkAllowed,
  createPolicyGuardedFetch,
  isNetworkBlockedByPolicy,
} from './network-policy.js';

function dryRunContext(origin: string | null = 'https://staging.example.com'): CollectorContext {
  return {
    liveMode: false,
    timeoutMs: 5_000,
    endpoint: { label: 'baseline', origin },
  };
}

test('isNetworkBlockedByPolicy is true when liveMode=false', () => {
  assert.equal(isNetworkBlockedByPolicy(false), true);
  assert.equal(isNetworkBlockedByPolicy(true), false);
});

test('assertNetworkAllowed throws NETWORK_DISABLED when liveMode=false', () => {
  assert.throws(() => assertNetworkAllowed(false), (err: unknown) => {
    assert.ok(err instanceof ParityHttpError);
    assert.equal(err.code, 'NETWORK_DISABLED');
    return true;
  });
});

test('policy-guarded fetch never invokes underlying fetch when liveMode=false', async () => {
  let fetchCalls = 0;
  const underlying = async () => {
    fetchCalls += 1;
    return new Response('should-not-run');
  };
  const guarded = createPolicyGuardedFetch(false, underlying as typeof fetch);

  await assert.rejects(() => guarded('https://example.com/'), ParityHttpError);
  assert.equal(fetchCalls, 0);
});

test('ParityGetClient.get does not execute fetch when liveMode=false', async () => {
  let fetchCalls = 0;
  const fetchSpy = async () => {
    fetchCalls += 1;
    return new Response('<html></html>', { status: 200 });
  };
  const client = new ParityGetClient({
    liveMode: false,
    fetchImpl: fetchSpy as typeof fetch,
  });

  assert.equal(client.networkBlockedByPolicy, true);
  await assert.rejects(() => client.get('https://example.com/'), (err: unknown) => {
    assert.ok(err instanceof ParityHttpError);
    assert.equal(err.code, 'NETWORK_DISABLED');
    return true;
  });
  assert.equal(fetchCalls, 0);
});

test('ParityGetClient rejects non-GET methods before fetch', () => {
  assert.throws(
    () => ParityGetClient.assertSafeMethod('POST'),
    (err: unknown) => {
      assert.ok(err instanceof ParityHttpError);
      assert.equal(err.code, 'FORBIDDEN_METHOD');
      return true;
    },
  );
});

test('collectors return planned-only and never call fetch when liveMode=false', async () => {
  let fetchCalls = 0;
  const fetchSpy = async () => {
    fetchCalls += 1;
    return new Response('<html><title>x</title></html>', { status: 200 });
  };
  const client = new ParityGetClient({
    liveMode: false,
    fetchImpl: fetchSpy as typeof fetch,
  });
  const ctx = dryRunContext('https://staging.example.com');
  const collectors = [
    new HttpRuntimeCollector(client),
    new HttpSeoCollector(client),
    new HttpJsonLdCollector(client),
  ];

  for (const collector of collectors) {
    const planned = collector.plan(ctx);
    assert.ok(planned.every((a) => a.executed === false));
    assert.ok(planned.every((a) => a.skipReason?.includes('liveMode=false')));

    const result = await collector.collect(ctx, '/');
    assert.equal(result.source, 'planned-only');
    assert.equal(result.error, 'liveMode=false');
  }

  assert.equal(fetchCalls, 0);
});

test('collectors with origin configured still skip network when liveMode=false', async () => {
  let fetchCalls = 0;
  const client = new ParityGetClient({
    liveMode: false,
    fetchImpl: (async () => {
      fetchCalls += 1;
      return new Response('x');
    }) as typeof fetch,
  });
  const runtime = new HttpRuntimeCollector(client);
  const ctx = dryRunContext('https://staging.example.com');
  const result = await runtime.collect(ctx, '/privacy');
  assert.equal(result.source, 'planned-only');
  assert.equal(fetchCalls, 0);
});
