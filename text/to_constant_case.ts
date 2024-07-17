// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { splitToWords } from "./_util.ts";

/**
 * **UNSTABLE**: New API, yet to be vetted.
 *
 * Converts a string into CONSTANT_CASE (also known as SCREAMING_SNAKE_CASE).
 *
 * @example Usage
 * ```ts
 * import { toConstantCase } from "@std/text/to-constant-case";
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(toConstantCase("deno is awesome"), "DENO_IS_AWESOME");
 * ```
 *
 * @param input The string that is going to be converted into CONSTANT_CASE
 * @returns The string as CONSTANT_CASE
 *
 * @experimental
 */
export function toConstantCase(input: string): string {
  input = input.trim();
  return splitToWords(input).join("_").toLocaleUpperCase();
}
