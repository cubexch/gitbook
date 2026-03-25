#!/usr/bin/env node

import { htmlToBlocks } from '@portabletext/block-tools';
import { createClient } from '@sanity/client';
import { Schema } from '@sanity/schema';
import { DEFAULT_LINKED_MARKDOWN_DIR, INTERNAL_LINK_SCHEME, expandHomePath } from './api_doc_topic_linking.mjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { JSDOM } from 'jsdom';
import { micromark } from 'micromark';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_API_VERSION = '2023-10-13';
const DEFAULT_SITE_URL = 'https://www.cube.exchange';
const DEFAULT_DATASET_TAG = 'apiDocPage';

const FIGURE_BLOCK_RE = /<figure>[\s\S]*?<\/figure>/;
const MARKDOWN_LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;
const DOC_HOSTS = new Set(['cubexch.gitbook.io', 'cube.exchange', 'www.cube.exchange']);

function printUsage() {
  console.log(`Usage:
  pnpm publish:sanity -- --dry-run
  pnpm publish:sanity -- --commit

Options:
  --dry-run       Build payloads and compare sync hashes without writing.
  --commit        Upload assets and upsert documents in Sanity.
  --markdown-root Root directory to read markdown from (default: repo root, or ${DEFAULT_LINKED_MARKDOWN_DIR} for linked artifacts)
  --site-url      Public site URL used for internal links (default: ${DEFAULT_SITE_URL})
  --help, -h      Show this help
`);
}

function parseArgs(argv) {
  const out = {
    dryRun: false,
    commit: false,
    markdownRoot: REPO_ROOT,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--help' || arg === '-h') {
      out.help = true;
      continue;
    }
    if (arg === '--dry-run') {
      out.dryRun = true;
      continue;
    }
    if (arg === '--commit') {
      out.commit = true;
      continue;
    }
    if (arg === '--site-url') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for ${arg}`);
      }
      out.siteUrl = value;
      index += 1;
      continue;
    }
    if (arg === '--markdown-root') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for ${arg}`);
      }
      out.markdownRoot = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  if (!out.dryRun && !out.commit) {
    out.dryRun = true;
  }

  return out;
}

function loadEnvFiles() {
  const appRepoRoot = path.resolve(REPO_ROOT, '../app');
  const candidates = [
    process.env.ENVIRONMENT,
    path.join(REPO_ROOT, '.env.local'),
    path.join(REPO_ROOT, '.env'),
    path.join(appRepoRoot, '.env.local'),
    path.join(appRepoRoot, 'env', '.env.prod'),
    path.join(appRepoRoot, 'env', '.env.dev'),
    path.join(appRepoRoot, '.env'),
  ].filter(Boolean);

  const loaded = [];
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    dotenv.config({ path: filePath, quiet: true });
    loaded.push(filePath);
  }
  return loaded;
}

