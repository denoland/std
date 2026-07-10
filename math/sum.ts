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
  for (const n of numbers) total += n;
  return total;
}
