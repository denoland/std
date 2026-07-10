// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Returns a random integer between `min` and `max` (inclusive).
 *
 * @param min The minimum integer (inclusive)
 * @param max The maximum integer (inclusive)
 * @returns A random integer between min and max
 *
 * @example Usage
 * ```ts
 * import { randomInt } from "@std/math/random-int";
 * import { assert } from "@std/assert";
 *
 * const val = randomInt(1, 6);
 * assert(val >= 1 && val <= 6);
 * ```
 */
export function randomInt(min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new RangeError("`min` and `max` must be integers");
  }
  if (min > max) {
    throw new RangeError("`min` must be less than or equal to `max`");
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
