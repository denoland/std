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

import { Arr } from "./_type_utils.ts";
import { minOf } from "./min_of.ts";

export function zip<const A extends Arr, const B extends Arr>(
  ...arrays: [A, B]
): Zip2<A, B>;

export function zip<
  const A extends Arr,
  const B extends Arr,
  const C extends Arr,
>(
  ...arrays: [A, B, C]
): Zip3<A, B, C>;

export function zip<T extends unknown[]>(
  ...arrays: { [K in keyof T]: T[K][] }
): T[] {
  const minLength = minOf(arrays, (it) => it.length) ?? 0;

  const ret: T[] = new Array(minLength);

  for (let i = 0; i < minLength; i += 1) {
    const arr = arrays.map((it) => it[i]);
    ret[i] = arr as T;
  }

  return ret;
}

// https://github.com/type-challenges/type-challenges/issues/5619

type Zip2<A extends Arr, B extends Arr, L extends Arr = []> =
  L["length"] extends A["length"] | B["length"] ? L
    : Zip2<A, B, [...L, [A[L["length"]], B[L["length"]]]]>;

type Zip3<A extends Arr, B extends Arr, C extends Arr, L extends Arr = []> =
  L["length"] extends A["length"] | B["length"] | C["length"] ? L
    : Zip3<A, B, C, [...L, [A[L["length"]], B[L["length"]], C[L["length"]]]]>;
