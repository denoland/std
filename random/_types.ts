// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Proxy type of {@code Uint8Array<ArrayBuffer>} or {@code Uint8Array} in TypeScript 5.7 or below respectively.
 *
 * This type is internal utility type and should not be used directly.
 *
 * @internal @private
 */

export type Uint8Array_ = ReturnType<Uint8Array["slice"]>;

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
  | ReturnType<Int8Array["slice"]>
  | ReturnType<Int16Array["slice"]>
  | ReturnType<Int32Array["slice"]>
  | ReturnType<Uint8Array["slice"]>
  | ReturnType<Uint16Array["slice"]>
  | ReturnType<Uint32Array["slice"]>
  | ReturnType<Uint8ClampedArray["slice"]>
  | ReturnType<BigInt64Array["slice"]>
  | ReturnType<BigUint64Array["slice"]>;

/**
 * A pseudo-random number generator implementing the same contract as
 * `crypto.getRandomValues`, i.e. taking a typed array and mutating it by
 * filling it with random bytes, returning the mutated typed array instance.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type RandomValueGenerator = <T extends IntegerTypedArray>(arr: T) => T;

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
