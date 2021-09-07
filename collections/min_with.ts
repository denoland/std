// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Returns the first element having the smallest value according to the provided comparator or undefined if there are no elements
 *
 * Example:
 *
 * ```ts
 * import { minWith } from "./min_with.ts";
 * import { assertEquals } from "../testing/asserts.ts";
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
