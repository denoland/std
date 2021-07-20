// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Builds two separate arrays from the given array of 2-tuples, with the first returned array holding all first
 * tuple elements and the second one holding all the second elements
 *
 * Example:
 *
 * ```typescript
 * import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
 * import { zip } from "https://deno.land/std/collections/unzip.ts";
 *
 * const parents = [
 *   ["Maria", "Jeff"],
 *   ["Anna", "Kim"],
 *   ["John", "Leroy"],
 * ];
 * const [moms, dads] = unzip(parents);
 *
 * assertEquals(moms, ["Maria", "Anna", "John"]);
 * assertEquals(moms, ["Jeff", "Kim", "Leroy"]);
 * ```
 */
export function unzip<T, U>(pairs: Array<[T, U]>): [Array<T>, Array<U>] {
  const { length } = pairs;
  const ret: [Array<T>, Array<U>] = [
    new Array(length),
    new Array(length),
  ];

  pairs.forEach(([first, second], index) => {
    ret[0][index] = first;
    ret[1][index] = second;
  });

  return ret;
}
