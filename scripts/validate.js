#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const GITHUB_USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(
      `Unable to parse JSON from ${filePath}: ${error.message}\n` +
        'This usually means a missing or extra comma between objects in the array. ' +
        'Every entry except the last one needs a trailing comma, and the last entry must not have one. ' +
        'See CONTRIBUTING.md for an example.'
    );
  }
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  if (isObject(a) && isObject(b)) {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key, index) => key === bKeys[index] && deepEqual(a[key], b[key]));
  }
  return false;
}

function isSingleEmoji(value) {
  if (typeof value !== 'string' || value.length === 0) return false;

  const segments = Array.from(
    new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)
  );

  if (segments.length !== 1) return false;

  const segment = segments[0].segment;
  return /(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Presentation})/u.test(segment);
}

function fail(message) {
  console.error(`Validation failed: ${message}`);
  process.exit(1);
}

function validateUsername(username) {
  return typeof username === 'string' && username.length > 0 && GITHUB_USERNAME_RE.test(username);
}

function validateEntry(entry) {
  if (!isObject(entry)) {
    return 'Entry must be an object.';
  }

  if (!validateUsername(entry.username)) {
    return 'username must be a non-empty GitHub username string.';
  }

  if (!Array.isArray(entry.emojis) || entry.emojis.length !== 5) {
    return 'emojis must be an array of exactly 5 emoji strings.';
  }

  for (const emoji of entry.emojis) {
    if (!isSingleEmoji(emoji)) {
      return `emoji value ${JSON.stringify(emoji)} is not a single emoji character.`;
    }
  }

  if ('mood' in entry || 'addedAt' in entry) {
    return 'New entry must not include mood or addedAt; those are generated automatically.';
  }

  return null;
}

function findNewEntries(baseArray, headArray) {
  return headArray.filter((entry) => !baseArray.some((baseItem) => deepEqual(baseItem, entry)));
}

function findBaseMismatch(baseArray, headArray) {
  return baseArray.find((baseItem) => !headArray.some((headItem) => deepEqual(baseItem, headItem)));
}

function validateEmojisEdit(baseEntry, headEntry) {
  if (baseEntry.username !== headEntry.username) {
    return 'username must not change when editing an entry.';
  }
  if ('mood' in headEntry || 'addedAt' in headEntry) {
    return 'Edited entry must not include mood or addedAt; those are regenerated automatically.';
  }
  if (!Array.isArray(headEntry.emojis) || headEntry.emojis.length !== 5) {
    return 'emojis must be an array of exactly 5 emoji strings.';
  }
  for (const emoji of headEntry.emojis) {
    if (!isSingleEmoji(emoji)) {
      return `emoji value ${JSON.stringify(emoji)} is not a single emoji character.`;
    }
  }
  return null;
}

function run() {
  const [basePath, headPath, prAuthor] = process.argv.slice(2);
  if (!basePath || !headPath) {
    fail('Usage: node scripts/validate.js <base-manifest.json> <head-manifest.json> [pr-author]');
  }

  const base = readJson(basePath);
  const head = readJson(headPath);

  if (!Array.isArray(base)) {
    fail('Base manifest must be an array.');
  }
  if (!Array.isArray(head)) {
    fail('Head manifest must be an array.');
  }

  // Same array length and same order of usernames, but at least one entry
  // differs -> this is an edit to an existing entry rather than a new
  // contribution. Comparing by position (not just by username set) also
  // ensures reordering the array isn't silently accepted as an "edit".
  const sameOrder =
    base.length === head.length && base.every((entry, index) => entry.username === head[index].username);

  if (sameOrder) {
    const changedPairs = base
      .map((baseEntry, index) => ({ baseEntry, headEntry: head[index] }))
      .filter(({ baseEntry, headEntry }) => !deepEqual(baseEntry, headEntry));

    if (changedPairs.length === 0) {
      fail('No changes detected. Nothing to validate.');
    }
    if (changedPairs.length > 1) {
      fail(`Exactly one entry may be edited at a time. Found ${changedPairs.length} changed entries.`);
    }

    const { baseEntry, headEntry } = changedPairs[0];

    if (!prAuthor) {
      fail('Unable to determine PR author for edit authorization.');
    }
    if (baseEntry.username !== prAuthor) {
      fail(`Only ${baseEntry.username} may edit this entry. PR was opened by ${prAuthor}.`);
    }

    const editError = validateEmojisEdit(baseEntry, headEntry);
    if (editError) {
      fail(editError);
    }

    console.log(`Validation passed (edit to existing entry '${baseEntry.username}').`);
    process.exit(0);
  }

  const mismatch = findBaseMismatch(base, head);
  if (mismatch) {
    fail('Existing entry was deleted or modified. No changes to existing entries are allowed.');
  }

  const newEntries = findNewEntries(base, head);
  if (newEntries.length !== 1) {
    fail(`Exactly one new entry must be added. Found ${newEntries.length}.`);
  }

  const newEntry = newEntries[0];

  if (prAuthor && newEntry.username !== prAuthor) {
    fail(`New entry username '${newEntry.username}' must match the PR author '${prAuthor}'.`);
  }

  const validationError = validateEntry(newEntry);
  if (validationError) {
    fail(validationError);
  }

  const duplicateUsername = base.some((entry) => entry.username === newEntry.username);
  if (duplicateUsername) {
    fail(`username '${newEntry.username}' already exists in the base manifest.`);
  }

  console.log('Validation passed.');
  process.exit(0);
}

run();
