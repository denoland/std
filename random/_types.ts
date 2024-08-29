// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * A function implementing the same contract as `Math.random`, i.e. returning a
 * random number in the range [0, 1).
 */
export type Prng = typeof Math.random;

/**
 * Options for random number generation.
 */
export type RandomOptions = {
  /**
   * A function returning a random number between 0 and 1, used for
   * randomization.
   * @default {Math.random}
   */
  random: Prng;
};

export const defaultOptions: RandomOptions = {
  random: Math.random,
};
