// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Returns all elements in the given collection, sorted by their result using the given selector
 *
 * Example:
 *
 * ```ts
 * import { sortBy } from "./sort_by.ts"
 *
 * const people = [
 *     { name: 'Anna', age: 34 },
 *     { name: 'Kim', age: 42 },
 *     { name: 'John', age: 23 },
 * ]
 * const sortedByAge = sortBy(people, it => it.age)
 *
 * console.assert(sortedByAge === [
 *     { name: 'John', age: 23 },
 *     { name: 'Anna', age: 34 },
 *     { name: 'Kim', age: 42 },
 * ])
 * ```
 */
export function sortBy<T>(
  array: Array<T>,
  selector:
    | ((el: T) => number)
    | ((el: T) => string)
    | ((el: T) => bigint)
    | ((el: T) => Date),
): Array<T> {
  const ret = Array.from(array);

  return ret.sort((a, b) => {
    const selectedA = selector(a);
    const selectedB = selector(b);

    if (selectedA > selectedB) {
      return 1;
    }

    if (selectedA < selectedB) {
      return -1;
    }

    return 0;
  });
}
