// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Builds 2-tuples of elements from the given array with matching indices, stopping when the smaller array's end is reached
 *
 * Example:
 *
 * ```ts
 * import { zip } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const numbers = [ 1, 2, 3, 4 ]
 * const letters = [ 'a', 'b', 'c', 'd' ]
 * const pairs = zip(numbers, letters)
 *
 * assertEquals(pairs, [
 *     [ 1, 'a' ],
 *     [ 2, 'b' ],
 *     [ 3, 'c' ],
 *     [ 4, 'd' ],
 * ])
 * ```
 */
export function zip<T, U>(
  array: readonly T[],
  withArray: readonly U[],
): [T, U][] {
  const returnLength = Math.min(array.length, withArray.length);

  const ret = new Array<[T, U]>(returnLength);

  for (let i = 0; i < returnLength; i += 1) {
    ret[i] = [array[i], withArray[i]];
  }

  return ret;
}
