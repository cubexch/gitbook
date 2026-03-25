#!/usr/bin/env node

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_LINKED_MARKDOWN_DIR, DEFAULT_TOPIC_UNIVERSE_PATH, expandHomePath } from './api_doc_topic_linking.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function printUsage() {
  console.log(`Usage:
  pnpm publish:sanity:linked -- --dry-run

Options:
  --topic-universe Path to scribe-v2 topic-universe.json for the linking step (default: ${DEFAULT_TOPIC_UNIVERSE_PATH})
  --help, -h       Show this help

All other args are forwarded to publish:sanity together with:
  --markdown-root ${DEFAULT_LINKED_MARKDOWN_DIR}
`);
}

function parseArgs(argv) {
  const publisherArgs = [];
  let topicUniversePath;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--help' || arg === '-h') {
      help = true;
      continue;
    }
    if (arg === '--topic-universe') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for ${arg}`);
      }
      topicUniversePath = value;
      index += 1;
      continue;
    }
    publisherArgs.push(arg);
  }

  return { help, publisherArgs, topicUniversePath };
}

function runNodeScript(scriptName, args) {
  const result = spawnSync(process.execPath, [path.join(__dirname, scriptName), ...args], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const linkArgs = [];
  if (options.topicUniversePath) {
    linkArgs.push('--topic-universe', expandHomePath(options.topicUniversePath));
  }

  runNodeScript('link_api_docs.mjs', linkArgs);
  runNodeScript('publish_to_sanity.mjs', [
    '--markdown-root',
    DEFAULT_LINKED_MARKDOWN_DIR,
    ...options.publisherArgs,
  ]);
}

main();
