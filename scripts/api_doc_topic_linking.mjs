import fs from 'fs';
import os from 'os';
import path from 'path';

export const DEFAULT_TOPIC_UNIVERSE_PATH = path.join(os.homedir(), 'code/cube/scribe-v2/content/taxonomies/topic-universe.json');
export const DEFAULT_LINKED_MARKDOWN_DIR = 'generated/linked-markdown';
export const INTERNAL_LINK_SCHEME = 'topic://';

const DASH_LIKE_CHARACTERS = /[‐‑‒–—―−]/g;

const SKIP_TOPIC_IDS = new Set([
  'foundations.defi.yield.yield',
  'foundations.defi.yield',
  'foundations.privacy',
  'foundations.scaling.rollups.aggregator',
  'foundations.scaling',
  'foundations.staking',
  'foundations',
  'institutional',
  'markets',
  'protocols.ethereum.base',
  'protocols.networks.near',
  'protocols.networks',
  'protocols',
]);

const PROTECTED_PHRASE_TARGETS = [
  {
    blockedPhrase: 'The Block',
    targetTopicId: 'foundations.blockchain.block',
  },
];

const INTERNAL_ALIAS_CANDIDATES = [
  {
    phrase: 'USDT',
    targetTopicId: 'protocols.stablecoins.tether',
  },
  {
    phrase: 'USDC',
    targetTopicId: 'protocols.stablecoins.circle',
  },
  {
    phrase: 'Deribit',
    targetTopicId: 'protocols.exchanges.cex.deribit',
  },
];

export function expandHomePath(value) {
  if (!value?.startsWith('~/')) return value;
  return path.join(os.homedir(), value.slice(2));
}

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeDeterministicText(value) {
  return value.toLowerCase().replace(DASH_LIKE_CHARACTERS, '-');
}

function isWordChar(ch) {
  return ch !== undefined && /[\p{L}\p{N}]/u.test(ch);
}

function isOverlapping(ranges, start, end) {
  return ranges.some(range => start < range.end && end > range.start);
}

function forEachLineRange(text, callback) {
  let cursor = 0;
  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    const start = cursor;
    const end = start + line.length;
    callback(line, start, end);
    cursor += rawLine.length + 1;
  }
}

function findExistingMarkdownLinkRanges(text) {
  const ranges = [];
  const regex = /(?<!!)\[[^\]]*\]\([^)]*\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    ranges.push({ end: match.index + match[0].length, start: match.index });
  }
  return ranges;
}

function findHeadingRanges(text) {
  const ranges = [];
  forEachLineRange(text, (line, start, end) => {
    if (/^\s*#{1,6}\s+/.test(line)) {
      ranges.push({ start, end });
    }
  });
  return ranges;
}

function findMarkdownTableRanges(text) {
  const ranges = [];
  forEachLineRange(text, (line, start, end) => {
    if (line.trim().startsWith('|')) {
      ranges.push({ start, end });
    }
  });
  return ranges;
}

