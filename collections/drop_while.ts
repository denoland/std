// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Returns an array that drops all elements in the given iterable until the
 * first element that does not match the given predicate.
 *
 * @typeParam T The type of the elements in the input iterable.
 *
 * @param iterable The iterable to drop elements from.
 * @param predicate The function to test each element for a condition.
 *
 * @returns An array that drops all elements until the first element that
 * does not match the given predicate.
 *
 * @example Basic usage
 * ```ts
 * import { dropWhile } from "@std/collections/drop-while";
 * import { assertEquals } from "@std/assert";
 *
 * const numbers = [3, 2, 5, 2, 5];
 * const dropWhileNumbers = dropWhile(numbers, (number) => number !== 2);
 *
 * assertEquals(dropWhileNumbers, [2, 5, 2, 5]);
 * ```
 */
export function dropWhile<T>(
  iterable: Iterable<T>,
  predicate: (el: T, index: number) => boolean,
): T[] {
  if (Array.isArray(iterable)) {
    const idx = iterable.findIndex((el, index) => !predicate(el, index));
    if (idx === -1) {
      return [];
    }
    return iterable.slice(idx);
  }
  const array: T[] = [];
  let index = 0;
  let found = false;
  for (const item of iterable) {
    if (found || !predicate(item, index++)) {
      found = true;
      array.push(item);
    }
  }
  return array;
}
