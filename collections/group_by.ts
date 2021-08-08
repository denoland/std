// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Applies the given selector to each element in the given array, returning a Record containing the results as keys
 * and all values that produced that key as values.
 *
 * Example:
 *
 * ```ts
 * import { groupBy } from "./group_by.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * type Person = {
 *   name: string;
 * };
 *
 * const people: Person[] = [
 *     { name: 'Anna' },
 *     { name: 'Arnold' },
 *     { name: 'Kim' },
 * ];
 * const peopleByFirstLetter = groupBy(people, it => it.name.charAt(0))
 *
 * assertEquals(peopleByFirstLetter, {
 *     'A': [ { name: 'Anna' }, { name: 'Arnold' } ],
 *     'K': [ { name: 'Kim' } ],
 * })
 * ```
 */
export function groupBy<T>(
  array: Array<T>,
  selector: (el: T) => string,
): { [key: string]: Array<T> } {
  const ret: { [key: string]: Array<T> } = {};

  for (const element of array) {
    const key = selector(element);

    if (ret[key] === undefined) {
      ret[key] = [element];

      continue;
    }

    ret[key].push(element);
  }

  return ret;
}
