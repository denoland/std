// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Counts the occurrences of each key returned by the given function.
 *
 * @typeParam T The type of the array elements
 * @typeParam K The type of the keys
 *
 * @param array The array to count
 * @param keyFn The function that returns the key for each element
 *
 * @returns An object mapping keys to their counts
 *
 * @example Basic usage
 * ```ts
 * import { countBy } from "@std/collections/count-by";
 * import { assertEquals } from "@std/assert";
 *
 * const pets = [
 *   { type: "dog", name: "Fido" },
 *   { type: "cat", name: "Whiskers" },
 *   { type: "dog", name: "Rover" },
 * ];
 *
 * const counts = countBy(pets, (pet) => pet.type);
 * assertEquals(counts, { dog: 2, cat: 1 });
 * ```
 */
export function countBy<T, K extends PropertyKey>(
  array: readonly T[],
  keyFn: (element: T) => K,
): Record<K, number> {
  const result = {} as Record<K, number>;
  for (const element of array) {
    const key = keyFn(element);
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}
