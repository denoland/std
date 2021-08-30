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
  // needs to Array.from(array) to avoid mutation
  const revArray = Array.from(array).reverse();
  let offset = 0;
  const length = revArray.length;

  while (length > offset && predicate(revArray[offset])) {
    offset++;
  }

  return revArray.slice(0, offset).reverse();
}
