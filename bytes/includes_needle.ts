// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { indexOfNeedle } from "./index_of_needle.ts";

/**
 * Determines whether the source array contains the needle array.
 *
 * The complexity of this function is `O(source.length * needle.length)`.
 *
 * @param source Source array to check.
 * @param needle Needle array to check for.
 * @param start Start index in the source array to begin the search. Defaults to
 * 0.
 * @returns `true` if the source array contains the needle array, `false`
 * otherwise.
 *
 * @example Basic usage
 * ```ts
 * import { includesNeedle } from "@std/bytes/includes-needle";
 * import { assertEquals } from "@std/assert";
 *
 * const source = new Uint8Array([0, 1, 2, 1, 2, 1, 2, 3]);
 * const needle = new Uint8Array([1, 2]);
 *
 * assertEquals(includesNeedle(source, needle), true);
 * ```
 *
 * @example Start index
 * ```ts
 * import { includesNeedle } from "@std/bytes/includes-needle";
 * import { assertEquals } from "@std/assert";
 *
 * const source = new Uint8Array([0, 1, 2, 1, 2, 1, 2, 3]);
 * const needle = new Uint8Array([1, 2]);
 *
 * assertEquals(includesNeedle(source, needle, 3), true);
 * assertEquals(includesNeedle(source, needle, 6), false);
 * ```
 * The search will start at the specified index in the source array.
 */
export function includesNeedle(
  source: Uint8Array,
  needle: Uint8Array,
  start = 0,
): boolean {
  return indexOfNeedle(source, needle, start) !== -1;
}
