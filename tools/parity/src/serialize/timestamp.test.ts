import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTimestamp } from './timestamp.js';

test('normalizeTimestamp strips milliseconds', () => {
  assert.equal(normalizeTimestamp('2026-05-25T19:01:03.355Z'), '2026-05-25T19:01:03Z');
});

test('normalizeTimestamp keeps second precision', () => {
  assert.equal(normalizeTimestamp('2026-05-25T19:01:03Z'), '2026-05-25T19:01:03Z');
});
