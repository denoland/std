// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Applies the given selector to all elements in the given collection and
 * calculates the sum of the results.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam T The type of the array elements.
 *
 * @param array The array to calculate the sum of.
 * @param selector The selector function to get the value to sum.
 *
 * @returns The sum of all elements in the collection.
 *
 * @example Basic usage
 * ```ts
 * import { sumOf } from "@std/collections/unstable-sum-of";
 * import { assertEquals } from "@std/assert";
 *
 * const people = [
 *   { name: "Anna", age: 34 },
 *   { name: "Kim", age: 42 },
 *   { name: "John", age: 23 },
 * ];
 *
 * const totalAge = sumOf(people, (person) => person.age);
 *
 * assertEquals(totalAge, 99);
 * ```
 */
export function sumOf<T>(
  array: Iterable<T>,
  selector: (el: T, index: number) => number,
): number {
  let sum = 0;
  let index = 0;

  for (const i of array) {
    sum += selector(i, index++);
  }

  return sum;
}
