// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Clamp a number within the inclusive [min, max] range.
 *
 * @param num The number to be clamped
 * @param limits The inclusive [min, max] range
 * @returns The clamped number
 *
 * @example Usage
 * ```ts
 * import { clamp } from "@std/math/clamp";
 * import { assertEquals } from "@std/assert";
 * assertEquals(clamp(5, [1, 10]), 5);
 * assertEquals(clamp(-5, [1, 10]), 1);
 * assertEquals(clamp(15, [1, 10]), 10);
 * ```
 */
export function clamp(num: number, limits: [min: number, max: number]): number {
  const [min, max] = limits;
  if (min > max) {
    throw new RangeError("`min` must be less than or equal to `max`");
  }

  return Math.min(Math.max(num, min), max);
}
