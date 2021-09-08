// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Returns the first element having the largest value according to the provided
 * comparator or undefined if there are no elements.
 *
 * The comparator is expected to work exactly like one passed to `Array.sort`, which means
 * that `comparator(a, b)` should return a negative number if `a < b`, a positive number if `a > b`
 * and `0` if `a == b`.
 *
 * Example:
 *
 * ```ts
 * import { maxWith } from "./max_with.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const people = ["Kim", "Anna", "John", "Arthur"];
 * const largestName = maxWith(people, (a, b) => a.length - b.length);
 *
 * assertEquals(largestName, "Arthur");
 * ```
 */
export function maxWith<T>(
  array: readonly T[],
  comparator: (a: T, b: T) => number,
): T | undefined {
  let max: T | undefined = undefined;

  for (const current of array) {
    if (max === undefined || comparator(current, max) > 0) {
      max = current;
    }
  }

  return max;
}
