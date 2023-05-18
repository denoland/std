// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { Arr } from "./_type_utils.ts";

/**
 * Returns all distinct elements in the given array, preserving order by first
 * occurrence.
 *
 * @example
 * ```ts
 * import { distinct } from "https://deno.land/std@$STD_VERSION/collections/distinct.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const numbers = [3, 2, 5, 2, 5];
 * const distinctNumbers = distinct(numbers);
 *
 * assertEquals(distinctNumbers, [3, 2, 5]);
 * ```
 */
export function distinct<const T extends Arr>(array: T): Distinct<T>;
export function distinct<T>(array: readonly T[]): T[] {
  const set = new Set(array);

  return Array.from(set);
}

// https://github.com/type-challenges/type-challenges/issues/14151
// deno-fmt-ignore
type Distinct<T extends Arr, R extends Arr = []> =
  T extends readonly [infer Head, ...infer Tail]
    ? Distinct<Tail, Head extends R[number]
      ? R
      : [...R, Head]>
  : R;
