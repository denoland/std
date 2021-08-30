// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
/**
 * Returns all elements in the given collection until the first element that does not match the given predicate.
 *
 * Example:
 * ```ts
 * import { takeLastWhile } from "./take_last_while.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const arr = [1, 2, 3, 4, 5, 6];
 *
 * assertEquals(
 *   takeLastWhile(arr, (i) => i > 4),
 *   [5, 6],
 * );
 * ```
 */
export function takeLastWhile<T>(
  array: readonly T[],
  predicate: (el: T) => boolean,
): T[] {
  const length = array.length;
  let offset = length;

  // while (length > offset && predicate(array[offset])) {
  //   offset++;
  // }

  for (let i = length; i <= length; i--) {
    if (predicate(array[i-1])) { offset-- }
    else { break; }
  }

  return array.slice(offset, length)
}
