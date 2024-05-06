// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Applies the given selector to all elements in the given collection and
 * calculates the sum of the results.
 *
 * @template T The type of the array elements.
 *
 * @param array The array to calculate the sum of.
 * @param selector The selector function to get the value to sum.
 *
 * @returns The sum of all elements in the collection.
 *
 * @example Calculate the total age of all people
 * ```ts
 * import { sumOf } from "@std/collections/sum-of";
 *
 * const people = [
 *   { name: "Anna", age: 34 },
 *   { name: "Kim", age: 42 },
 *   { name: "John", age: 23 },
 * ];
 *
 * sumOf(people, (person) => person.age); // 99
 * ```
 */
export function sumOf<T>(
  array: Iterable<T>,
  selector: (el: T) => number,
): number {
  let sum = 0;

  for (const i of array) {
    sum += selector(i);
  }

  return sum;
}
