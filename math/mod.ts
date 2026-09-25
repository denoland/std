// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Utility functions for common mathematical and statistical operations.
 *
 * Functions that reduce an array to a single statistic require enough elements
 * for that statistic to be well-defined: `mean`, `median`, and `mode` throw on
 * an empty array, and `variance` and `stdDev` throw unless the array has at
 * least two elements (or at least one with `{ population: true }`). `sum` is
 * the exception and returns the additive identity `0` for an empty array.
 *
 * `gcd` and `lcm` throw on non-integer input. In the remaining functions,
 * non-finite input propagates, so results may be `NaN` or `Infinity`.
 *
 * ```ts
 * import { clamp, modulo } from "@std/math";
 * import { assertEquals } from "@std/assert";
 *
 * for (let n = -3; n <= 3; ++n) {
 *  const val = n * 12 + 5;
 *  // 5 o'clock is always 5 o'clock, no matter how many twelve-hour cycles you add or remove
 *  assertEquals(modulo(val, 12), 5);
 *  assertEquals(clamp(val, 0, 11), n === 0 ? 5 : n > 0 ? 11 : 0);
 * }
 * ```
 *
 * @module
 */

export * from "./clamp.ts";
export * from "./deg_to_rad.ts";
export * from "./gcd.ts";
export * from "./lcm.ts";
export * from "./lerp.ts";
export * from "./mean.ts";
export * from "./median.ts";
export * from "./mode.ts";
export * from "./modulo.ts";
export * from "./rad_to_deg.ts";
export * from "./round_to.ts";
export * from "./std_dev.ts";
export * from "./sum.ts";
export * from "./variance.ts";
