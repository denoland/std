// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Calculates the median of an array of numbers.
 *
 * @param numbers The numbers to calculate the median of
 * @returns The median of the numbers
 * @throws {RangeError} If `numbers` is empty
 *
 * If `numbers` contains `NaN`, the result is `NaN`. If `numbers` contains
 * `Infinity` or `-Infinity`, the result reflects the non-finite value(s).
 *
 * @example Usage
 * ```ts
 * import { median } from "@std/math/median";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(median([1, 2, 3, 4, 5]), 3);
 * assertEquals(median([1, 2, 3, 4]), 2.5);
 * ```
 */
export function median(numbers: readonly number[]): number {
  if (numbers.length === 0) {
    throw new RangeError("`numbers` must contain at least one element");
  }
  // Sorting with a NaN-returning comparator is implementation-defined, so
  // propagate NaN deterministically instead.
  if (numbers.some(Number.isNaN)) return NaN;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}
