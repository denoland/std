// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { splitToWords } from "./_util.ts";

/**
 * Converts a string into snake_case.
 *
 * @example Usage
 * ```ts
 * import { toSnakeCase } from "@std/text/to-snake-case";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(toSnakeCase("deno is awesome"), "deno_is_awesome");
 * ```
 *
 * @param input The string that is going to be converted into snake_case
 * @returns The string as snake_case
 */
export function toSnakeCase(input: string): string {
  input = input.trim();
  return splitToWords(input).join("_").toLowerCase();
}
