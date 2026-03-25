import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import {
  buildApiOperationBlock,
  extractTitle,
  parseSummary,
  rewriteMarkdownLinks,
  slugFromSourcePath,
} from './publish_to_sanity.mjs';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

test('slugFromSourcePath maps README and nested pages correctly', () => {
  assert.equal(slugFromSourcePath('README.md'), 'index');
  assert.equal(slugFromSourcePath('perpetual-futures/README.md'), 'perpetual-futures');
  assert.equal(slugFromSourcePath('order-entry/rest-api.md'), 'order-entry/rest-api');
});

test('parseSummary derives grouping and parent slugs from SUMMARY.md', () => {
  const summary = fs.readFileSync(path.join(repoRoot, 'SUMMARY.md'), 'utf8');
  const items = parseSummary(summary);

  const landing = items.find(item => item.sourcePath === 'README.md');
  const perpsRoot = items.find(item => item.sourcePath === 'perpetual-futures/README.md');
  const perpsApi = items.find(item => item.sourcePath === 'perpetual-futures/api.md');
  const mdRest = items.find(item => item.sourcePath === 'market-data/rest-api.md');

  assert.ok(landing);
  assert.equal(landing.slug, 'index');
  assert.equal(landing.isLanding, true);
  assert.ok(perpsRoot);
  assert.equal(perpsRoot.navGroup, 'Perpetual Futures');
  assert.ok(perpsApi);
  assert.equal(perpsApi.parentSlug, 'perpetual-futures');
  assert.ok(mdRest);
  assert.equal(mdRest.navGroup, 'Market Data');
});

test('rewriteMarkdownLinks rewrites local doc links and GitBook absolute links', async () => {
  const knownDocPaths = new Set(['trade-api.md', 'order-entry/websocket-api.md']);
  const markdown =
    '[Trade](https://cubexch.gitbook.io/cube-api/trade-api.md) and [Socket](./websocket-api.md#credentials) and [Hash](#section)';

  const rewritten = await rewriteMarkdownLinks(markdown, {
    currentSourcePath: 'order-entry/rest-api.md',
    siteUrl: 'https://www.cube.exchange',
    knownDocPaths,
    resolveAssetUrl: async input => `asset://${input}`,
  });

  assert.match(rewritten, /\[Trade\]\(https:\/\/www\.cube\.exchange\/cube-api\/trade-api\)/);
  assert.match(rewritten, /\[Socket\]\(https:\/\/www\.cube\.exchange\/cube-api\/order-entry\/websocket-api#credentials\)/);
  assert.match(rewritten, /\[Hash\]\(#section\)/);
});

test('buildApiOperationBlock resolves OpenAPI operations into renderable fields', () => {
  const spec = JSON.parse(fs.readFileSync(path.join(repoRoot, 'generated/core/md_api_30.json'), 'utf8'));
  const block = buildApiOperationBlock('md_api_30.json', '/tickers/snapshot', 'get', spec);

  assert.equal(block._type, 'apiOperation');
  assert.equal(block.path, '/tickers/snapshot');
  assert.equal(block.method, 'get');
  assert.ok(Array.isArray(block.responses));
  assert.ok(block.responses.length > 0);
});

test('extractTitle prefers SUMMARY title and preserves the in-file H1', () => {
  const markdown = `Intro paragraph.\n\n# Implied Price\n\nThe implied price details.`;
  const result = extractTitle(markdown, 'Implied Matching');

  assert.equal(result.title, 'Implied Matching');
  assert.equal(result.markdownWithoutTitle, markdown);
});