function createKey() {
  return crypto.randomBytes(6).toString('hex');
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function stripMarkdownExtension(value) {
  return value.replace(/\.md(?=($|[?#]))/i, '');
}

function sanitizeDocumentIdSegment(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '__');
}

export function normalizeSourcePath(value) {
  return value.replace(/^\/+/, '').replace(/\\/g, '/');
}

export function slugFromSourcePath(sourcePath) {
  const normalized = normalizeSourcePath(sourcePath);
  if (normalized === 'README.md') return 'index';
  if (normalized.endsWith('/README.md')) {
    return normalized.slice(0, -'/README.md'.length);
  }
  return stripMarkdownExtension(normalized);
}

function buildPublicPathFromSlug(slug, isLanding = false) {
  if (isLanding || !slug || slug === 'index') return '/cube-api';
  return `/cube-api/${slug}`;
}

function getPointerValue(spec, pointer) {
  const parts = pointer.replace(/^#\//, '').split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'));
  let current = spec;
  for (const part of parts) {
    current = current?.[part];
    if (current == null) return undefined;
  }
  return current;
}

function resolveRefs(value, spec, seen = new Set()) {
  if (Array.isArray(value)) {
    return value.map(item => resolveRefs(item, spec, seen));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if ('$ref' in value && typeof value.$ref === 'string') {
    if (seen.has(value.$ref)) return value;
    const target = getPointerValue(spec, value.$ref);
    if (!target) return value;
    const merged = { ...target, ...value };
    delete merged.$ref;
    return resolveRefs(merged, spec, new Set([...seen, value.$ref]));
  }

  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, resolveRefs(nested, spec, seen)]));
}

function stringifyJson(value) {
  if (value == null) return undefined;
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function firstDefined(...values) {
  return values.find(value => value !== undefined && value !== null && value !== '');
}

function extractExample(value) {
  if (!value || typeof value !== 'object') return undefined;
  if ('example' in value && value.example != null) return value.example;
  if (value.examples && typeof value.examples === 'object') {
    const firstExample = Object.values(value.examples)[0];
    if (firstExample && typeof firstExample === 'object' && 'value' in firstExample) {
      return firstExample.value;
    }
  }
  return undefined;
}

function inferSchemaType(schema) {
  if (!schema || typeof schema !== 'object') return undefined;
  if (schema.type) return schema.type;
  if (schema.enum) return 'enum';
  if (schema.properties) return 'object';
  if (schema.items) return 'array';
  return undefined;
}

function buildOperationContent(content, spec) {
  if (!content || typeof content !== 'object') return [];
  return Object.entries(content).map(([mediaType, media]) => {
    const resolvedMedia = resolveRefs(media, spec);
    const schema = resolveRefs(resolvedMedia?.schema, spec);
    const example = firstDefined(extractExample(resolvedMedia), extractExample(schema));

    return {
      _type: 'apiOperationContent',
      _key: createKey(),
      mediaType,
      schemaJson: stringifyJson(schema),
      exampleJson: stringifyJson(example),
    };
  });
}

export function buildApiOperationBlock(specName, operationPath, method, spec) {
  const pathItem = resolveRefs(spec?.paths?.[operationPath], spec);
  const operation = resolveRefs(pathItem?.[method.toLowerCase()], spec);
  if (!operation) {
    throw new Error(`Could not resolve ${method.toUpperCase()} ${operationPath} in spec ${specName}`);
  }

  const parameters = [...(pathItem?.parameters || []), ...(operation?.parameters || [])].map(param => {
    const resolvedParam = resolveRefs(param, spec);
    const schema = resolveRefs(resolvedParam?.schema, spec);
    const example = firstDefined(resolvedParam?.example, extractExample(resolvedParam), extractExample(schema));

    return {
      _type: 'apiOperationParameter',
      _key: createKey(),
      name: resolvedParam?.name || '',
      in: resolvedParam?.in,
      required: Boolean(resolvedParam?.required),
      description: resolvedParam?.description,
      schemaType: inferSchemaType(schema),
      schemaJson: stringifyJson(schema),
      exampleJson: stringifyJson(example),
    };
  });

  const requestBody = operation?.requestBody
    ? (() => {
        const resolvedRequestBody = resolveRefs(operation.requestBody, spec);
        return {
          _type: 'apiOperationRequestBody',
          required: Boolean(resolvedRequestBody?.required),
          description: resolvedRequestBody?.description,
          content: buildOperationContent(resolvedRequestBody?.content, spec),
        };
      })()
    : undefined;

  const responses = Object.entries(operation?.responses || {}).map(([statusCode, response]) => {
    const resolvedResponse = resolveRefs(response, spec);
    return {
      _type: 'apiOperationResponse',
      _key: createKey(),
      statusCode,
      description: resolvedResponse?.description,
      content: buildOperationContent(resolvedResponse?.content, spec),
    };
  });

  return {
    _type: 'apiOperation',
    _key: createKey(),
    specName,
    path: operationPath,
    method: method.toLowerCase(),
    summary: operation?.summary,
    description: operation?.description,
    parameters,
    requestBody,
    responses,
  };
}

function createPortableTextSchema() {
  const schema = Schema.compile({
    name: 'cubeApiPublisher',
    types: [
      {
        type: 'object',
        name: 'doc',
        fields: [
          {
            name: 'body',
            type: 'array',
            of: [{ type: 'block' }],
          },
        ],
      },
    ],
  });

  return schema.get('doc').fields.find(field => field.name === 'body').type;
}

const portableTextBodyType = createPortableTextSchema();

function getBlockText(block) {
  return Array.isArray(block?.children) ? block.children.map(child => child?.text || '').join('') : '';
}

function isMarkdownTableSeparator(cells) {
  return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
}

function parseMarkdownTables(markdown) {
  const lines = markdown.split(/\r?\n/);
  const tables = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim();
    if (!line?.startsWith('|')) continue;

    const rawLines = [];
    let cursor = index;
    while (cursor < lines.length && lines[cursor].trim().startsWith('|')) {
      rawLines.push(lines[cursor].trim());
      cursor += 1;
    }

    if (rawLines.length < 2) continue;

    let rows = rawLines.map(rawLine =>
      rawLine
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map(cell => cell.trim().replace(/^\*\*(.*)\*\*$/, '$1'))
    );

    if (!isMarkdownTableSeparator(rows[1])) continue;

    rows = [rows[0], ...rows.slice(2)];
    tables.push({
      headerCells: rows[0],
      block: {
        _type: 'table',
        _key: createKey(),
        rows: rows.map(cells => ({
          _type: 'tableRow',
          _key: createKey(),
          cells,
        })),
      },
    });

    index = cursor - 1;
  }

  return tables;
}

function convertMarkdownChunkToBlocks(markdown) {
  if (!markdown.trim()) return [];

  const html = micromark(markdown);
  const blocks = htmlToBlocks(html, portableTextBodyType, {
    parseHtml: value => new JSDOM(value).window.document,
  });
  const tables = parseMarkdownTables(markdown);
  let tableIndex = 0;

  const normalizedBlocks = blocks.map(block => {
    if (tableIndex >= tables.length) return block;
    const table = tables[tableIndex];
    const text = getBlockText(block);
    const looksLikeTable = text.includes('|') && table.headerCells.every(cell => cell && text.includes(cell));
    if (!looksLikeTable) return block;
    tableIndex += 1;
    return table.block;
  });

  return rewritePortableTextTopicLinks(normalizedBlocks);
}

export function rewritePortableTextTopicLinks(value) {
  if (!Array.isArray(value)) return value;

  return value.map(block => {
    if (!Array.isArray(block?.markDefs)) {
      return block;
    }

    let changed = false;
    const markDefs = block.markDefs.map(markDef => {
      if (markDef?._type !== 'link' || typeof markDef.href !== 'string' || !markDef.href.startsWith(INTERNAL_LINK_SCHEME)) {
        return markDef;
      }

      changed = true;
      const { href, ...rest } = markDef;
      return {
        ...rest,
        _type: 'topicLink',
        topicId: href.slice(INTERNAL_LINK_SCHEME.length),
      };
    });

    return changed ? { ...block, markDefs } : block;
  });
}

function blockIsEmpty(block) {
  if (!block || typeof block !== 'object') return true;
  if (block._type !== 'block') return false;
  if (!Array.isArray(block.children)) return true;
  return block.children.every(child => typeof child?.text !== 'string' || child.text.trim() === '');
}

function trimPortableTextValue(value) {
  if (!Array.isArray(value)) return value;
  const start = value.findIndex(block => !blockIsEmpty(block));
  if (start === -1) return [];
  let end = value.length;
  while (end > start && blockIsEmpty(value[end - 1])) end -= 1;
  return value.slice(start, end);
}

function isHeadingBlock(block) {
  return (
    block &&
    typeof block === 'object' &&
    block._type === 'block' &&
    typeof block.style === 'string' &&
    /^h[1-6]$/.test(block.style)
  );
}

function isNormalBlock(block) {
  return block && typeof block === 'object' && block._type === 'block' && block.style === 'normal';
}

function isApiOperationBlock(block) {
  return block && typeof block === 'object' && block._type === 'apiOperation';
}

export function stripInlineApiOperationSections(body) {
  if (!Array.isArray(body)) return body;

  const filteredBody = [];

  for (let index = 0; index < body.length; index += 1) {
    const block = body[index];

    if (isHeadingBlock(block)) {
      let cursor = index + 1;

      while (cursor < body.length && isNormalBlock(body[cursor])) {
        cursor += 1;
      }

      let operationCursor = cursor;
      while (operationCursor < body.length && isApiOperationBlock(body[operationCursor])) {
        operationCursor += 1;
      }

      if (operationCursor > cursor) {
        index = operationCursor - 1;
        continue;
      }
    }

    if (isApiOperationBlock(block)) {
      continue;
    }

    filteredBody.push(block);
  }

  return filteredBody;
}

export function extractOpenApiLayoutSections(body) {
  if (!Array.isArray(body)) return [];

  const layoutSections = [];

  for (let index = 0; index < body.length; index += 1) {
    const block = body[index];

    if (isHeadingBlock(block)) {
      let cursor = index + 1;
      const descriptionParts = [];

      while (cursor < body.length && isNormalBlock(body[cursor])) {
        const text = normalizeText(getBlockText(body[cursor]));
        if (text) {
          descriptionParts.push(text);
        }
        cursor += 1;
      }

      const operations = [];
      while (cursor < body.length && isApiOperationBlock(body[cursor])) {
        const operation = body[cursor];
        if (typeof operation?.method === 'string' && typeof operation?.path === 'string') {
          operations.push({
            method: operation.method.toLowerCase(),
            path: operation.path,
          });
        }
        cursor += 1;
      }

      if (operations.length) {
        const title = normalizeText(getBlockText(block)) || 'General';
        layoutSections.push({
          title,
          description: descriptionParts.length ? descriptionParts.join('\n\n') : undefined,
          operations,
        });
        index = cursor - 1;
      }
    }
  }

  return layoutSections;
}

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function createDeterministicArrayKey(input) {
  return sha256(input).slice(0, 24);
}

export function toSanityLayoutSections(layoutSections) {
  if (!Array.isArray(layoutSections)) return [];

  return layoutSections.map(section => {
    const normalizedTitle = normalizeText(section?.title || '');
    const normalizedDescription = normalizeText(section?.description || '');
    const operations = Array.isArray(section?.operations)
      ? section.operations.map(operation => ({
          _type: 'object',
          _key: createDeterministicArrayKey(
            `layout-operation:${normalizedTitle}:${String(operation?.method || '').toLowerCase()}:${String(operation?.path || '')}`
          ),
          method: String(operation?.method || '').toLowerCase(),
          path: String(operation?.path || ''),
        }))
      : [];

    return {
      _type: 'object',
      _key: createDeterministicArrayKey(
        `layout-section:${normalizedTitle}:${normalizedDescription}:${operations.map(operation => `${operation.method}:${operation.path}`).join('|')}`
      ),
      title: normalizedTitle,
      ...(normalizedDescription ? { description: normalizedDescription } : {}),
      operations,
    };
  });
}

export function extractTitle(markdown, fallbackTitle) {
  const match = markdown.match(/^#\s+(.+?)\s*$/m);
  if (!match) {
    return { title: fallbackTitle, markdownWithoutTitle: markdown };
  }

  const title = fallbackTitle || normalizeText(match[1]);

  return {
    title,
    markdownWithoutTitle: markdown,
  };
}

function extractDescription(markdown) {
  const sanitized = markdown
    .replace(/\{%[\s\S]*?%\}/g, ' ')
    .replace(FIGURE_BLOCK_RE, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#+\s+/gm, '')
    .replace(/^\|.*$/gm, ' ')
    .replace(/\n{2,}/g, '\n\n');

  const paragraphs = sanitized
    .split(/\n\s*\n/)
    .map(paragraph => normalizeText(paragraph))
    .filter(Boolean);

  return paragraphs[0]?.slice(0, 240);
}

function splitHref(input) {
  const match = input.match(/^([^?#]*)(.*)$/);
  return {
    pathname: match?.[1] || input,
    suffix: match?.[2] || '',
  };
}

function asAbsoluteSiteUrl(siteUrl, pathname) {
  return new URL(pathname, siteUrl).toString();
}

async function rewriteHref({ href, currentSourcePath, siteUrl, knownDocPaths, resolveAssetUrl }) {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#')) return trimmed;

  const { pathname, suffix } = splitHref(trimmed);

  if (/^[a-z][a-z\d+\-.]*:/i.test(trimmed)) {
    const url = new URL(trimmed);
    if (!DOC_HOSTS.has(url.hostname)) return trimmed;

    if (url.pathname.startsWith('/cube-api')) {
      return asAbsoluteSiteUrl(siteUrl, stripMarkdownExtension(url.pathname)) + url.search + url.hash;
    }

    const normalizedPath = normalizeSourcePath(url.pathname);
    const maybeDocPath = normalizedPath.replace(/^cube-api\//, '');
    if (knownDocPaths.has(maybeDocPath)) {
      return asAbsoluteSiteUrl(siteUrl, buildPublicPathFromSlug(slugFromSourcePath(maybeDocPath), maybeDocPath === 'README.md')) + url.search + url.hash;
    }

    return trimmed;
  }

  const repoRelativePath = pathname.startsWith('/')
    ? normalizeSourcePath(pathname)
    : normalizeSourcePath(path.join(path.dirname(currentSourcePath), pathname));

  if (knownDocPaths.has(repoRelativePath)) {
    return asAbsoluteSiteUrl(
      siteUrl,
      buildPublicPathFromSlug(slugFromSourcePath(repoRelativePath), repoRelativePath === 'README.md')
    ) + suffix;
  }

  if (repoRelativePath.startsWith('generated/core/') || repoRelativePath.startsWith('images/')) {
    return (await resolveAssetUrl(repoRelativePath)) + suffix;
  }

  return trimmed;
}

export async function rewriteMarkdownLinks(markdown, context) {
  let cursor = 0;
  let result = '';

  for (const match of markdown.matchAll(MARKDOWN_LINK_RE)) {
    const fullMatch = match[0];
    const label = match[1];
    const href = match[2];
    const index = match.index ?? 0;

    result += markdown.slice(cursor, index);
    const rewrittenHref = await rewriteHref({ ...context, href });
    result += `[${label}](${rewrittenHref})`;
    cursor = index + fullMatch.length;
  }

  result += markdown.slice(cursor);
  return result;
}

export async function inferOpenApiReferenceFromMarkdown(markdown, context) {
  for (const match of markdown.matchAll(MARKDOWN_LINK_RE)) {
    const label = normalizeText(match[1] || '');
    const href = (match[2] || '').trim();
    if (!href) continue;

    const haystack = `${label} ${href}`.toLowerCase();
    const looksLikeOpenApiReference =
      haystack.includes('openapi') ||
      haystack.includes('swagger') ||
      /\.(json|ya?ml)(?:$|[?#])/.test(href.toLowerCase());

    if (!looksLikeOpenApiReference) continue;

    const resolvedHref = await rewriteHref({ ...context, href });

    return {
      specUrl: resolvedHref,
      format: 'auto',
      sourceHref: href,
    };
  }

  return null;
}

export function extractSegments(markdown) {
  const lines = markdown.split(/\r?\n/);
  const segments = [];
  let textBuffer = [];

  const flushText = () => {
    if (textBuffer.length === 0) return;
    segments.push({ type: 'markdown', value: textBuffer.join('\n') });
    textBuffer = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.includes('{% swagger')) {
      flushText();
      const blockLines = [line];
      while (index + 1 < lines.length && !lines[index + 1].includes('{% endswagger %}')) {
        index += 1;
        blockLines.push(lines[index]);
      }
      if (index + 1 < lines.length) {
        index += 1;
        blockLines.push(lines[index]);
      }
      segments.push({ type: 'swagger', value: blockLines.join('\n') });
      continue;
    }

    if (line.includes('<figure>')) {
      flushText();
      const blockLines = [line];
      while (index + 1 < lines.length && !lines[index + 1].includes('</figure>')) {
        index += 1;
        blockLines.push(lines[index]);
      }
      if (index + 1 < lines.length) {
        index += 1;
        blockLines.push(lines[index]);
      }
      segments.push({ type: 'figure', value: blockLines.join('\n') });
      continue;
    }

    textBuffer.push(line);
  }

  flushText();
  return segments;
}

function parseSwaggerSegment(segment) {
  const openingLine = segment.split(/\r?\n/)[0] || '';
  const src = openingLine.match(/src="([^"]+)"/)?.[1];
  const operationPath = openingLine.match(/path="([^"]+)"/)?.[1];
  const method = openingLine.match(/method="([^"]+)"/)?.[1];

  if (!src || !operationPath || !method) {
    throw new Error(`Invalid swagger block: ${openingLine}`);
  }

  return {
    src: normalizeSourcePath(src),
    operationPath,
    method,
  };
}

function parseFigureSegment(segment) {
  const src = segment.match(/src="([^"]+)"/)?.[1];
  const alt = segment.match(/alt="([^"]*)"/)?.[1];
  const caption = segment.match(/<figcaption>([\s\S]*?)<\/figcaption>/)?.[1];

  if (!src) {
    throw new Error(`Invalid figure block: ${segment}`);
  }

  return {
    src: normalizeSourcePath(src),
    alt: alt ? normalizeText(alt) : undefined,
    caption: caption ? normalizeText(caption) : undefined,
  };
}

function getMimeType(filename) {
  if (filename.endsWith('.json')) return 'application/json';
  if (filename.endsWith('.svg')) return 'image/svg+xml';
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

async function createAssetResolver({ client, commit, assetCache }) {
  return async function resolveAssetUrl(repoRelativePath) {
    const normalizedPath = normalizeSourcePath(repoRelativePath);
    if (assetCache.has(normalizedPath)) {
      return assetCache.get(normalizedPath).url;
    }

    const absolutePath = path.join(REPO_ROOT, normalizedPath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Asset not found: ${absolutePath}`);
    }

    if (!commit) {
      const placeholder = { url: `asset://${normalizedPath}` };
      assetCache.set(normalizedPath, placeholder);
      return placeholder.url;
    }

    const mimeType = getMimeType(normalizedPath);
    const assetType = normalizedPath.startsWith('images/') ? 'image' : 'file';
    const uploaded = await client.assets.upload(assetType, fs.createReadStream(absolutePath), {
      filename: path.basename(normalizedPath),
      contentType: mimeType,
    });

    const assetRecord = { _id: uploaded._id, url: uploaded.url };
    assetCache.set(normalizedPath, assetRecord);
    return assetRecord.url;
  };
}

async function createImageBlock(repoRelativePath, alt, resolveAssetUrl, assetCache) {
  const normalizedPath = normalizeSourcePath(repoRelativePath);
  const url = await resolveAssetUrl(normalizedPath);
  const asset = assetCache.get(normalizedPath);
  if (!asset?._id) {
    return {
      _type: 'block',
      _key: createKey(),
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: createKey(),
          text: alt || url,
          marks: ['strong'],
        },
      ],
    };
  }

  return {
    _type: 'image',
    _key: createKey(),
    asset: {
      _type: 'reference',
      _ref: asset._id,
    },
    alt: alt || path.basename(normalizedPath),
  };
}

function createDocumentId(slug) {
  return `apiDocPage.cube-api.${sanitizeDocumentIdSegment(slug || 'index')}`;
}

export function parseSummary(summaryMarkdown) {
  const items = [];
  let currentGroup = null;
  let currentGroupOrder = -1;
  let currentNavOrder = 0;
  const stack = [];

  for (const rawLine of summaryMarkdown.split(/\r?\n/)) {
    const match = rawLine.match(/^(\s*)\*\s+(.*)$/);
    if (!match) continue;

    const indent = Math.floor((match[1] || '').length / 2);
    const content = match[2].trim();
    const linkMatch = content.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

    if (!linkMatch) {
      if (indent === 0) {
        currentGroupOrder += 1;
        currentGroup = normalizeText(content);
        currentNavOrder = 0;
        stack.length = 0;
      }
      continue;
    }

    const title = normalizeText(linkMatch[1]);
    const sourcePath = normalizeSourcePath(linkMatch[2]);
    const slug = slugFromSourcePath(sourcePath);
    const isLanding = sourcePath === 'README.md';

    if (indent === 0) {
      currentGroupOrder += 1;
      currentGroup = title;
      currentNavOrder = 0;
      stack.length = 0;
    }

    currentNavOrder += 1;
    const parent = indent > 0 ? stack[indent - 1] : undefined;

    const item = {
      title,
      sourcePath,
      slug,
      isLanding,
      navGroup: currentGroup || 'Documentation',
      navGroupOrder: currentGroupOrder,
      navOrder: currentNavOrder,
      parentSlug: parent?.slug,
    };

    items.push(item);
    stack[indent] = item;
    stack.length = indent + 1;
  }

  return items;
}

function loadOpenApiSpecs() {
  const specs = new Map();
  for (const relPath of ['generated/core/ir_api_30.json', 'generated/core/md_api_30.json', 'generated/core/os_api_30.json']) {
    const absolutePath = path.join(REPO_ROOT, relPath);
    if (!fs.existsSync(absolutePath)) continue;
    specs.set(relPath, JSON.parse(fs.readFileSync(absolutePath, 'utf8')));
  }
  return specs;
}

async function buildBody(markdown, context) {
  const rewrittenMarkdown = await rewriteMarkdownLinks(markdown, {
    ...context,
    currentSourcePath: context.sourcePath,
  });
  const segments = extractSegments(rewrittenMarkdown);
  const body = [];
  const hashSegments = [];

  for (const segment of segments) {
    if (segment.type === 'markdown') {
      const blocks = convertMarkdownChunkToBlocks(segment.value);
      body.push(...blocks);
      hashSegments.push(segment.value);
      continue;
    }

    if (segment.type === 'swagger') {
      const { src, operationPath, method } = parseSwaggerSegment(segment.value);
      const spec = context.specs.get(src);
      if (!spec) {
        throw new Error(`Missing OpenAPI spec ${src} referenced from ${context.sourcePath}`);
      }
      const operationBlock = buildApiOperationBlock(path.basename(src), operationPath, method, spec);
      body.push(operationBlock);
      hashSegments.push(JSON.stringify(operationBlock));
      continue;
    }

    if (segment.type === 'figure') {
      const { src, alt, caption } = parseFigureSegment(segment.value);
      const imageBlock = await createImageBlock(src, alt, context.resolveAssetUrl, context.assetCache);
      body.push(imageBlock);
      hashSegments.push(`${src}:${alt || ''}:${caption || ''}`);
      if (caption) {
        body.push(...convertMarkdownChunkToBlocks(`*${caption}*`));
      }
    }
  }

  return {
    body: trimPortableTextValue(body),
    normalizedHashInput: hashSegments.join('\n---\n'),
  };
}

export async function buildBodyForSourcePath(sourcePath, context) {
  const preferredPath = path.join(context.markdownRoot, sourcePath);
  const fallbackPath = path.join(REPO_ROOT, sourcePath);
  const absolutePath = fs.existsSync(preferredPath) ? preferredPath : fallbackPath;
  const rawMarkdown = fs.readFileSync(absolutePath, 'utf8');
  const { markdownWithoutTitle } = extractTitle(rawMarkdown);

  return buildBody(markdownWithoutTitle, {
    ...context,
    sourcePath,
  });
}

async function buildDocument(summaryEntry, context) {
  const preferredPath = path.join(context.markdownRoot, summaryEntry.sourcePath);
  const fallbackPath = path.join(REPO_ROOT, summaryEntry.sourcePath);
  const absolutePath = fs.existsSync(preferredPath) ? preferredPath : fallbackPath;
  const rawMarkdown = fs.readFileSync(absolutePath, 'utf8');
  const { title, markdownWithoutTitle } = extractTitle(rawMarkdown, summaryEntry.title);
  const description = extractDescription(markdownWithoutTitle);
  const openApiReference = await inferOpenApiReferenceFromMarkdown(markdownWithoutTitle, {
    currentSourcePath: summaryEntry.sourcePath,
    siteUrl: context.siteUrl,
    knownDocPaths: context.knownDocPaths,
    resolveAssetUrl: context.resolveAssetUrl,
  });
  const { body, normalizedHashInput } = await buildBody(markdownWithoutTitle, {
    ...context,
    sourcePath: summaryEntry.sourcePath,
  });
  const layoutSections = openApiReference ? extractOpenApiLayoutSections(body) : [];
  const sanityLayoutSections = toSanityLayoutSections(layoutSections);
  const publishedBody = openApiReference ? stripInlineApiOperationSections(body) : body;

  const syncHash = sha256(
    JSON.stringify({
      title,
      description,
      sourcePath: summaryEntry.sourcePath,
      navGroup: summaryEntry.navGroup,
      navGroupOrder: summaryEntry.navGroupOrder,
      navOrder: summaryEntry.navOrder,
      parentSlug: summaryEntry.parentSlug || null,
      isLanding: summaryEntry.isLanding,
      openApiReference: openApiReference
        ? {
            sourceHref: openApiReference.sourceHref,
            format: openApiReference.format,
            layoutSections,
          }
        : null,
      body: normalizedHashInput,
    })
  );

  return {
    _id: createDocumentId(summaryEntry.slug),
    _type: DEFAULT_DATASET_TAG,
    title,
    slug: {
      _type: 'slug',
      current: summaryEntry.slug,
    },
    description,
    seoTitle: `${title} | Cube API`,
    seoDescription: description,
    body: publishedBody,
    ...(openApiReference
      ? {
          openApiReference: {
            specUrl: openApiReference.specUrl,
            format: openApiReference.format,
            layoutSections: sanityLayoutSections,
          },
        }
      : {}),
    sourcePath: summaryEntry.sourcePath,
    navGroup: summaryEntry.navGroup,
    navGroupOrder: summaryEntry.navGroupOrder,
    navOrder: summaryEntry.navOrder,
    parentSlug: summaryEntry.parentSlug,
    isLanding: summaryEntry.isLanding,
    syncHash,
  };
}

export async function buildSanityLayoutSectionsForSourcePath(sourcePath, context) {
  const preferredPath = path.join(context.markdownRoot, sourcePath);
  const fallbackPath = path.join(REPO_ROOT, sourcePath);
  const absolutePath = fs.existsSync(preferredPath) ? preferredPath : fallbackPath;
  const rawMarkdown = fs.readFileSync(absolutePath, 'utf8');
  const { markdownWithoutTitle } = extractTitle(rawMarkdown);
  const { body } = await buildBody(markdownWithoutTitle, {
    ...context,
    sourcePath,
    resolveAssetUrl: async repoRelativePath => `asset://${normalizeSourcePath(repoRelativePath)}`,
  });

  return toSanityLayoutSections(extractOpenApiLayoutSections(body));
}

async function fetchExistingHashes(client) {
  const existing = await client.fetch(`*[_type == $type]{sourcePath, syncHash}`, { type: DEFAULT_DATASET_TAG });
  return new Map(existing.map(entry => [entry.sourcePath, entry.syncHash]));
}

export async function runPublisher(options) {
  loadEnvFiles();

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_WRITE_TOKEN;
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || DEFAULT_API_VERSION;

  if (!projectId || !dataset) {
    throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET.');
  }

  if (options.commit && !token) {
    throw new Error('Missing SANITY_API_WRITE_TOKEN.');
  }

  const client = createClient({
    projectId,
    dataset,
    ...(token ? { token } : {}),
    apiVersion,
    useCdn: false,
  });

  const summaryPath = path.join(REPO_ROOT, 'SUMMARY.md');
  const summary = parseSummary(fs.readFileSync(summaryPath, 'utf8'));
  const knownDocPaths = new Set(summary.map(item => item.sourcePath));
  const specs = loadOpenApiSpecs();
  const assetCache = new Map();
  const resolveAssetUrl = await createAssetResolver({ client, commit: options.commit, assetCache });
  const siteUrl = options.siteUrl || DEFAULT_SITE_URL;
  const markdownRoot = (() => {
    const expanded = expandHomePath(options.markdownRoot || REPO_ROOT);
    return path.isAbsolute(expanded) ? expanded : path.join(REPO_ROOT, expanded);
  })();

  const documents = [];
  for (const entry of summary) {
    documents.push(
      await buildDocument(entry, {
        markdownRoot,
        siteUrl,
        knownDocPaths,
        specs,
        resolveAssetUrl,
        assetCache,
      })
    );
  }

  let existingHashes = new Map();
  try {
    existingHashes = await fetchExistingHashes(client);
  } catch (error) {
    if (options.commit) throw error;
  }
  const summaryOutput = documents.map(document => ({
    sourcePath: document.sourcePath,
    slug: document.slug.current,
    title: document.title,
    changed: existingHashes.get(document.sourcePath) !== document.syncHash,
    bodyBlocks: Array.isArray(document.body) ? document.body.length : 0,
  }));

  if (options.commit) {
    for (const document of documents) {
      await client.createOrReplace(document);
      if (document.openApiReference) {
        const layoutSections = await buildSanityLayoutSectionsForSourcePath(document.sourcePath, {
          markdownRoot,
          siteUrl,
          knownDocPaths,
          specs,
          resolveAssetUrl,
          assetCache,
        });
        await client.patch(document._id).set({ 'openApiReference.layoutSections': layoutSections }).commit();
      }
    }
  }

  return {
    mode: options.commit ? 'commit' : 'dry-run',
    documentCount: documents.length,
    changedCount: summaryOutput.filter(item => item.changed).length,
    uploadedAssetCount: Array.from(assetCache.values()).filter(asset => asset._id).length,
    documents: summaryOutput,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const result = await runPublisher(options);
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
