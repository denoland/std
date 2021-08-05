// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/** Used as the size to enable large array optimizations. */
const LARGE_ARRAY_SIZE = 200;

/**
 * Returns an array excluding all given values.
 *
 * Example:
 *
 * ```ts
 * import { withoutAll } from "./withoutAll.ts";
 *
 * const withoutList = withoutAll([2, 1, 2, 3], [1, 2]);
 *
 * ```
 */
export function withoutAll<T>(
  array: Array<T>,
  values: Array<T>,
): Array<T> {
  if (array.length >= LARGE_ARRAY_SIZE) {
    const set = new Set<T>();

    for (const element of array) {
      set.add(element);
    }

    array = Array.from(set);
  }
  return array.filter((value) => values.indexOf(value) === -1);
}
