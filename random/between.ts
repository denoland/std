// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { defaultOptions, type RandomOptions } from "./_types.ts";
export type { RandomOptions };

/**
 * Generates a random number between the provided minimum and maximum values.
 *
 * The number is in the range `[min, max)`, i.e. `min` is included but `max` is excluded.
 *
 * @param min - The minimum value (inclusive)
 * @param max - The maximum value (exclusive)
 * @param options - The options for the random number generator
 * @returns A random number between the provided minimum and maximum values
 *
 * @example Usage
 * ```ts no-assert
 * import { randomBetween } from "@std/random";
 *
 * randomBetween(1, 10); // 6.688009464410508
 * randomBetween(1, 10); // 3.6267118101712006
 * randomBetween(1, 10); // 7.853320239013774
 * ```
 */
export function randomBetween(
  min: number,
  max: number,
  options?: RandomOptions,
): number {
  if (isNaN(min)) {
    throw new RangeError("min cannot be NaN");
  }
  if (isNaN(max)) {
    throw new RangeError("max cannot be NaN");
  }
  if (max < min) {
    throw new RangeError("max must be greater than or equal to min");
  }

  const { random } = { ...defaultOptions, ...options };
  return random() * (max - min) + min;
}

/**
 * Generates a random integer between the provided minimum and maximum values.
 *
 * The number is in the range `[min, max]`, i.e. both `min` and `max` are included.
 *
 * @param min - The minimum value (inclusive)
 * @param max - The maximum value (inclusive)
 * @param options - The options for the random number generator
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
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new RangeError("min and max must be integers");
  }

  const opts = { ...defaultOptions, ...options };
  return Math.floor(randomBetween(min, max + 1, opts));
}
