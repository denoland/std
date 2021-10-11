// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 *
 * Builds 2-tuples of elements from the given array with matching indices, stopping when the smaller array's end is reached
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

export function zip<T extends unknown[][]>(...arrays: Readonly<T>): T {
  if (arrays.length === 0) return [] as unknown as T;

  let returnLength = arrays[0].length;

  for (let i = 1; i < arrays.length; i++) {
    returnLength = Math.min(returnLength, arrays[i].length);
  }

  const ret = new Array(returnLength);

  for (let i = 0; i < returnLength; i += 1) {
    const arr = [];
    for (const array of arrays) {
      arr.push(array[i]);
    }
    ret[i] = arr;
  }

  return ret as T;
}
