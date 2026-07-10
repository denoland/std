// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Checks if a string contains only alphabetic and numeric characters.
 *
 * @param input The string to check
 * @returns `true` if the string contains only alphanumeric characters
 *
 * @example Usage
 * ```ts
 * import { isAlphanumeric } from "@std/text/is-alphanumeric";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(isAlphanumeric("hello123"), true);
 * assertEquals(isAlphanumeric("hello 123"), false);
 * ```
 */
export function isAlphanumeric(input: string): boolean {
  return /^[A-Za-z0-9]+$/.test(input);
}
