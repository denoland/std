// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { capitalizeWord, splitToWords } from "./_util.ts";

/**
 * Converts a string into camelCase.
 *
 * @example Usage
 * ```ts
 * import { toCamelCase } from "@std/text/to-camel-case";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(toCamelCase("deno is awesome"),"denoIsAwesome");
 * ```
 *
 * @param input The string that is going to be converted into camelCase
 * @returns The string as camelCase
 */
export function toCamelCase(input: string): string {
  input = input.trim();
  const [first = "", ...rest] = splitToWords(input);
  return [first.toLowerCase(), ...rest.map(capitalizeWord)].join("");
}
