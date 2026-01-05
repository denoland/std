// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Returns all elements in the given collection until the first element that
 * does not match the given predicate.
 *
 * @typeParam T The type of the elements in the iterable.
 *
 * @param iterable The iterable to take elements from.
 * @param predicate The predicate function to determine if an element should be
 * included.
 *
 * @returns An array containing all elements until the first element that
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
  iterable: Iterable<T>,
  predicate: (el: T) => boolean,
): T[] {
  const result: T[] = [];
  for (const element of iterable) {
    if (!predicate(element)) {
      break;
    }
    result.push(element);
  }
  return result;
}
