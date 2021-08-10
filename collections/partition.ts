// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Returns a tuple of two arrays with the first one containing all elements in the given array that match the given predicate
 * and the second one containing all that do not
 *
 * Example:
 *
 * ```ts
 * import { partition } from "./partition.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const numbers = [ 5, 6, 7, 8, 9 ]
 * const [ even, odd ] = partition(numbers, it => it % 2 == 0)
 *
 * assertEquals(even, [ 6, 8 ])
 * assertEquals(odd, [ 5, 7, 9 ])
 * ```
 */
export function partition<T>(
  array: Array<T>,
  predicate: (el: T) => boolean,
): [Array<T>, Array<T>] {
  const matches: Array<T> = [];
  const rest: Array<T> = [];

  for (const element of array) {
    if (predicate(element)) {
      matches.push(element);
    } else {
      rest.push(element);
    }
  }

  return [matches, rest];
}
