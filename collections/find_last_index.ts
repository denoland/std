// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Returns the index of the last element in the given array matching the given predicate
 *
 * Example:
 *
 * ```ts
 * import { findLastIndex } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const numbers = [ 4, 2, 7 ]
 * const lastIndexNumber = findLastIndex(numbers, it => it % 2 === 0)
 *
 * assertEquals(lastIndexNumber, 1)
 * ```
 */
export function findLastIndex<T>(
  array: readonly T[],
  predicate: (el: T) => boolean,
): number | undefined {
  for (let i = array.length - 1; i >= 0; i -= 1) {
    const element = array[i];

    if (predicate(element)) {
      return i;
    }
  }

  return undefined;
}
