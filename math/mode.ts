// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Calculates the mode of an array of numbers.
 *
 * If there are multiple modes (multimodal), all of them are returned.
 *
 * @param numbers The numbers to calculate the mode of
 * @returns An array of the most frequent value(s)
 *
 * @example Usage
 * ```ts
 * import { mode } from "@std/math/mode";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(mode([1, 2, 2, 3, 4]), [2]);
 * assertEquals(mode([1, 1, 2, 2, 3]), [1, 2]);
 * ```
 */
export function mode(numbers: readonly number[]): number[] {
  if (numbers.length === 0) {
    throw new RangeError("`numbers` must contain at least one element");
  }
  const counts = new Map<number, number>();
  for (const n of numbers) {
    counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  let maxCount = 0;
  const result: number[] = [];
  for (const [value, count] of counts) {
    if (count > maxCount) {
      result.length = 0;
      result.push(value);
      maxCount = count;
    } else if (count === maxCount) {
      result.push(value);
    }
  }
  return result;
}
