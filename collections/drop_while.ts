// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Drop all elements in the given collection until the first element that does not match the given predicate.
 *
 * Example:
 *
 * ```ts
 * import { dropWhile } from "./drop_first_while.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const numbers = [ 3, 2, 5, 2, 5 ]
 * const dropWhileNumbers = dropWhile(numbers, i => i !== 2)
 *
 * assertEquals(dropWhileNumbers, [ 5, 2, 5 ])
 * ```
 */
export function dropWhile<T>(
  array: readonly T[],
  predicate: (el: T) => boolean,
): T[] {
  let offset = 0;
  const length = array.length;

  while (length > offset && predicate(array[offset])) {
    offset++;
  }

  return array.slice(offset + 1, length);
}
