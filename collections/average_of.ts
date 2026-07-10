// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Applies the given selector to all elements in the given collection and
 * calculates the average of the results.
 *
 * @typeParam T The type of the array elements.
 *
 * @param array The array to calculate the average of.
 * @param selector The selector function to get the value to average. The
 * function receives the element and its index.
 *
 * @returns The average of all elements in the collection.
 *
 * @example Basic usage
 * ```ts
 * import { averageOf } from "@std/collections/average-of";
 * import { assertEquals } from "@std/assert";
 *
 * const people = [
 *   { name: "Anna", age: 34 },
 *   { name: "Kim", age: 42 },
 *   { name: "John", age: 23 },
 * ];
 *
 * const averageAge = averageOf(people, (person) => person.age);
 *
 * assertEquals(averageAge, 33);
 * ```
 *
 * @example Using the index parameter
 * ```ts
 * import { averageOf } from "@std/collections/average-of";
 * import { assertEquals } from "@std/assert";
 *
 * const array = [10, 20, 30];
 * const result = averageOf(array, (_, index) => index * 10);
 *
 * assertEquals(result, 10);
 * ```
 */
export function averageOf<T>(
  array: Iterable<T>,
  selector: (el: T, index: number) => number,
): number {
  let sum = 0;
  let count = 0;
  let index = 0;

  for (const i of array) {
    sum += selector(i, index++);
    count++;
  }

  if (count === 0) {
    return NaN;
  }

  return sum / count;
}
