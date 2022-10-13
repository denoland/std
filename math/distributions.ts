// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/** Math functions for generating distributions,
 * @module
 */

const TWO_PI = Math.PI * 2;

/**
 * @property min Lower limit of range.
 * @property max Upper limit of range.
 * @property inclusive Whether the range is inclusive.
 */
export interface RangeOptions {
  min: number;
  max: number;
}

const BASE_RANGE_OPTIONS: RangeOptions = {
  min: 0,
  max: 1,
};

/**
 * Get a range of n evenly distributed numbers in ascending order.
 * @param n Number of numbers to generate.
 * @param options Options to consider
 * @returns Array of n evenly distributed numbers.
 * @example ```ts
 * import { uniformRange } from "https://deno.land/std/math/distributions.ts";
 *
 * const range = uniformRange(100, {
 *   min: 0,
 *   max: 100,
 * })
 * ```
 */
export function uniformRange(
  n: number,
  options: RangeOptions = BASE_RANGE_OPTIONS,
): number[] {
  if (typeof n !== "number" || n <= 0 || !Number.isInteger(n)) return [];
  const step = (options.min < options.max)
    ? (options.max - options.min) / (n - 1)
    : (options.max - options.min) / (1 - n);
  const res = new Array(n);
  let i = 0;
  while (i < n) {
    res[i] = options.min + (i * step);
    i += 1;
  }
  return res;
}

/**
 * Generate one element in a normal distribution.
 * @param mean Mean of the distribution μ.
 * @param stddev Standard deviation of the distribution σ.
 * @returns One element in the gaussian distribution.
 */
function getNormalPoint(
  mean: number,
  stddev: number,
): number {
  const u = [Math.random(), Math.random()];

  const m = Math.sqrt(-2.0 * Math.log(u[0]));
  let res = (stddev * m * Math.cos(TWO_PI * u[1])) +
    (stddev * m * Math.sin(TWO_PI * u[1]));
  res = res / 20;
  return res + mean;
}

/**
 * Generate a normally distributed array.
 * @param mean Mean of the distribution μ.
 * @param variance Variance of the distribution σ^2.
 * @returns A normal (Gaussian) distribution.
 * @example ```ts
 * import { normalDistribution } from "https://deno.land/std/math/distributions.ts";
 *
 * const distribution = normalDistribution(100, 16, 0.003)
 * ```
 */
export function normalDistribution(
  num: number,
  mean: number,
  variance: number,
): number[] {
  const result = new Array(num);
  // calculate standard deviation
  const stddev = Math.sqrt(variance);
  let i = 0;
  while (i < num) {
    result[i] = getNormalPoint(mean, stddev);
    i += 1;
  }
  return result;
}
