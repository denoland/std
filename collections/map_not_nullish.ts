// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Returns a new array, containing all elements in the given array transformed using the given transformer, except the ones
 * that were transformed to `null` or `undefined`
 *
 * Example:
 *
 * ```ts
 * import { mapNotNullish } from "./map_not_nullish.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const people = [
 *     { middleName: null },
 *     { middleName: 'William' },
 *     { middleName: undefined },
 *     { middleName: 'Martha' },
 * ]
 * const foundMiddleNames = mapNotNullish(people, it => it.middleName)
 *
 * assertEquals(foundMiddleNames, [ 'William', 'Martha' ])
 * ```
 */
export function mapNotNullish<T, O>(
  array: Array<T>,
  transformer: (el: T) => O,
): Array<NonNullable<O>> {
  const ret = new Array<NonNullable<O>>();

  for (const element of array) {
    const transformedElement = transformer(element);

    if (transformedElement !== undefined && transformedElement !== null) {
      ret.push(transformedElement as NonNullable<O>);
    }
  }

  return ret;
}
