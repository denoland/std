// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { Predicate } from "./types.ts";

/**
 * Returns the index of the last element in the given array matching the given predicate
 *
 * Example:
 *
 * ```ts
 * import { findLastIndex } from "./find_last_index.ts";
 *
 * const numbers = [ 4, 2, 7 ]
 * const lastIndexNumber = findLastIndex(numbers, it => it % 2 === 0)
 *
 * console.assert(lastIndexNumber === 1)
 * ```
 */
export function findLastIndex<T>(
  array: Array<T>,
  predicate: Predicate<T>,
): number {
  for (let i = array.length - 1; i >= 0; i -= 1) {
    const element = array[i];

    if (predicate(element)) {
      return i;
    }
  }

  return -1;
}
