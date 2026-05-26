import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareField, compareFieldKeys, summarizeFieldComparisons } from './field-compare.js';

test('compareField detects match and mismatch', () => {
  assert.equal(compareField('x', [1, 2], [1, 2]).status, 'match');
  assert.equal(compareField('x', { a: 1 }, { a: 2 }).status, 'mismatch');
});

test('compareFieldKeys preserves declared key order', () => {
  const fields = compareFieldKeys(['a', 'b'], { a: 1, b: 2 }, { a: 1, b: 3 });
  assert.deepEqual(fields.map((f) => f.fieldKey), ['a', 'b']);
  assert.equal(fields[0]!.status, 'match');
  assert.equal(fields[1]!.status, 'mismatch');
});

test('summarizeFieldComparisons aggregates counts', () => {
  const fields = compareFieldKeys(['a', 'b', 'c'], { a: 1 }, { b: 2 });
  const summary = summarizeFieldComparisons(fields);
  assert.equal(summary.baselineOnly, 1);
  assert.equal(summary.targetOnly, 1);
  assert.equal(summary.notCollected, 1);
});
