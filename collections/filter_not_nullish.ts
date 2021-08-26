// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Returns all elements in the given collection that are neither `null` or `undefined`
 *
 * Example:
 *
 * ```ts
 * import { filterNotNullish } from "./filter_not_nullish.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const middleNames = [ null, 'William', undefined, 'Martha' ]
 *
 * assertEquals(filterNotNullish(middleNames), [ 'William', 'Martha' ])
 * ```
 */
export function filterNotNullish<T>(
  array: readonly T[],
): NonNullable<T>[] {
  return array.filter((it) => it !== undefined && it !== null) as NonNullable<
    T
  >[];
}
