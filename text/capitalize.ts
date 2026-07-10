// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Capitalizes the first character of a string and lowercases the rest.
 *
 * @param input The string to capitalize
 * @returns The capitalized string
 *
 * @example Usage
 * ```ts
 * import { capitalize } from "@std/text/capitalize";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(capitalize("hello"), "Hello");
 * assertEquals(capitalize("hELLO"), "Hello");
 * ```
 */
export function capitalize(input: string): string {
  if (input.length === 0) return input;
  return input[0]!.toUpperCase() + input.slice(1).toLowerCase();
}
