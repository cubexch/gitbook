import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { htmlToBlocks } from '@portabletext/block-tools';
import { Schema } from '@sanity/schema';
import { JSDOM } from 'jsdom';
import { micromark } from 'micromark';
import {
  applyDeterministicTopicLinksToSegments,
  createLinkingTaxonomyCatalog,
  deterministicallyLinkMarkdownSegments,
} from './api_doc_topic_linking.mjs';
import {
  buildApiOperationBlock,
  buildBodyForSourcePath,
  extractOpenApiLayoutSections,
  extractSegments,
  extractTitle,
  inferOpenApiReferenceFromMarkdown,
  normalizeSourcePath,
  parseSummary,
  rewritePortableTextTopicLinks,
  rewriteMarkdownLinks,
  slugFromSourcePath,
  stripInlineApiOperationSections,
  toSanityLayoutSections,
} from './publish_to_sanity.mjs';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const portableTextBodyType = Schema.compile({
  name: 'cubeApiPublisher',
  types: [
    {
      name: 'doc',
      type: 'object',
      fields: [{ name: 'body', type: 'array', of: [{ type: 'block' }] }],
    },
  ],
})
  .get('doc')
  .fields.find(field => field.name === 'body').type;

function convertMarkdownChunkToBlocks(markdown) {
  if (!markdown.trim()) return [];

  return htmlToBlocks(micromark(markdown), portableTextBodyType, {
    parseHtml: value => new JSDOM(value).window.document,
  });
}

function parseSwaggerSegment(segment) {
  const openingLine = segment.split(/\r?\n/)[0] || '';
  const src = openingLine.match(/src="([^"]+)"/)?.[1];
  const operationPath = openingLine.match(/path="([^"]+)"/)?.[1];
  const method = openingLine.match(/method="([^"]+)"/)?.[1];

  return {
    src: normalizeSourcePath(src),
    operationPath,
    method,
  };
}

function buildPortableTextBodyFromMarkdown(sourcePath) {
  const markdown = fs.readFileSync(path.join(repoRoot, sourcePath), 'utf8');
  const segments = extractSegments(markdown);
  const body = [];

  for (const segment of segments) {
    if (segment.type === 'markdown') {
      body.push(...convertMarkdownChunkToBlocks(segment.value));
      continue;
    }

    if (segment.type === 'swagger') {
      const { src, operationPath, method } = parseSwaggerSegment(segment.value);
      const spec = JSON.parse(fs.readFileSync(path.join(repoRoot, src), 'utf8'));
      body.push(buildApiOperationBlock(path.basename(src), operationPath, method, spec));
    }
  }

  return body;
}

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

test('inferOpenApiReferenceFromMarkdown resolves linked OpenAPI assets', async () => {
  const reference = await inferOpenApiReferenceFromMarkdown(
    'Definitions for requests and responses can be found in the [Market Data OpenAPI Document](/generated/core/md_api_30.json).',
    {
      currentSourcePath: 'market-data/rest-api.md',
      siteUrl: 'https://www.cube.exchange',
      knownDocPaths: new Set(['market-data/rest-api.md']),
      resolveAssetUrl: async input => `asset://${input}`,
    }
  );

  assert.deepEqual(reference, {
    specUrl: 'asset://generated/core/md_api_30.json',
    format: 'auto',
    sourceHref: '/generated/core/md_api_30.json',
  });
});

test('stripInlineApiOperationSections removes swagger-derived endpoint sections from Sanity body output', () => {
  const body = [
    {
      _key: 'intro',
      _type: 'block',
      style: 'normal',
      children: [{ _key: 'intro-text', _type: 'span', text: 'Intro copy', marks: [] }],
    },
    {
      _key: 'public-heading',
      _type: 'block',
      style: 'h2',
      children: [{ _key: 'public-heading-text', _type: 'span', text: 'Endpoints, public', marks: [] }],
    },
    {
      _key: 'public-copy',
      _type: 'block',
      style: 'normal',
      children: [{ _key: 'public-copy-text', _type: 'span', text: 'No auth required.', marks: [] }],
    },
    {
      _key: 'public-operation',
      _type: 'apiOperation',
      method: 'get',
      path: '/markets',
    },
    {
      _key: 'auth-heading',
      _type: 'block',
      style: 'h2',
      children: [
        { _key: 'auth-heading-text', _type: 'span', text: 'Endpoints, authentication required', marks: [] },
      ],
    },
    {
      _key: 'auth-copy',
      _type: 'block',
      style: 'normal',
      children: [{ _key: 'auth-copy-text', _type: 'span', text: 'Signed requests only.', marks: [] }],
    },
    {
      _key: 'auth-operation',
      _type: 'apiOperation',
      method: 'post',
      path: '/users/check',
    },
    {
      _key: 'tail',
      _type: 'block',
      style: 'h2',
      children: [{ _key: 'tail-text', _type: 'span', text: 'Authentication Headers', marks: [] }],
    },
  ];

  assert.deepEqual(stripInlineApiOperationSections(body), [body[0], body[7]]);
});

