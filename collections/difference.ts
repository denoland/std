// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Returns an array of elements that are in the first array but not in the
 * second.
 *
 * @typeParam T The type of the array elements
 *
 * @param a The array to check for elements
 * @param b The array whose elements should be excluded
 *
 * @returns A new array with elements from `a` not in `b`
 *
 * @example Basic usage
 * ```ts
 * import { difference } from "@std/collections/difference";
 * import { assertEquals } from "@std/assert";
 *
 * const a = [1, 2, 3, 4];
 * const b = [2, 4];
 *
 * assertEquals(difference(a, b), [1, 3]);
 * ```
 */
export function difference<T>(a: readonly T[], b: readonly T[]): T[] {
  const exclude = new Set(b);
  return a.filter((item) => !exclude.has(item));
}
