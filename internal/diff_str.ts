// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import type { ChangedDiffResult, DiffResult } from "./types.ts";
import { diff } from "./diff.ts";

/**
 * Unescape invisible characters.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#escape_sequences}
 *
 * @param string String to unescape.
 *
 * @returns Unescaped string.
 *
 * @example Usage
 * ```ts
 * import { unescape } from "@std/internal/diff-str";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(unescape("Hello\nWorld"), "Hello\\n\nWorld");
 * ```
 */
export function unescape(string: string): string {
  return string
    .replaceAll("\\", "\\\\")
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

const WHITESPACE_SYMBOLS =
  /((?:\\[bftv]|[^\S\r\n])+|\\[rn\\]|[()[\]{}'"\r\n]|\b)/;

/**
 * Tokenizes a string into an array of tokens.
 *
 * @param string The string to tokenize.
 * @param wordDiff If true, performs word-based tokenization. Default is false.
 *
 * @returns An array of tokens.
 *
 * @example Usage
 * ```ts
 * import { tokenize } from "@std/internal/diff-str";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(tokenize("Hello\nWorld"), ["Hello\n", "World"]);
 * ```
 */
export function tokenize(string: string, wordDiff = false): string[] {
  if (wordDiff) {
    return string
      .split(WHITESPACE_SYMBOLS)
      .filter((token) => token);
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
 *
 * @example Usage
 * ```ts
 * import { createDetails } from "@std/internal/diff-str";
 * import { assertEquals } from "@std/assert";
 *
 * const tokens = [
 *   { type: "added", value: "a" },
 *   { type: "removed", value: "b" },
 *   { type: "common", value: "c" },
 * ] as const;
 * assertEquals(
 *   createDetails({ type: "added", value: "a" }, [...tokens]),
 *   [{ type: "added", value: "a" }, { type: "common", value: "c" }]
 * );
 * ```
 */
export function createDetails(
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

const NON_WHITESPACE_REGEXP = /\S/;

/**
 * Renders the differences between the actual and expected strings. Partially
 * inspired from {@link https://github.com/kpdecker/jsdiff}.
 *
 * @param A Actual string
 * @param B Expected string
 *
 * @returns Array of diff results.
 *
 * @example Usage
 * ```ts
 * import { diffStr } from "@std/internal/diff-str";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(diffStr("Hello!", "Hello"), [
 *   {
 *     type: "removed",
 *     value: "Hello!\n",
 *     details: [
 *       { type: "common", value: "Hello" },
 *       { type: "removed", value: "!" },
 *       { type: "common", value: "\n" }
 *     ]
 *   },
 *   {
 *     type: "added",
 *     value: "Hello\n",
 *     details: [
 *       { type: "common", value: "Hello" },
 *       { type: "common", value: "\n" }
 *     ]
 *   }
 * ]);
 * ```
 */
export function diffStr(A: string, B: string): DiffResult<string>[] {
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
    let b: undefined | ChangedDiffResult<string>;
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
          type === "common" && NON_WHITESPACE_REGEXP.test(value)
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
