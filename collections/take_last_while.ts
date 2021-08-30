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
  const newArray: T[] = [];
  const length = array.length;

  for (let i = length - 1; i >= 0; i--) {
    if (predicate(array[i])) {
      newArray.push(array[i]);
    } else {
      break;
    }
  }

  return newArray.reverse();
}
