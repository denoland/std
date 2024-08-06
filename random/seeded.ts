// // Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

const U64_CEIL = 2n ** 64n;
const U32_CEIL = 2n ** 32n;
const U64_MAX = U64_CEIL - 1n;

// arbitrary odd value (example from https://en.wikipedia.org/wiki/Permuted_congruential_generator)
const DEFAULT_INC = 1442695040888963407n;
// arbitrary large value
const DEFAULT_XOR = 7242445682386361366n;

/**
 * A 2-tuple state for a {@linkcode SeededPrng}.
 */
export type State = [state: bigint, inc: bigint];

/**
 * Options for {@linkcode SeededPrng}.
 */
type SeededPrngOptions = {
  /**
   * The seed for the random number generator.
   *
   * - If a `bigint`, the seed will be used to initialize the state and increment.
   * - If a `State` 2-tuple, the first element will be directly used as the state and the second as the increment.
   */
  seed: bigint | Readonly<State>;
};

/**
 * A seeded pseudo-random number generator, implementing the
 * {@link https://en.wikipedia.org/wiki/Permuted_congruential_generator | PCG32}
 * algorithm.
 *
 * @example Usage
 * ```ts
 * import { SeededPrng } from "@std/random";
 * import { assertEquals } from "@std/assert";
 *
 * const prng = new SeededPrng({ seed: 3377567226465013078n });
 *
 * assertEquals(prng.random(), 0.3960897452197969);
 * assertEquals(prng.random(), 0.4801766681484878);
 * assertEquals(prng.random(), 0.1936694176401943);
 * ```
 */
export class SeededPrng {
  #state: bigint;
  #inc: bigint;

  /**
   * Constructs a new instance.
   *
   * @param seed - The seed for the random number generator, which can be
   * either a 2-tuple of bigints or a single bigint, which
   * will be converted to a state 2-tuple.
   *
   * @example Usage
   * ```ts no-assert
   * import { SeededPrng } from "@std/random";
   * const prng = new SeededPrng({ seed: 14614327452668470620n });
   * ```
   */
  constructor({ seed }: SeededPrngOptions) {
    this.#inc = -1n;
    this.#state = -1n;

    this.state = typeof seed === "bigint"
      ? SeededPrng.#seedToState(seed)
      : seed;

    // For convenience, allowing destructuring and direct usage in callbacks
    // equivalently to Math.random()
    this.random = this.random.bind(this);
  }

  /**
   * The state for the random number generator.
   * @returns The state as a 2-tuple.
   *
   * @example Usage
   * ```ts
   * import { SeededPrng } from "@std/random";
   * import { assertEquals } from "@std/assert";
   *
   * const prng = new SeededPrng({ seed: 14614327452668470620n });
   * assertEquals(prng.state, [3096394406033028526n, 18007031919395182301n]);
   * ```
   */
  get state(): Readonly<State> {
    return [this.#state, this.#inc];
  }

  set state(value: Readonly<State>) {
    this.#state = value[0] & U64_MAX;
    this.#inc = (value[1] | 1n) & U64_MAX;
  }

  /**
   * Generates a random number using the current state of the prng.
   * @returns A random number between 0 and 1
   *
   * @example Usage
   * ```ts
   * import { SeededPrng } from "@std/random";
   * import { assertEquals } from "@std/assert";
   *
   * const prng = new SeededPrng({ seed: 3377567226465013078n });
   *
   * assertEquals(prng.random(), 0.3960897452197969);
   * assertEquals(prng.random(), 0.4801766681484878);
   * assertEquals(prng.random(), 0.1936694176401943);
   * ```
   */
  random(): number {
    return uint32ToFloat64(this.#randomUint32());
  }

  /**
   * Generates a new seed from the current prng that can be used to create a new prng.
   * @returns The new seed
   *
   * @example Usage
   * ```ts no-assert
   * import { SeededPrng } from "@std/random";
   * import { assertEquals } from "@std/assert";
   *
   * const prng = new SeededPrng({ seed: 14614327452668470620n });
   * assertEquals(prng.randomSeed(), 12896216895826562279n);
   * ```
   */
  randomSeed(): bigint {
    return this.#randomUint64();
  }

  // port of minimal version at https://www.pcg-random.org/download.html
  // mod U64_CEIL/U32_CEIL simulates integer overflow in C
  #randomUint32(): bigint {
    const oldState = this.#state;

    this.#state = (this.#state * 6364136223846793005n + (this.#inc | 1n)) %
      U64_CEIL;

    const xorShifted = (((oldState >> 18n) ^ oldState) >> 27n) % U32_CEIL;
    const rot = (oldState >> 59n) % U32_CEIL;

    return ((xorShifted >> rot) | (xorShifted << ((-rot) & 31n))) % U32_CEIL;
  }

  #randomUint64(): bigint {
    const hi = this.#randomUint32();
    const lo = this.#randomUint32();
    return (hi << 32n) | lo;
  }

  /**
   * Get a random state tuple suitable for usage by `SeededPrng`.
   */
  #randomState(): State {
    return [
      this.#randomUint64(),
      this.#randomUint64(),
    ];
  }

  /**
   * Convert a seed to a state tuple suitable for usage by `SeededPrng`.
   */
  static #seedToState(seed: bigint): State {
    const state = reverseUint64Bits(seed % U64_CEIL) ^ DEFAULT_XOR;
    const prng = new SeededPrng({ seed: [state, DEFAULT_INC] });

    return prng.#randomState();
  }
}

/**
 * Convert a 32-bit unsigned integer to a float64 in the range [0, 1).
 */
function uint32ToFloat64(u32: number | bigint): number {
  return Number(u32) / (2 ** 32);
}

/**
 * Reverse the bits of a given unsigned 64-bit integer.
 * Used to ensure less-bad results for small seeds such as 1, 2, 3, etc.
 */
function reverseUint64Bits(n: bigint): bigint {
  let rev = 0n;

  for (let i = 0n; i < 64n; ++i) {
    rev <<= 1n;

    if ((n & 1n) === 1n) {
      rev ^= 1n;
    }

    n >>= 1n;
  }

  return rev;
}
