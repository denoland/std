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
  tuples: Readonly<T>
): unknown[][] {
  if (tuples.length === 0) return [];

  const ret = [];
  for (let i = 0; i < tuples[0].length; i++) {
    let curr = [];
    for (const tuple of tuples) {
      curr.push(tuple[i]);
    }
    ret.push(curr);
  }
  return ret;
}
