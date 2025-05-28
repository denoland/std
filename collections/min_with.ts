// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Returns the first element having the smallest value according to the provided
 * comparator or undefined if there are no elements.
 *
 * @typeParam T The type of the elements in the array.
 *
 * @param array The array to find the minimum element in.
 * @param comparator The function to compare elements.
 *
 * @returns The first element that is the smallest value of the given function
 * or undefined if there are no elements.
 *
 * @example Basic usage
 * ```ts
 * import { minWith } from "@std/collections/min-with";
 * import { assertEquals } from "@std/assert";
 *
 * const people = ["Kim", "Anna", "John"];
 * const smallestName = minWith(people, (a, b) => a.length - b.length);
 *
 * assertEquals(smallestName, "Kim");
 * ```
 */
export function minWith<T>(
  array: Iterable<T>,
  comparator: (a: T, b: T) => number,
): T | undefined {
  let min: T | undefined;
  let isFirst = true;

  for (const current of array) {
    if (isFirst || comparator(current, min as T) < 0) {
      min = current;
      isFirst = false;
    }
  }

  return min;
}
