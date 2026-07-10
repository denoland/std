// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Calculates the variance of an array of numbers.
 *
 * @param numbers The numbers to calculate the variance of
 * @returns The variance of the numbers
 *
 * @example Usage
 * ```ts
 * import { variance } from "@std/math/variance";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(variance([2, 4, 4, 4, 5, 5, 7, 9]), 4);
 * ```
 */
export function variance(numbers: readonly number[]): number {
  if (numbers.length < 2) {
    throw new RangeError(
      "`numbers` must contain at least two elements",
    );
  }
  let total = 0;
  for (const n of numbers) total += n;
  const avg = total / numbers.length;
  let sumSqDiff = 0;
  for (const n of numbers) sumSqDiff += (n - avg) ** 2;
  return sumSqDiff / numbers.length;
}