function findFencedCodeRanges(text) {
  const ranges = [];
  let openRangeStart = null;

  forEachLineRange(text, (line, start, end) => {
    if (!/^\s*`{3,}/.test(line)) return;

    if (openRangeStart === null) {
      openRangeStart = start;
      return;
    }

    ranges.push({ start: openRangeStart, end });
    openRangeStart = null;
  });

  if (openRangeStart !== null) {
    ranges.push({ start: openRangeStart, end: text.length });
  }

  return ranges;
}

function findInlineCodeRanges(text) {
  const ranges = [];
  const regex = /`[^`\n]+`/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }
  return ranges;
}

function findProtectedRangesForTopic(text, targetTopicId) {
  const matches = PROTECTED_PHRASE_TARGETS.filter(entry => entry.targetTopicId === targetTopicId);
  if (matches.length === 0) return [];

  const normalizedText = normalizeDeterministicText(text);
  const ranges = [];

  for (const match of matches) {
    const normalizedPhrase = normalizeDeterministicText(match.blockedPhrase);
    let index = normalizedText.indexOf(normalizedPhrase);

    while (index !== -1) {
      ranges.push({ start: index, end: index + normalizedPhrase.length });
      index = normalizedText.indexOf(normalizedPhrase, index + 1);
    }
  }

  return ranges;
}

function findBlockedRanges(text) {
  return [
    ...findExistingMarkdownLinkRanges(text),
    ...findHeadingRanges(text),
    ...findFencedCodeRanges(text),
    ...findMarkdownTableRanges(text),
    ...findInlineCodeRanges(text),
  ];
}

function findFirstValidMatchIndex(normalizedText, normalizedPhrase, blockedRanges, claimedRanges) {
  const phraseLength = normalizedPhrase.length;
  let index = normalizedText.indexOf(normalizedPhrase);

  while (index !== -1) {
    const end = index + phraseLength;
    if (
      !isWordChar(normalizedText[index - 1]) &&
      !isWordChar(normalizedText[end]) &&
      !isOverlapping(blockedRanges, index, end) &&
      !isOverlapping(claimedRanges, index, end)
    ) {
      return index;
    }
    index = normalizedText.indexOf(normalizedPhrase, index + 1);
  }

  return null;
}

function applyMarkdownEdits(text, edits) {
  return edits
    .slice()
    .sort((left, right) => right.start - left.start)
    .reduce((current, edit) => {
      const linkedPhrase = current.slice(edit.start, edit.end);
      return `${current.slice(0, edit.start)}[${linkedPhrase}](${INTERNAL_LINK_SCHEME}${edit.targetTopicId})${current.slice(edit.end)}`;
    }, text);
}

export function loadTopicUniverse(topicUniversePath = DEFAULT_TOPIC_UNIVERSE_PATH) {
  const expandedPath = expandHomePath(topicUniversePath);
  const absolutePath = path.isAbsolute(expandedPath) ? expandedPath : path.resolve(expandedPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Topic universe file not found: ${absolutePath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  if (!Array.isArray(parsed?.topics)) {
    throw new Error(`Invalid topic universe file: ${absolutePath}`);
  }

  return parsed;
}

export function createLinkingTaxonomyCatalog(topicUniverse) {
  const topicsByNormalizedTitle = new Map();

  for (const topic of topicUniverse.topics) {
    const normalizedTitle = normalizeText(topic.title).toLowerCase();
    const group = topicsByNormalizedTitle.get(normalizedTitle) ?? [];
    group.push(topic);
    topicsByNormalizedTitle.set(normalizedTitle, group);
  }

  return topicUniverse.topics.map(topic => {
    const normalizedTitle = normalizeText(topic.title).toLowerCase();
    const duplicateTitleTopics = topicsByNormalizedTitle
      .get(normalizedTitle)
      ?.filter(candidate => candidate.topicId !== topic.topicId);

    if (!duplicateTitleTopics || duplicateTitleTopics.length === 0) {
      return {
        pageType: topic.pageType,
        title: topic.title,
        topicId: topic.topicId,
      };
    }

    const preferredConceptTopic = [topic, ...duplicateTitleTopics].find(candidate => candidate.pageType === 'concept_explainer');

    return {
      duplicateTitleTopicIds: duplicateTitleTopics.map(candidate => candidate.topicId),
      pageType: topic.pageType,
      preferredDuplicateTopicId: preferredConceptTopic?.topicId ?? topic.topicId,
      title: topic.title,
      topicId: topic.topicId,
    };
  });
}

function buildDeterministicMatchCandidates(taxonomyCatalog) {
  const candidates = new Map();

  for (const entry of taxonomyCatalog) {
    candidates.set(`title:${entry.topicId}:${entry.title}`, {
      phrase: entry.title,
      targetTopicId: entry.topicId,
    });
  }

  for (const alias of INTERNAL_ALIAS_CANDIDATES) {
    if (!taxonomyCatalog.some(entry => entry.topicId === alias.targetTopicId)) continue;

    candidates.set(`alias:${alias.targetTopicId}:${alias.phrase}`, {
      phrase: alias.phrase,
      targetTopicId: alias.targetTopicId,
    });
  }

  return Array.from(candidates.values()).sort((left, right) => right.phrase.length - left.phrase.length);
}

export function deterministicallyLinkMarkdownSegments(markdownSegments, taxonomyCatalog) {
  const coveredTopicIds = new Set();
  const segmentStates = markdownSegments.map(text => ({
    blockedRanges: findBlockedRanges(text),
    claimedRanges: [],
    edits: [],
    normalizedText: normalizeDeterministicText(text),
    text,
  }));

  for (const entry of buildDeterministicMatchCandidates(taxonomyCatalog)) {
    const canonicalEntry = taxonomyCatalog.find(candidate => candidate.topicId === entry.targetTopicId);
    if (!canonicalEntry) continue;
    if (
      canonicalEntry.preferredDuplicateTopicId !== undefined &&
      canonicalEntry.preferredDuplicateTopicId !== canonicalEntry.topicId
    ) {
      continue;
    }

    const targetTopicId = canonicalEntry.preferredDuplicateTopicId ?? canonicalEntry.topicId;
    if (coveredTopicIds.has(targetTopicId) || SKIP_TOPIC_IDS.has(targetTopicId)) continue;

    const normalizedPhrase = normalizeDeterministicText(entry.phrase);

    for (const segmentState of segmentStates) {
      const protectedRanges = findProtectedRangesForTopic(segmentState.text, targetTopicId);
      const matchIndex = findFirstValidMatchIndex(
        segmentState.normalizedText,
        normalizedPhrase,
        [...segmentState.blockedRanges, ...protectedRanges],
        segmentState.claimedRanges
      );

      if (matchIndex === null) continue;

      segmentState.claimedRanges.push({
        start: matchIndex,
        end: matchIndex + entry.phrase.length,
      });
      segmentState.edits.push({
        start: matchIndex,
        end: matchIndex + entry.phrase.length,
        targetTopicId,
      });
      coveredTopicIds.add(targetTopicId);
      break;
    }
  }

  return segmentStates.map(segmentState => applyMarkdownEdits(segmentState.text, segmentState.edits));
}

export function applyDeterministicTopicLinksToSegments(segments, taxonomyCatalog) {
  const linkedMarkdownSegments = deterministicallyLinkMarkdownSegments(
    segments.filter(segment => segment.type === 'markdown').map(segment => segment.value),
    taxonomyCatalog
  );

  let markdownSegmentIndex = 0;

  return segments.map(segment => {
    if (segment.type !== 'markdown') {
      return segment;
    }

    const linkedValue = linkedMarkdownSegments[markdownSegmentIndex] ?? segment.value;
    markdownSegmentIndex += 1;
    return { ...segment, value: linkedValue };
  });
}
