// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Calculates the sum of an array of numbers.
 *
 * @param numbers The numbers to calculate the sum of
 * @returns The sum of the numbers
 *
 * @example Usage
 * ```ts
 * import { sum } from "@std/math/sum";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(sum([1, 2, 3, 4]), 10);
 * ```
 */
export function sum(numbers: readonly number[]): number {
  let total = 0;
  // Neumaier's compensated summation: keep a running correction for the low
  // order bits lost by rounding, so mixed-magnitude inputs do not drift.
  let correction = 0;
  for (const n of numbers) {
    const t = total + n;
    if (Math.abs(total) >= Math.abs(n)) {
      correction += (total - t) + n;
    } else {
      correction += (n - t) + total;
    }
    total = t;
  }
  return Number.isFinite(total) ? total + correction : total;
}
