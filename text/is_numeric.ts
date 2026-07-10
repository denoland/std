// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Checks if a string contains only numeric characters.
 *
 * @param input The string to check
 * @returns `true` if the string contains only numeric characters
 *
 * @example Usage
 * ```ts
 * import { isNumeric } from "@std/text/is-numeric";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(isNumeric("123"), true);
 * assertEquals(isNumeric("123abc"), false);
 * ```
 */
export function isNumeric(input: string): boolean {
  return /^[0-9]+$/.test(input);
}
