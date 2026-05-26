import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRuntimeBodySummary,
  extractJsonLdScripts,
  extractMetaDescription,
  extractOpenGraph,
  extractTitle,
  summarizeJsonLdTypes,
} from './parse-html.js';
import { loadFixtureManifest, resolveFixturePath, getFixtureById } from '../fixtures/manifest.js';

test('reference-home fixture parses title and SEO meta', async () => {
  const manifest = await loadFixtureManifest();
  const entry = getFixtureById(manifest, 'reference-home');
  const html = await readFile(resolveFixturePath(entry), 'utf8');
  assert.equal(extractTitle(html), 'Fixture — Solomiya Energy');
  assert.equal(extractMetaDescription(html), 'Fixture meta description for parity harness.');
  assert.ok(extractOpenGraph(html)['og:type'] === 'website');
});

test('reference-home fixture extracts JSON-LD types', async () => {
  const manifest = await loadFixtureManifest();
  const entry = getFixtureById(manifest, 'reference-home');
  const html = await readFile(resolveFixturePath(entry), 'utf8');
  const scripts = extractJsonLdScripts(html);
  assert.equal(scripts.length, 1);
  const summary = summarizeJsonLdTypes(scripts[0]!.raw);
  assert.equal(summary.parseOk, true);
  assert.deepEqual(summary.types.sort(), ['FAQPage', 'LocalBusiness']);
});

test('reference-home fixture builds runtime body summary', async () => {
  const manifest = await loadFixtureManifest();
  const entry = getFixtureById(manifest, 'reference-home');
  const html = await readFile(resolveFixturePath(entry), 'utf8');
  const summary = buildRuntimeBodySummary(html);
  assert.equal(summary.sectionIdCount, 2);
  assert.equal(summary.hasLeadForm, true);
  assert.ok(summary.excerpt.includes('Fixture hero'));
});
