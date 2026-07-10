// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

const ANSI_PATTERN = [
  "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
  "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))",
].join("|");

const ANSI_REGEXP = new RegExp(ANSI_PATTERN, "g");

/**
 * Strips ANSI escape codes from a string.
 *
 * @param input The string containing ANSI codes
 * @returns The string with ANSI codes removed
 *
 * @example Usage
 * ```ts
 * import { stripAnsi } from "@std/text/strip-ansi";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(stripAnsi("\x1b[31mHello\x1b[0m"), "Hello");
 * ```
 */
export function stripAnsi(input: string): string {
  return input.replace(ANSI_REGEXP, "");
}
