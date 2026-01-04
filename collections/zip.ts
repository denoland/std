// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Builds N-tuples of elements from the given N arrays with matching indices,
 * stopping when the smallest array's end is reached.
 *
 * @typeParam T The type of the tuples produced by this function.
 *
 * @param arrays The arrays to zip.
 *
 * @returns A new array containing N-tuples of elements from the given arrays.
 *
 * @example Basic usage
 * ```ts
 * import { zip } from "@std/collections/zip";
 * import { assertEquals } from "@std/assert";
 *
 * const numbers = [1, 2, 3, 4];
 * const letters = ["a", "b", "c", "d"];
 * const pairs = zip(numbers, letters);
 *
 * assertEquals(
 *   pairs,
 *   [
 *     [1, "a"],
 *     [2, "b"],
 *     [3, "c"],
 *     [4, "d"],
 *   ],
 * );
 * ```
 */
export function zip<T extends unknown[]>(
  ...arrays: { [K in keyof T]: ReadonlyArray<T[K]> }
): T[] {
  const numArrays = arrays.length;
  if (numArrays === 0) return [];

  // Find the length of the shortest array
  let minLength = arrays[0]!.length;
  for (let arrayIndex = 1; arrayIndex < numArrays; ++arrayIndex) {
    if (arrays[arrayIndex]!.length < minLength) {
      minLength = arrays[arrayIndex]!.length;
    }
  }

  // Build tuples from elements at corresponding indices
  const result: T[] = new Array(minLength);
  for (let resultIndex = 0; resultIndex < minLength; ++resultIndex) {
    const tuple: unknown[] = new Array(numArrays);
    for (let arrayIndex = 0; arrayIndex < numArrays; ++arrayIndex) {
      tuple[arrayIndex] = arrays[arrayIndex]![resultIndex];
    }
    result[resultIndex] = tuple as T;
  }

  return result;
}
