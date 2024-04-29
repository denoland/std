// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Returns all distinct elements in the given array, preserving order by first
 * occurrence.
 *
 * @example
 * ```ts
 * import { distinct } from "@std/collections/distinct";
 * import { assertEquals } from "@std/assert/assert-equals";
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