test('extractOpenApiLayoutSections preserves authored section titles, descriptions, and endpoint order', () => {
  const body = [
    {
      _key: 'intro',
      _type: 'block',
      style: 'normal',
      children: [{ _key: 'intro-text', _type: 'span', text: 'Intro copy', marks: [] }],
    },
    {
      _key: 'public-heading',
      _type: 'block',
      style: 'h2',
      children: [{ _key: 'public-heading-text', _type: 'span', text: 'Endpoints, public', marks: [] }],
    },
    {
      _key: 'public-copy',
      _type: 'block',
      style: 'normal',
      children: [{ _key: 'public-copy-text', _type: 'span', text: 'No auth required.', marks: [] }],
    },
    {
      _key: 'public-copy-2',
      _type: 'block',
      style: 'normal',
      children: [{ _key: 'public-copy-2-text', _type: 'span', text: 'Anonymous clients only.', marks: [] }],
    },
    {
      _key: 'public-operation-1',
      _type: 'apiOperation',
      method: 'get',
      path: '/markets',
    },
    {
      _key: 'public-operation-2',
      _type: 'apiOperation',
      method: 'get',
      path: '/history/klines',
    },
    {
      _key: 'auth-heading',
      _type: 'block',
      style: 'h2',
      children: [
        { _key: 'auth-heading-text', _type: 'span', text: 'Endpoints, authentication required', marks: [] },
      ],
    },
    {
      _key: 'auth-copy',
      _type: 'block',
      style: 'normal',
      children: [{ _key: 'auth-copy-text', _type: 'span', text: 'Signed requests only.', marks: [] }],
    },
    {
      _key: 'auth-operation-1',
      _type: 'apiOperation',
      method: 'get',
      path: '/users/check',
    },
    {
      _key: 'auth-operation-2',
      _type: 'apiOperation',
      method: 'post',
      path: '/users/apikeys',
    },
  ];

  assert.deepEqual(extractOpenApiLayoutSections(body), [
    {
      title: 'Endpoints, public',
      description: 'No auth required.\n\nAnonymous clients only.',
      operations: [
        { method: 'get', path: '/markets' },
        { method: 'get', path: '/history/klines' },
      ],
    },
    {
      title: 'Endpoints, authentication required',
      description: 'Signed requests only.',
      operations: [
        { method: 'get', path: '/users/check' },
        { method: 'post', path: '/users/apikeys' },
      ],
    },
  ]);
});

test('extractOpenApiLayoutSections matches authored section headings in API markdown files', () => {
  const exchangeInfoBody = buildPortableTextBodyFromMarkdown('exchange-info.md');
  const marketDataBody = buildPortableTextBodyFromMarkdown('market-data/rest-api.md');
  const orderEntryBody = buildPortableTextBodyFromMarkdown('order-entry/rest-api.md');
  const exchangeInfoSections = extractOpenApiLayoutSections(exchangeInfoBody);

  assert.deepEqual(
    exchangeInfoSections.map(section => section.title),
    ['Endpoints, public', 'Endpoints, authentication required']
  );
  assert.deepEqual(
    extractOpenApiLayoutSections(marketDataBody).map(section => section.title),
    ['Endpoints, public']
  );
  assert.deepEqual(
    extractOpenApiLayoutSections(orderEntryBody).map(section => section.title),
    ['Endpoints, authentication required']
  );
  assert.deepEqual(
    exchangeInfoSections.find(section => section.title === 'Endpoints, authentication required')?.operations.map(
      operation => `${operation.method}:${operation.path}`
    ),
    [
      'get:/users/check',
      'post:/users/apikeys',
      'delete:/users/apikeys/{api_key}',
      'get:/users/subaccounts',
      'post:/users/subaccounts',
      'get:/users/subaccount/{subaccount_id}',
      'patch:/users/subaccount/{subaccount_id}',
      'get:/users/subaccount/{subaccount_id}/positions',
      'get:/users/subaccount/{subaccount_id}/transactions',
      'get:/users/subaccount/{subaccount_id}/transfers',
      'get:/users/subaccount/{subaccount_id}/deposits',
      'get:/users/subaccount/{subaccount_id}/withdrawals',
      'get:/users/subaccount/{subaccount_id}/orders',
      'get:/users/subaccount/{subaccount_id}/fills',
      'post:/users/fee-estimates',
      'get:/users/address',
      'get:/users/address/settings',
      'post:/users/withdraw',
      'post:/users/transfer',
    ]
  );
});

