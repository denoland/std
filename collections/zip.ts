// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Builds N-tuples of elements from the given N arrays with matching indices,
 * stopping when the smallest array's end is reached.
 *
 * @example
 * ```ts
 * import { zip } from "https://deno.land/std@$STD_VERSION/collections/zip.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const numbers = [1, 2, 3, 4];
 * const letters = ["a", "b", "c", "d"];
 * const pairs = zip(numbers, letters);
 *
 * assertEquals(
 *   pairs,
 *   [
 *     [1, "a"],
 *     [2, "b"],
 *     [3, "c"],
 *     [4, "d"],
 *   ],
 * );
 * ```
 */

import { minOf } from "./min_of.ts";

export function zip<const T extends ReadonlyArray<ReadonlyArray<unknown>>>(
  ...arrays: T
): Zip<T> {
  const minLength = minOf(arrays, (it) => it.length) ?? 0;

  const ret: unknown[][] = new Array(minLength);

  for (let i = 0; i < minLength; i += 1) {
    const arr = arrays.map((it) => it[i]);
    ret[i] = arr;
  }

  return ret as Zip<T>;
}

export type Zip<
  M extends ReadonlyArray<ReadonlyArray<unknown>>,
  R = ShortestArray<DeepWriteable<M>>,
> = DeepWriteable<
  { [X in keyof R]: { [Y in keyof M]: X extends keyof M[Y] ? M[Y][X] : never } }
>;

/** find the shortest Array */
type ShortestArray<T extends unknown[][]> = T extends [infer A] ? A
  : T extends [infer A extends unknown[], ...infer B extends unknown[][]]
    ? Shorter<A, ShortestArray<B>> extends true ? A : ShortestArray<B>
  : [];

/** whether the length of A is less than the length of B */
type Shorter<A extends unknown[], B extends unknown[]> = A extends [] ? true
  : B extends [] ? false
  : A extends [unknown, ...infer Ra]
    ? B extends [unknown, ...infer Rb] ? Shorter<Ra, Rb> : never
  : never;

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };
