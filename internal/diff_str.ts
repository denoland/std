// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { DiffResult } from "./_types.ts";
import { _internals } from "./diff.ts";

/**
 * Renders the differences between the actual and expected strings
 * Partially inspired from https://github.com/kpdecker/jsdiff
 * @param A Actual string
 * @param B Expected string
 */
export function diffstr(A: string, B: string): DiffResult<string>[] {
  function unescape(string: string): string {
    // unescape invisible characters.
    // ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#escape_sequences
    return string
      .replaceAll("\b", "\\b")
      .replaceAll("\f", "\\f")
      .replaceAll("\t", "\\t")
      .replaceAll("\v", "\\v")
      .replaceAll( // does not remove line breaks
        /\r\n|\r|\n/g,
        (str) => str === "\r" ? "\\r" : str === "\n" ? "\\n\n" : "\\r\\n\r\n",
      );
  }

  function tokenize(string: string, { wordDiff = false } = {}): string[] {
    if (wordDiff) {
      // Split string on whitespace symbols
      const tokens = string.split(/([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/);
      // Extended Latin character set
      const words =
        /^[a-zA-Z\u{C0}-\u{FF}\u{D8}-\u{F6}\u{F8}-\u{2C6}\u{2C8}-\u{2D7}\u{2DE}-\u{2FF}\u{1E00}-\u{1EFF}]+$/u;

      // Join boundary splits that we do not consider to be boundaries and merge empty strings surrounded by word chars
      for (let i = 0; i < tokens.length - 1; i++) {
        const token = tokens[i];
        const tokenPlusTwo = tokens[i + 2];
        if (
          !tokens[i + 1] &&
          token &&
          tokenPlusTwo &&
          words.test(token) &&
          words.test(tokenPlusTwo)
        ) {
          tokens[i] += tokenPlusTwo;
          tokens.splice(i + 1, 2);
          i--;
        }
      }
      return tokens.filter((token) => token);
    } else {
      // Split string on new lines symbols
      const tokens: string[] = [];
      const lines = string.split(/(\n|\r\n)/);

      // Ignore final empty token when text ends with a newline
      if (!lines[lines.length - 1]) {
        lines.pop();
      }

      // Merge the content and line separators into single tokens
      for (const [i, line] of lines.entries()) {
        if (i % 2) {
          tokens[tokens.length - 1] += line;
        } else {
          tokens.push(line);
        }
      }
      return tokens;
    }
  }

  // Create details by filtering relevant word-diff for current line
  // and merge "space-diff" if surrounded by word-diff for cleaner displays
  function createDetails(
    line: DiffResult<string>,
    tokens: Array<DiffResult<string>>,
  ) {
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

  // Compute multi-line diff
  const diffResult = _internals.diff(
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
        tokenize(a.value, { wordDiff: true }),
        tokenize(b?.value ?? "", { wordDiff: true }),
      ] as [string[], string[]];
      if (hasMoreRemovedLines) tokenized.reverse();
      tokens = _internals.diff(tokenized[0], tokenized[1]);
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
