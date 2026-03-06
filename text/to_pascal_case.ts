// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { capitalizeWord, splitToWords } from "./_util.ts";

/**
 * Converts a string into PascalCase.
 *
 * @example Usage
 * ```ts
 * import { toPascalCase } from "@std/text/to-pascal-case";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(toPascalCase("deno is awesome"), "DenoIsAwesome");
 * ```
 *
 * @param input The string that is going to be converted into PascalCase
 * @returns The string as PascalCase
 */
export function toPascalCase(input: string): string {
  input = input.trim();
  return splitToWords(input).map(capitalizeWord).join("");
}
