// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Returns all elements in the given iterable after the last element that does not
 * match the given predicate.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam T The type of the iterable elements.
 *
 * @param iterable The iterable to take elements from.
 * @param predicate The predicate function to determine if an element should be
 * included.
 *
 * @returns An array containing all elements after the last element that does
 * not match the predicate.
 *
 * @example Basic usage
 * ```ts
 * import { takeLastWhile } from "@std/collections/unstable-take-last-while";
 * import { assertEquals } from "@std/assert";
 *
 * const numbers = [1, 2, 3, 4, 5, 6];
 * const result = takeLastWhile(numbers, (number) => number > 4);
 * assertEquals(result, [5, 6]);
 * ```
 */
export function takeLastWhile<T>(
  iterable: Iterable<T>,
  predicate: (el: T, index: number) => boolean,
): T[] {
  if (Array.isArray(iterable)) {
    let offset = iterable.length;
    while (0 < offset && predicate(iterable[offset - 1] as T, offset - 1)) {
      offset--;
    }
    return iterable.slice(offset);
  }
  let index = 0;
  const result: T[] = [];
  for (const el of iterable) {
    if (predicate(el, index++)) {
      result.push(el);
    } else {
      result.length = 0;
    }
  }
  return result;
}
