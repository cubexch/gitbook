import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import {
  buildApiOperationBlock,
  createLinkingTaxonomyCatalog,
  deterministicallyLinkMarkdownSegments,
  extractTitle,
  parseSummary,
  rewritePortableTextTopicLinks,
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

test('deterministic linking prefers concept explainers for duplicate titles and supports aliases', () => {
  const taxonomyCatalog = createLinkingTaxonomyCatalog({
    topics: [
      { topicId: 'foundations.blockchain', title: 'Blockchain', pageType: 'taxonomy_hub' },
      { topicId: 'foundations.blockchain.blockchain', title: 'Blockchain', pageType: 'concept_explainer' },
      { topicId: 'protocols.stablecoins.circle', title: 'Circle', pageType: 'concept_explainer' },
    ],
  });

  const [linkedMarkdown] = deterministicallyLinkMarkdownSegments(['Blockchain settles in USDC.'], taxonomyCatalog);

  assert.equal(
    linkedMarkdown,
    '[Blockchain](topic://foundations.blockchain.blockchain) settles in [USDC](topic://protocols.stablecoins.circle).'
  );
});

test('deterministic linking skips headings, code, tables, existing links, protected phrases, and repeat targets', () => {
  const taxonomyCatalog = createLinkingTaxonomyCatalog({
    topics: [{ topicId: 'foundations.blockchain.block', title: 'Block', pageType: 'concept_explainer' }],
  });

  const [linkedMarkdown] = deterministicallyLinkMarkdownSegments(
    [
      [
        '# Block',
        '',
        '`Block`',
        '',
        '| Block |',
        '| --- |',
        '| Block |',
        '',
        '[Block](https://example.com)',
        '',
        'The Block reported it.',
        '',
        'Block then Block again.',
        '',
        '```text',
        'Block',
        '```',
      ].join('\n'),
    ],
    taxonomyCatalog
  );

  assert.equal(
    linkedMarkdown,
    [
      '# Block',
      '',
      '`Block`',
      '',
      '| Block |',
      '| --- |',
      '| Block |',
      '',
      '[Block](https://example.com)',
      '',
      'The Block reported it.',
      '',
      '[Block](topic://foundations.blockchain.block) then Block again.',
      '',
      '```text',
      'Block',
      '```',
    ].join('\n')
  );
});

test('deterministic linking only links the first eligible occurrence across markdown segments', () => {
  const taxonomyCatalog = createLinkingTaxonomyCatalog({
    topics: [{ topicId: 'markets.trading.order_types.limit_order', title: 'Limit Order', pageType: 'concept_explainer' }],
  });

  const linkedSegments = deterministicallyLinkMarkdownSegments(
    ['A Limit Order gives price control.', 'Another Limit Order appears later.'],
    taxonomyCatalog
  );

  assert.equal(
    linkedSegments[0],
    'A [Limit Order](topic://markets.trading.order_types.limit_order) gives price control.'
  );
  assert.equal(linkedSegments[1], 'Another Limit Order appears later.');
});

test('rewritePortableTextTopicLinks converts topic:// link marks into topicLink annotations', () => {
  const rewritten = rewritePortableTextTopicLinks([
    {
      _key: 'block-1',
      _type: 'block',
      markDefs: [
        {
          _key: 'mark-1',
          _type: 'link',
          href: 'topic://protocols.stablecoins.circle',
        },
      ],
      children: [
        {
          _key: 'span-1',
          _type: 'span',
          text: 'USDC',
          marks: ['mark-1'],
        },
      ],
    },
  ]);

  assert.deepEqual(rewritten[0].markDefs, [
    {
      _key: 'mark-1',
      _type: 'topicLink',
      topicId: 'protocols.stablecoins.circle',
    },
  ]);
});
