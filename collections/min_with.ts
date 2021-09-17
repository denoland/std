// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Returns the first element having the smallest value according to the provided comparator or undefined if there are no elements
 *
 * Example:
 *
 * ```ts
 * import { minWith } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const people = ["Kim", "Anna", "John"];
 * const smallestName = minWith(people, (a, b) => a.length - b.length);
 *
 * assertEquals(smallestName, "Kim");
 * ```
 */
export function minWith<T>(
  array: readonly T[],
  comparator: (a: T, b: T) => number,
): T | undefined {
  let min: T | undefined = undefined;

  for (const current of array) {
    if (min === undefined || comparator(current, min) < 0) {
      min = current;
    }
  }

  return min;
}
