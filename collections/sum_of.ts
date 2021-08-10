// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Applies the given selector to all elements in the given collection and calculates the sum of the results
 *
 * Example:
 *
 * ```ts
 * import { sumOf } from "./sum_of.ts"
 * import { assertEquals } from "../testing/asserts.ts"
 *
 * const people = [
 *     { name: 'Anna', age: 34 },
 *     { name: 'Kim', age: 42 },
 *     { name: 'John', age: 23 },
 * ]
 * const totalAge = sumOf(people, i => i.age)
 *
 * assertEquals(totalAge, 99)
 * ```
 */
export function sumOf<T>(
  array: Array<T>,
  selector: (el: T) => number,
): number {
  let sum = 0;

  for (const i of array) {
    sum += selector(i);
  }

  return sum;
}
