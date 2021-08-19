// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Applies the given selector to all elements of the given collection and returns the max value of all elements
 *
 * Example:
 *
 * ```ts
 * import { sumOf } from "./sum_of.ts"
 * import { assertEquals } from "../testing/asserts.ts"
 *
 * const inventory = [
 *      { name: "mustard", count: 2 },
 *      { name: "soy", count: 4 },
 *      { name: "tomato", count: 32 },
 *  ];
 * const maxCount = maxOf(inventory, (i) => i.count);
 *
 * assertEquals(maxItem, 32);
 * ```
 */
export function maxOf<T>(
  array: readonly T[],
  selector: (el: T) => number,
): number;

export function maxOf<T>(
  array: readonly T[],
  selector: (el: T) => bigint,
): bigint;

export function maxOf<T, S extends ((el: T) => number) | ((el: T) => bigint)>(
  array: readonly T[],
  selector: S,
): ReturnType<S> | undefined {
  let maxOf: ReturnType<S> | undefined = undefined;

  for (const i of array) {
    const currentValue = selector(i) as ReturnType<S>;

    if (maxOf === undefined || currentValue > maxOf) {
      maxOf = currentValue;
    }

    if (Number.isNaN(currentValue)) {
      return currentValue;
    }
  }

  return maxOf;
}
