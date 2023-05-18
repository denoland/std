// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { Arr } from "./_type_utils.ts";

/**
 * Returns an array excluding all given values.
 *
 * @example
 * ```ts
 * import { withoutAll } from "https://deno.land/std@$STD_VERSION/collections/without_all.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const withoutList = withoutAll([2, 1, 2, 3], [1, 2]);
 *
 * assertEquals(withoutList, [3]);
 * ```
 */
export function withoutAll<const T extends Arr, const U extends Arr>(
  array: T,
  values: U,
): WithoutAll<T, U>;
export function withoutAll<T>(array: readonly T[], values: readonly T[]): T[] {
  const toExclude = new Set(values);
  return array.filter((it) => !toExclude.has(it));
}

// https://github.com/type-challenges/type-challenges/issues/14118

type ToUnion<T> = T extends Arr ? T[number] : T;

type Includes<T extends Arr, U> = U extends ToUnion<T> ? true : false;

// deno-fmt-ignore
type WithoutAll<T extends Arr, U extends Arr> =
  T extends readonly [infer R, ...infer F]
    ? Includes<U, R> extends true
      ? WithoutAll<F, U>
      : [R, ...WithoutAll<F, U>]
    : T
