// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Builds a new Record using the given array as keys and choosing a value for each
 * key using the given selector.
 *
 * Example:
 *
 * ```ts
 * import { associateWith } from "./associate_with.ts"
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const names = [ 'Kim', 'Lara', 'Jonathan' ]
 * const namesToLength = associateWith(names, it => it.length)
 *
 * assertEquals(namesToLength, {
 *   'Kim': 3,
 *   'Lara': 4,
 *   'Jonathan': 8,
 * })
 *
 * ```
 */
export function associateWith<T>(
  array: readonly string[],
  selector: (key: string) => T,
): Record<string, T> {
  const ret: Record<string, T> = {};

  for (const element of array) {
    const selectedValue = selector(element);

    ret[element] = selectedValue;
  }

  return ret;
}
