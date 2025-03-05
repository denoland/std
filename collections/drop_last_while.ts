// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Returns a new array that drops all elements in the given collection until the
 * last element that does not match the given predicate.
 *
 * @typeParam T The type of the elements in the input array.
 *
 * @param array The array to drop elements from.
 * @param predicate The function to test each element for a condition.
 *
 * @returns A new array that drops all elements until the last element that does
 * not match the given predicate.
 *
 * @example Basic usage
 * ```ts
 * import { dropLastWhile } from "@std/collections/drop-last-while";
 * import { assertEquals } from "@std/assert";
 *
 * const numbers = [11, 42, 55, 20, 33, 44];
 *
 * const notFortyFour = dropLastWhile(numbers, (number) => number > 30);
 *
 * assertEquals(notFortyFour, [11, 42, 55, 20]);
 * ```
 */
export function dropLastWhile<T>(
  array: readonly T[],
  predicate: (el: T, index: number) => boolean,
): T[] {
  let offset = array.length;
  while (0 < offset && predicate(array[offset - 1] as T, offset - 1)) offset--;

  return array.slice(0, offset);
}
