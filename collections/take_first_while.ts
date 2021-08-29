// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
/**
 * Returns all elements in the given collection until the first element that does not match the given predicate.
 *
 * Example:
 * ```ts
 * import { takeFirstWhile } from "./take_first_while.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 * 
 * const arr = [1, 2, 3, 4, 5, 6];
 *
 * assertEquals(takeFirstWhile(arr, (i) => i !== 4), [1, 2, 3]);
 * ```
 */
export function takeFirstWhile<T>(
  array: readonly T[],
  predicate: (el: T) => boolean,
): T[] {
  let offset = 0;
  const length = array.length;

  while (length > offset && predicate(array[offset])) {
    offset++;   
  }

  return array.slice(0, offset);
}
