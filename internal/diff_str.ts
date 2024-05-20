// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { DiffResult } from "./_types.ts";
import { diff } from "./diff.ts";

/**
 * Unescape invisible characters.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#escape_sequences}
 *
 * @param string String to unescape.
 *
 * @returns Unescaped string.
 */
function unescape(string: string): string {
  return string
    .replaceAll("\b", "\\b")
    .replaceAll("\f", "\\f")
    .replaceAll("\t", "\\t")
    .replaceAll("\v", "\\v")
    // This does not remove line breaks
    .replaceAll(
      /\r\n|\r|\n/g,
      (str) => str === "\r" ? "\\r" : str === "\n" ? "\\n\n" : "\\r\\n\r\n",
    );
}

const WHITESPACE_SYMBOLS = /([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/;

/**
 * Tokenizes a string into an array of tokens.
 *
 * @param string The string to tokenize.
 * @param wordDiff If true, performs word-based tokenization. Default is false.
 *
 * @returns An array of tokens.
 */
function tokenize(string: string, wordDiff = false): string[] {
  if (wordDiff) {
    const tokens = string
      .split(WHITESPACE_SYMBOLS)
      .filter((token) => token);
    return tokens;
  }
  const tokens: string[] = [];
  const lines = string.split(/(\n|\r\n)/).filter((line) => line);

  for (const [i, line] of lines.entries()) {
    if (i % 2) {
      tokens[tokens.length - 1] += line;
    } else {
      tokens.push(line);
    }
  }
  return tokens;
}

/**
 * Create details by filtering relevant word-diff for current line and merge
 * "space-diff" if surrounded by word-diff for cleaner displays.
 *
 * @param line Current line
 * @param tokens Word-diff tokens
 *
 * @returns Array of diff results.
 */
function createDetails(
  line: DiffResult<string>,
  tokens: DiffResult<string>[],
): DiffResult<string>[] {
  return tokens.filter(({ type }) => type === line.type || type === "common")
    .map((result, i, t) => {
      const token = t[i - 1];
      if (
        (result.type === "common") && token &&
        (token.type === t[i + 1]?.type) && /\s+/.test(result.value)
      ) {
        return {
          ...result,
          type: token.type,
        };
      }
      return result;
    });
}

/**
 * Renders the differences between the actual and expected strings. Partially
 * inspired from {@link https://github.com/kpdecker/jsdiff}.
 *
 * @param A Actual string
 * @param B Expected string
 *
 * @returns Array of diff results.
 */
export function diffstr(A: string, B: string): DiffResult<string>[] {
  // Compute multi-line diff
  const diffResult = diff(
    tokenize(`${unescape(A)}\n`),
    tokenize(`${unescape(B)}\n`),
  );

  const added = [];
  const removed = [];
  for (const result of diffResult) {
    if (result.type === "added") {
      added.push(result);
    }
    if (result.type === "removed") {
      removed.push(result);
    }
  }

  // Compute word-diff
  const hasMoreRemovedLines = added.length < removed.length;
  const aLines = hasMoreRemovedLines ? added : removed;
  const bLines = hasMoreRemovedLines ? removed : added;
  for (const a of aLines) {
    let tokens = [] as Array<DiffResult<string>>;
    let b: undefined | DiffResult<string>;
    // Search another diff line with at least one common token
    while (bLines.length) {
      b = bLines.shift();
      const tokenized = [
        tokenize(a.value, true),
        tokenize(b!.value, true),
      ] as [string[], string[]];
      if (hasMoreRemovedLines) tokenized.reverse();
      tokens = diff(tokenized[0], tokenized[1]);
      if (
        tokens.some(({ type, value }) =>
          type === "common" && value.trim().length
        )
      ) {
        break;
      }
    }
    // Register word-diff details
    a.details = createDetails(a, tokens);
    if (b) {
      b.details = createDetails(b, tokens);
    }
  }

  return diffResult;
}

/** Used internally for testing */
export const _internals = {
  createDetails,
  tokenize,
  unescape,
};