test('buildBodyForSourcePath preserves trailing apiOperation blocks', async () => {
  const summary = parseSummary(fs.readFileSync(path.join(repoRoot, 'SUMMARY.md'), 'utf8'));
  const knownDocPaths = new Set(summary.map(item => item.sourcePath));
  const specs = new Map(
    ['generated/core/ir_api_30.json', 'generated/core/md_api_30.json', 'generated/core/os_api_30.json'].map(relPath => [
      relPath,
      JSON.parse(fs.readFileSync(path.join(repoRoot, relPath), 'utf8')),
    ])
  );

  const { body: marketDataBody } = await buildBodyForSourcePath('market-data/rest-api.md', {
    markdownRoot: path.join(repoRoot, 'generated/linked-markdown'),
    siteUrl: 'https://www.cube.exchange',
    knownDocPaths,
    specs,
    resolveAssetUrl: async input => `asset://${input}`,
    assetCache: new Map(),
  });

  const { body: orderEntryBody } = await buildBodyForSourcePath('order-entry/rest-api.md', {
    markdownRoot: path.join(repoRoot, 'generated/linked-markdown'),
    siteUrl: 'https://www.cube.exchange',
    knownDocPaths,
    specs,
    resolveAssetUrl: async input => `asset://${input}`,
    assetCache: new Map(),
  });

  assert.deepEqual(
    marketDataBody.filter(block => block?._type === 'apiOperation').map(block => block.path),
    [
      '/book/{market_id}/snapshot',
      '/book/{market_id}/recent-trades',
      '/tickers/snapshot',
      '/parsed/tickers',
      '/parsed/book/{market_symbol}/snapshot',
      '/parsed/book/{market_symbol}/recent-trades',
    ]
  );
  assert.deepEqual(
    orderEntryBody.filter(block => block?._type === 'apiOperation').map(block => `${block.method}:${block.path}`),
    ['get:/orders', 'delete:/orders', 'post:/order', 'delete:/order', 'patch:/order', 'get:/positions']
  );
});

test('toSanityLayoutSections adds stable Sanity metadata to nested layout arrays', () => {
  const input = [
    {
      title: 'Endpoints, authentication required',
      description: 'Signed requests only.',
      operations: [
        { method: 'GET', path: '/users/check' },
        { method: 'post', path: '/users/apikeys' },
      ],
    },
  ];
  const sections = toSanityLayoutSections(input);

  assert.equal(sections.length, 1);
  assert.equal(sections[0]._type, 'object');
  assert.ok(sections[0]._key);
  assert.equal(sections[0].title, 'Endpoints, authentication required');
  assert.equal(sections[0].description, 'Signed requests only.');
  assert.deepEqual(
    sections[0].operations.map(operation => ({
      _type: operation._type,
      hasKey: Boolean(operation._key),
      method: operation.method,
      path: operation.path,
    })),
    [
      { _type: 'object', hasKey: true, method: 'get', path: '/users/check' },
      { _type: 'object', hasKey: true, method: 'post', path: '/users/apikeys' },
    ]
  );
  assert.deepEqual(toSanityLayoutSections(input), sections);
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

test('applyDeterministicTopicLinksToSegments only links markdown segments and preserves swagger blocks', () => {
  const taxonomyCatalog = createLinkingTaxonomyCatalog({
    topics: [{ topicId: 'markets.trading.order_types.limit_order', title: 'Limit Order', pageType: 'concept_explainer' }],
  });

  const linkedSegments = applyDeterministicTopicLinksToSegments(
    extractSegments(
      [
        'A Limit Order controls price.',
        '',
        '{% swagger src="/generated/core/os_api_30.json" path="/order" method="post" %}',
        '{% endswagger %}',
        '',
        'Another Limit Order comes later.',
      ].join('\n')
    ),
    taxonomyCatalog
  );

  assert.equal(
    linkedSegments[0].value,
    'A [Limit Order](topic://markets.trading.order_types.limit_order) controls price.\n'
  );
  assert.equal(linkedSegments[1].type, 'swagger');
  assert.equal(linkedSegments[2].value, '\nAnother Limit Order comes later.');
});
