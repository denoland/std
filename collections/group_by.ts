// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Applies the given selector to each element in the given array, returning a Record containing the results as keys
 * and all values that produced that key as values.
 *
 * Example:
 *
 * ```ts
 * import { groupBy } from "https://deno.land/std@$STD_VERSION/collections/group_by.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
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
export function groupBy<T, K extends string>(
  array: readonly T[],
  selector: (el: T) => K,
): Partial<Record<K, T[]>> {
  const ret: Partial<Record<K, T[]>> = {};

  for (const element of array) {
    const key = selector(element);
    const arr = ret[key] ??= [] as T[];
    arr.push(element);
  }

  return ret;
}
