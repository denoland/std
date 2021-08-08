// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { Selector } from "./types.ts";

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
  array: Array<T>,
  selector:
    | Selector<T, number>
    | Selector<T, string>
    | Selector<T, bigint>
    | Selector<T, Date>,
): Array<T> {
  return Array.from(array).sort((a, b) => {
    const selectedA = selector(a);
    const selectedB = selector(b);

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
  });
}
