// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Calculates the standard deviation of an array of numbers.
 *
 * @param numbers The numbers to calculate the standard deviation of
 * @returns The standard deviation of the numbers
 *
 * @example Usage
 * ```ts
 * import { stdDev } from "@std/math/std-dev";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(stdDev([2, 4, 4, 4, 5, 5, 7, 9]), 2);
 * ```
 */
export function stdDev(numbers: readonly number[]): number {
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
  return Math.sqrt(sumSqDiff / numbers.length);
}
