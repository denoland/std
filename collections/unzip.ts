// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { Arr } from "./_type_utils.ts";

/**
 * Builds two separate arrays from the given array of 2-tuples, with the first
 * returned array holding all first tuple elements and the second one holding
 * all the second elements.
 *
 * ```ts
 * import { unzip } from "https://deno.land/std@$STD_VERSION/collections/unzip.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const parents = [
 *   ["Maria", "Jeff"],
 *   ["Anna", "Kim"],
 *   ["John", "Leroy"],
 * ] as [string, string][];
 *
 * const [moms, dads] = unzip(parents);
 *
 * assertEquals(moms, ["Maria", "Anna", "John"]);
 * assertEquals(dads, ["Jeff", "Kim", "Leroy"]);
 * ```
 */
export function unzip<T extends Zipped>(pairs: T): Unzip<T>;
export function unzip<T, U>(pairs: readonly [T, U][]): [T[], U[]] {
  const { length } = pairs;
  const ret: [T[], U[]] = [
    Array.from({ length }),
    Array.from({ length }),
  ];

  pairs.forEach(([first, second], index) => {
    ret[0][index] = first;
    ret[1][index] = second;
  });

  return ret;
}

type Zipped = readonly (readonly [unknown, unknown])[];
type ExtractFirstElements<T extends Zipped> = {
  [K in keyof T]: T[K] extends readonly [infer U, unknown] ? U : never;
};
type ExtractSecondElements<T extends Zipped> = {
  [K in keyof T]: T[K] extends readonly [unknown, infer U] ? U : never;
};

type Unzip<T extends Zipped> = [
  ExtractFirstElements<T>,
  ExtractSecondElements<T>,
];
