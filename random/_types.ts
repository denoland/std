// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * A pseudo-random number generator implementing the same contract as
 * `Math.random`, i.e. taking zero arguments and returning a random number in
 * the range `[0, 1)`. The behavior of a function that accepts a `Prng` an
 * option may be customized by passing a `Prng` with different behavior from
 * `Math.random`, for example it may be seeded.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type Prng = typeof Math.random;

/**
 * A pseudo-random number generator implementing the same contract as
 * `crypto.getRandomValues`, i.e. taking a `Uint8Array` and mutating it by
 * filling it with random bytes, returning the mutated `Uint8Array` instance.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type ByteGenerator = <T extends Uint8Array>(bytes: T) => T;

/**
 * Options for random number generation.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type RandomOptions = {
  /**
   * A pseudo-random number generator returning a random number in the range
   * `[0, 1)`, used for randomization.
   * @default {Math.random}
   */
  prng?: Prng;
};
