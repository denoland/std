// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Returns all distinct elements in the given array, preserving order by first
 * occurrence.
 *
 * Uniqueness is determined by [same-value-zero](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness#same-value-zero_equality) equality.
 *
 * @typeParam T The type of the elements in the input array.
 *
 * @param array The array to filter for distinct elements.
 *
 * @returns An array of distinct elements in the input array.
 *
 * @example Basic usage
 * ```ts
 * import { distinct } from "@std/collections/distinct";
 * import { assertEquals } from "@std/assert";
 *
 * const numbers = [3, 2, 5, 2, 5];
 * const distinctNumbers = distinct(numbers);
 *
 * assertEquals(distinctNumbers, [3, 2, 5]);
 * ```
 */
export function distinct<T>(array: Iterable<T>): T[] {
  const set = new Set(array);

  return Array.from(set);
}
