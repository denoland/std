// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { sum } from "./sum.ts";

/**
 * Calculates the arithmetic mean of an array of numbers.
 *
 * @param numbers The numbers to calculate the mean of
 * @returns The arithmetic mean of the numbers
 * @throws {RangeError} If `numbers` is empty
 *
 * @example Usage
 * ```ts
 * import { mean } from "@std/math/mean";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(mean([1, 2, 3, 4]), 2.5);
 * ```
 */
export function mean(numbers: readonly number[]): number {
  if (numbers.length === 0) {
    throw new RangeError("`numbers` must contain at least one element");
  }
  return sum(numbers) / numbers.length;
}
