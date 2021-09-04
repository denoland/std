// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Builds two separate arrays from the given array of 2-tuples, with the first returned array holding all first
 * tuple elements and the second one holding all the second elements
 *
 * Example:
 *
 * ```ts
 * import { unzip } from "./unzip.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const parents = [
 *     [ 'Maria', 'Jeff' ],
 *     [ 'Anna', 'Kim' ],
 *     [ 'John', 'Leroy' ],
 * ] as [string, string][];
 *
 * const [ moms, dads ] = unzip(parents)
 *
 * assertEquals(moms, [ 'Maria', 'Anna', 'John' ])
 * assertEquals(moms, [ 'Jeff', 'Kim', 'Leroy' ])
 * ```
 */

export function unzip<T extends unknown[][]>(
  ...tuples: Readonly<T>
): unknown[][] {
  if (tuples.length === 0) return [];
  const length = tuples[0].length;
  const ret: [...unknown[]] = new Array(length);

  for (let i = 0; i < length; i++) {
    const res = [];
    for (const tuple of tuples) {
      res.push(tuple[i]);
    }
    ret[i] = res;
  }

  return ret as T;
}
