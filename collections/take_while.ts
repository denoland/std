// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Returns all elements in the given collection until the first element that
 * does not match the given predicate.
 *
 * Note: If you want to process any iterable, use the new version of
 * `takeWhile` from `@std/collections/unstable-take-while`.
 *
 * @typeParam T The type of the array elements.
 *
 * @param array The array to take elements from.
 * @param predicate The predicate function to determine if an element should be
 * included.
 *
 * @returns A new array containing all elements until the first element that
 * does not match the predicate.
 *
 * @example Basic usage
 * ```ts
 * import { takeWhile } from "@std/collections/take-while";
 * import { assertEquals } from "@std/assert";
 *
 * const numbers = [1, 2, 3, 4, 5, 6];
 *
 * const result = takeWhile(numbers, (number) => number < 4);
 *
 * assertEquals(result, [1, 2, 3]);
 * ```
 */
export function takeWhile<T>(
  array: readonly T[],
  predicate: (el: T, index: number) => boolean,
): T[] {
  let offset = 0;
  const length = array.length;

  while (length > offset && predicate(array[offset] as T, offset)) {
    offset++;
  }

  return array.slice(0, offset);
}
