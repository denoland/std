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

/** An integer typed array */
export type IntegerTypedArray =
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Uint8ClampedArray
  | BigInt64Array
  | BigUint64Array;

/**
 * A pseudo-random number generator implementing the same contract as
 * `crypto.getRandomValues`, i.e. taking a typed array and mutating it by
 * filling it with random bytes, returning the mutated typed array instance.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type RandomValueGenerator = typeof crypto.getRandomValues;

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
