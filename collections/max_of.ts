// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Applies the given selector to all elements of the provided collection and
 * returns the max value of all elements. If an empty array is provided the
 * function will return undefined
 *
 * @example
 * ```ts
 * import { maxOf } from "@std/collections/max-of";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const inventory = [
 *   { name: "mustard", count: 2 },
 *   { name: "soy", count: 4 },
 *   { name: "tomato", count: 32 },
 * ];
 *
 * const maxCount = maxOf(inventory, (i) => i.count);
 *
 * assertEquals(maxCount, 32);
 * ```
 */
export function maxOf<T>(
  array: Iterable<T>,
  selector: (el: T) => number,
): number | undefined;
/**
 * Applies the given selector to all elements of the provided collection and
 * returns the max value of all elements. If an empty array is provided the
 * function will return undefined
 *
 * @example
 * ```ts
 * import { maxOf } from "@std/collections/max-of";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const inventory = [
 *   { name: "mustard", count: 2n },
 *   { name: "soy", count: 4n },
 *   { name: "tomato", count: 32n },
 * ];
 *
 * const maxCount = maxOf(inventory, (i) => i.count);
 *
 * assertEquals(maxCount, 32n);
 * ```
 */
export function maxOf<T>(
  array: Iterable<T>,
  selector: (el: T) => bigint,
): bigint | undefined;
export function maxOf<T, S extends (number | bigint)>(
  array: Iterable<T>,
  selector: (el: T) => S,
): S | undefined {
  let maximumValue: S | undefined = undefined;

  for (const i of array) {
    const currentValue = selector(i);

    if (maximumValue === undefined || currentValue > maximumValue) {
      maximumValue = currentValue;
      continue;
    }

    if (Number.isNaN(currentValue)) {
      return currentValue;
    }
  }

  return maximumValue;
}
