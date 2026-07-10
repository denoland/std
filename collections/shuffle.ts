// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Returns a new array with the elements shuffled using the Fisher-Yates algorithm.
 *
 * @typeParam T The type of the array elements
 *
 * @param array The array to shuffle
 *
 * @returns A new array with the elements in random order
 *
 * @example Basic usage
 * ```ts
 * import { shuffle } from "@std/collections/shuffle";
 * import { assertEquals } from "@std/assert";
 *
 * const numbers = [1, 2, 3, 4];
 * const shuffled = shuffle(numbers);
 * assertEquals(shuffled.length, 4);
 * assertEquals(shuffled.sort(), [1, 2, 3, 4]);
 * ```
 */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
