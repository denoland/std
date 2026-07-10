// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Flattens an array of arrays into a single array (one level deep).
 *
 * @typeParam T The type of the inner array elements
 *
 * @param array The array of arrays to flatten
 *
 * @returns A new flattened array
 *
 * @example Basic usage
 * ```ts
 * import { flatten } from "@std/collections/flatten";
 * import { assertEquals } from "@std/assert";
 *
 * const nested = [[1, 2], [3, 4], [5]];
 * assertEquals(flatten(nested), [1, 2, 3, 4, 5]);
 * ```
 */
export function flatten<T>(array: readonly (readonly T[])[]): T[] {
  const result: T[] = [];
  for (const inner of array) {
    for (const element of inner) {
      result.push(element);
    }
  }
  return result;
}
