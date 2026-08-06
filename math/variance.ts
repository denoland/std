// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { sum } from "./sum.ts";

/**
 * Options for {@linkcode variance} and {@linkcode stdDev}.
 */
export interface StatisticsOptions {
  /**
   * Whether to calculate the population variance, which divides by the number
   * of elements (`n`), instead of the sample variance, which divides by
   * `n - 1`. Defaults to `false`.
   */
  population?: boolean;
}

/**
 * Calculates the variance of an array of numbers.
 *
 * By default this returns the sample variance, which divides by `n - 1` to
 * correct for the estimated mean. Pass `{ population: true }` to compute the
 * population variance instead, which divides by `n` and allows a single
 * element (whose variance is `0`).
 *
 * @param numbers The numbers to calculate the variance of
 * @param options Options for the calculation
 * @returns The variance of the numbers
 * @throws {RangeError} If `numbers` is empty, or contains a single element when
 * computing the sample variance
 *
 * @example Sample variance
 * ```ts
 * import { variance } from "@std/math/variance";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(variance([2, 4, 4, 4, 5, 5, 7, 9]), 32 / 7);
 * ```
 *
 * @example Population variance
 * ```ts
 * import { variance } from "@std/math/variance";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(variance([2, 4, 4, 4, 5, 5, 7, 9], { population: true }), 4);
 * ```
 */
export function variance(
  numbers: readonly number[],
  options: StatisticsOptions = {},
): number {
  if (numbers.length === 0) {
    throw new RangeError("`numbers` must contain at least one element");
  }
  if (!options.population && numbers.length === 1) {
    throw new RangeError("`numbers` must contain at least two elements");
  }
  // The mean is computed in a separate pass so squared deviations use a stable
  // center. Computing E[x^2] - E[x]^2 instead suffers from catastrophic
  // cancellation when the mean is large relative to the spread.
  const avg = sum(numbers) / numbers.length;
  let sumSquaredDeviation = 0;
  for (const n of numbers) sumSquaredDeviation += (n - avg) ** 2;
  // Sample variance divides by n - 1 (Bessel's correction) to correct for the
  // estimated mean; population variance divides by n.
  return options.population
    ? sumSquaredDeviation / numbers.length
    : sumSquaredDeviation / (numbers.length - 1);
}
