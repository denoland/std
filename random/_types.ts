// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * A pseudo-random number generator implementing the same contract as
 * `Math.random`, i.e. taking zero arguments and returning a random number in
 * the range `[0, 1)`. The behavior of a function that accepts a `Prng` an
 * option may be customized by passing a `Prng` with different behavior from
 * `Math.random`, for example it may be seeded.
 */
export type Prng = typeof Math.random;

/**
 * Options for random number generation.
 */
export type RandomOptions = {
  /**
   * A pseudo-random number generator returning a random number in the range
   * `[0, 1)`, used for randomization.
   * @default {Math.random}
   */
  prng: Prng;
};
