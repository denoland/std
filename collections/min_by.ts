// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Returns the first element that is the smallest value of the given function or undefined if there are no elements.
 *
 * Example:
 *
 * ```ts
 * import { minBy } from "./min_by.ts";
 * import { assertEquals } from "../testing/asserts.ts"
 *
 * const people = [
 *     { name: 'Anna', age: 34 },
 *     { name: 'Kim', age: 42 },
 *     { name: 'John', age: 23 },
 * ];
 *
 * const personWithMinAge = minBy(people, i => i.age);
 *
 * assertEquals(personWithMinAge, { name: 'John', age: 23 });
 * ```
 */
export function minBy<T>(
  collection: readonly T[],
  selector: ((el: T) => number) | ((el: T) => string),
): T | undefined {
  let min: T | undefined = undefined;
  let minValue: ReturnType<typeof selector> | undefined = undefined;

  for (const current of collection) {
    const currentValue = selector(current);

    if (minValue === undefined || currentValue < minValue) {
      min = current;
      minValue = currentValue;
    }
  }

  return min;
}
