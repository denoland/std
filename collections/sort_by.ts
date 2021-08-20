// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Returns all elements in the given collection, sorted stably by their result using the given selector
 *
 * Example:
 *
 * ```ts
 * import { sortBy } from "./sort_by.ts"
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const people = [
 *     { name: 'Anna', age: 34 },
 *     { name: 'Kim', age: 42 },
 *     { name: 'John', age: 23 },
 * ]
 * const sortedByAge = sortBy(people, it => it.age)
 *
 * assertEquals(sortedByAge, [
 *     { name: 'John', age: 23 },
 *     { name: 'Anna', age: 34 },
 *     { name: 'Kim', age: 42 },
 * ])
 * ```
 */
export function sortBy<T>(
  array: readonly T[],
  selector:
    | ((el: T) => number)
    | ((el: T) => string)
    | ((el: T) => bigint)
    | ((el: T) => Date),
): T[] {
  return array.map((value) => ({ value, selected: selector(value) }))
    .sort((a, b) => {
      const selectedA = a.selected;
      const selectedB = b.selected;

      if (typeof selectedA === "number") {
        if (Number.isNaN(selectedA)) {
          return 1;
        }

        if (Number.isNaN(selectedB)) {
          return -1;
        }
      }

      if (selectedA > selectedB) {
        return 1;
      }

      if (selectedA < selectedB) {
        return -1;
      }

      return 0;
    }).map((element) => element.value);
}
