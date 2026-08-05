// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { type StatisticsOptions, variance } from "./variance.ts";

/**
 * Calculates the standard deviation of an array of numbers.
 *
 * By default this returns the sample standard deviation, which divides by
 * `n - 1` to correct for the estimated mean. Pass `{ population: true }` to
 * compute the population standard deviation instead, which divides by `n` and
 * allows a single element (whose standard deviation is `0`).
 *
 * @param numbers The numbers to calculate the standard deviation of
 * @param options Options for the calculation
 * @returns The standard deviation of the numbers
 * @throws {RangeError} If `numbers` is empty, or contains a single element when
 * computing the sample standard deviation
 *
 * @example Sample standard deviation
 * ```ts
 * import { stdDev } from "@std/math/std-dev";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(stdDev([2, 4, 4, 4, 5, 5, 7, 9]), Math.sqrt(32 / 7));
 * ```
 *
 * @example Population standard deviation
 * ```ts
 * import { stdDev } from "@std/math/std-dev";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(stdDev([2, 4, 4, 4, 5, 5, 7, 9], { population: true }), 2);
 * ```
 */
export function stdDev(
  numbers: readonly number[],
  options: StatisticsOptions = {},
): number {
  return Math.sqrt(variance(numbers, options));
}
