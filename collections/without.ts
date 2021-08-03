// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Returns an array excluding single given value.
 *
 * Example:
 *
 * ```ts
 * import { without } from "./without.ts";
 *
 * const withoutList = without([1,2,3], 1);
 *
 * console.assert(withoutList.length === 2)
 * ```
 */
export function without<T>(
  array: Array<T>,
  value: T,
): Array<T> {
  return array.filter((element) => value !== element);
}
