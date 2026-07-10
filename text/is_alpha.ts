// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Checks if a string contains only alphabetic characters.
 *
 * @param input The string to check
 * @returns `true` if the string contains only alphabetic characters
 *
 * @example Usage
 * ```ts
 * import { isAlpha } from "@std/text/is-alpha";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(isAlpha("hello"), true);
 * assertEquals(isAlpha("hello123"), false);
 * ```
 */
export function isAlpha(input: string): boolean {
  return /^[A-Za-z]+$/.test(input);
}
