// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Returns the first element that is the largest value of the given function or undefined if there are no elements.
 *
 * Example:
 *
 * ```ts
 * import { maxBy } from "./max_by.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const people = [
 *     { name: 'Anna', age: 34 },
 *     { name: 'Kim', age: 42 },
 *     { name: 'John', age: 23 },
 * ];
 *
 * const personWithMaxAge = maxBy(people, i => i.age);
 *
 * assertEquals(personWithMaxAge, { name: 'Kim', age: 42 });
 * ```
 */
export function maxBy<T>(
  collection: readonly T[],
  selector: ((el: T) => number) | ((el: T) => string),
): T | undefined {
  let max: T | undefined = undefined;
  let maxValue: ReturnType<typeof selector> | undefined = undefined;

  for (const current of collection) {
    const currentValue = selector(current);

    if (maxValue === undefined || currentValue > maxValue) {
      max = current;
      maxValue = currentValue;
    }
  }

  return max;
}
