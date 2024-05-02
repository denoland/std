// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Applies the given selector to all elements of the given collection and
 * returns the min value of all elements. If an empty array is provided the
 * function will return undefined.
 *
 * @example
 * ```ts
 * import { minOf } from "@std/collections/min-of";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const inventory = [
 *   { name: "mustard", count: 2 },
 *   { name: "soy", count: 4 },
 *   { name: "tomato", count: 32 },
 * ];
 * const minCount = minOf(inventory, (i) => i.count);
 *
 * assertEquals(minCount, 2);
 * ```
 */
export function minOf<T>(
  array: Iterable<T>,
  selector: (el: T) => number,
): number | undefined;
/**
 * Applies the given selector to all elements of the given collection and
 * returns the min value of all elements. If an empty array is provided the
 * function will return undefined.
 *
 * @example
 * ```ts
 * import { minOf } from "@std/collections/min-of";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const inventory = [
 *   { name: "mustard", count: 2n },
 *   { name: "soy", count: 4n },
 *   { name: "tomato", count: 32n },
 * ];
 * const minCount = minOf(inventory, (i) => i.count);
 *
 * assertEquals(minCount, 2n);
 * ```
 */
export function minOf<T>(
  array: Iterable<T>,
  selector: (el: T) => bigint,
): bigint | undefined;
export function minOf<T, S extends (number | bigint)>(
  array: Iterable<T>,
  selector: (el: T) => S,
): S | undefined {
  let minimumValue: S | undefined = undefined;

  for (const i of array) {
    const currentValue = selector(i);

    if (minimumValue === undefined || currentValue < minimumValue) {
      minimumValue = currentValue;
      continue;
    }

    if (Number.isNaN(currentValue)) {
      return currentValue;
    }
  }

  return minimumValue;
}
