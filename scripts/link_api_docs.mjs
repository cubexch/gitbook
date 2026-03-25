#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
  applyDeterministicTopicLinksToSegments,
  createLinkingTaxonomyCatalog,
  DEFAULT_LINKED_MARKDOWN_DIR,
  DEFAULT_TOPIC_UNIVERSE_PATH,
  expandHomePath,
  loadTopicUniverse,
} from './api_doc_topic_linking.mjs';
import { extractSegments, parseSummary } from './publish_to_sanity.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function printUsage() {
  console.log(`Usage:
  pnpm link:api-docs

Options:
  --output-dir     Output directory for linked markdown (default: ${DEFAULT_LINKED_MARKDOWN_DIR})
  --topic-universe Path to scribe-v2 topic-universe.json (default: ${DEFAULT_TOPIC_UNIVERSE_PATH})
  --help, -h       Show this help
`);
}

function parseArgs(argv) {
  const out = {
    help: false,
    outputDir: DEFAULT_LINKED_MARKDOWN_DIR,
    topicUniversePath: DEFAULT_TOPIC_UNIVERSE_PATH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--help' || arg === '-h') {
      out.help = true;
      continue;
    }
    if (arg === '--output-dir') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for ${arg}`);
      }
      out.outputDir = value;
      index += 1;
      continue;
    }
    if (arg === '--topic-universe') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for ${arg}`);
      }
      out.topicUniversePath = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  return out;
}

function resolveOutputDir(outputDir) {
  const expanded = expandHomePath(outputDir);
  return path.isAbsolute(expanded) ? expanded : path.join(REPO_ROOT, expanded);
}

function writeLinkedMarkdownFiles({ outputDir, summaryEntries, taxonomyCatalog }) {
  fs.mkdirSync(outputDir, { recursive: true });

  const results = [];

  for (const entry of summaryEntries) {
    const sourcePath = path.join(REPO_ROOT, entry.sourcePath);
    const rawMarkdown = fs.readFileSync(sourcePath, 'utf8');
    const linkedSegments = applyDeterministicTopicLinksToSegments(extractSegments(rawMarkdown), taxonomyCatalog);
    const linkedMarkdown = linkedSegments.map(segment => segment.value).join('\n');
    const outputPath = path.join(outputDir, entry.sourcePath);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, linkedMarkdown, 'utf8');

    results.push({
      sourcePath: entry.sourcePath,
      outputPath,
      changed: linkedMarkdown !== rawMarkdown,
    });
  }

  return results;
}

export async function runLinker(options) {
  const summaryPath = path.join(REPO_ROOT, 'SUMMARY.md');
  const summaryEntries = parseSummary(fs.readFileSync(summaryPath, 'utf8'));
  const taxonomyCatalog = createLinkingTaxonomyCatalog(loadTopicUniverse(options.topicUniversePath));
  const outputDir = resolveOutputDir(options.outputDir);
  const results = writeLinkedMarkdownFiles({ outputDir, summaryEntries, taxonomyCatalog });

  return {
    outputDir,
    documentCount: results.length,
    changedCount: results.filter(result => result.changed).length,
    documents: results.map(result => ({
      sourcePath: result.sourcePath,
      changed: result.changed,
      outputPath: result.outputPath,
    })),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const result = await runLinker(options);
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
