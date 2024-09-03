// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import type { RandomOptions } from "./_types.ts";
import { randomBetween } from "./between.ts";

/**
 * Generates a random integer between the provided minimum and maximum values.
 *
 * The number is in the range `[min, max]`, i.e. both `min` and `max` are included.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param min The minimum value (inclusive)
 * @param max The maximum value (inclusive)
 * @param options The options for the random number generator
 * @returns A random integer between the provided minimum and maximum values
 *
 * @example Usage
 * ```ts no-assert
 * import { randomIntegerBetween } from "@std/random";
 *
 * randomIntegerBetween(1, 10); // 7
 * randomIntegerBetween(1, 10); // 9
 * randomIntegerBetween(1, 10); // 2
 * ```
 */
export function randomIntegerBetween(
  min: number,
  max: number,
  options?: RandomOptions,
): number {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new RangeError("min and max must be finite");
  }

  const opts = { prng: Math.random, ...options };
  return Math.floor(randomBetween(Math.ceil(min), Math.floor(max) + 1, opts));
}