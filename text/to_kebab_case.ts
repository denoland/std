// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { splitToWords } from "./_util.ts";

/**
 * Converts a string into kebab-case.
 *
 * @example Usage
 * ```ts
 * import { toKebabCase } from "@std/text/to-kebab-case";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(toKebabCase("deno is awesome"), "deno-is-awesome");
 * ```
 *
 * @param input The string that is going to be converted into kebab-case
 * @returns The string as kebab-case
 */
export function toKebabCase(input: string): string {
  input = input.trim();
  return splitToWords(input).join("-").toLowerCase();
}
