import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalJsonString, canonicalize } from './canonical-json.js';

test('canonicalize sorts object keys', () => {
  const input = { z: 1, a: { c: 2, b: 1 } };
  const out = canonicalize(input);
  assert.deepEqual(Object.keys(out), ['a', 'z']);
  assert.deepEqual(Object.keys((out as { a: Record<string, unknown> }).a), ['b', 'c']);
});

test('canonicalJsonString is stable across key order', () => {
  const a = canonicalJsonString({ b: 2, a: 1 });
  const b = canonicalJsonString({ a: 1, b: 2 });
  assert.equal(a, b);
  assert.equal(a, '{"a":1,"b":2}');
});

test('canonicalize sorts arrays by canonical element', () => {
  const out = canonicalize({ items: [{ id: 'b' }, { id: 'a' }] });
  const items = (out as { items: { id: string }[] }).items;
  assert.deepEqual(items.map((i) => i.id), ['a', 'b']);
});
