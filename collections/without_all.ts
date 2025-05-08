// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Returns an array excluding all given values from an iterable.
 *
 * Note: If both inputs are {@linkcode Set}s, and you want the difference as a
 * {@linkcode Set}, you could use {@linkcode Set.prototype.difference} instead.
 *
 * @typeParam T The type of the elements in the iterable.
 *
 * @param iterable The iterable to exclude values from.
 * @param values The values to exclude from the iterable.
 *
 * @returns An array containing all elements from iterables except the
 * ones that are in the values iterable.
 *
 * @example Basic usage
 * ```ts
 * import { withoutAll } from "@std/collections/without-all";
 * import { assertEquals } from "@std/assert";
 *
 * const withoutList = withoutAll([2, 1, 2, 3], [1, 2]);
 *
 * assertEquals(withoutList, [3]);
 * ```
 */
export function withoutAll<T>(iterable: Iterable<T>, values: Iterable<T>): T[] {
  const excludedSet = new Set(values);
  const result: T[] = [];
  for (const value of iterable) {
    if (excludedSet.has(value)) {
      continue;
    }
    result.push(value);
  }
  return result;
}
