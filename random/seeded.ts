// // Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * The maximum value of a 64-bit unsigned integer plus one.
 * `n % U64_CEIL` simulates uint64 integer overflow in C.
 */
const U64_CEIL = 2n ** 64n;
/**
 * The maximum value of a 32-bit unsigned integer plus one.
 * `n % U32_CEIL` simulates uint32 integer overflow in C.
 */
const U32_CEIL = 2n ** 32n;
/**
 * The maximum value of a 64-bit unsigned integer.
 * `n & U64_MAX` coerces any bigint `n` to fit inside a uint64.
 */
const U64_MAX = U64_CEIL - 1n;

// arbitrary odd value (taken from example at https://en.wikipedia.org/wiki/Permuted_congruential_generator)
const INITIAL_INC = 1442695040888963407n;

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
 * assertEquals(prng.random(), 0.34011089405976236);
 * assertEquals(prng.random(), 0.6603851807303727);
 * assertEquals(prng.random(), 0.4863424440845847);
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
   * assertEquals(prng.state, [13062938915293834817n, 10846994826184652623n]);
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
   * assertEquals(prng.random(), 0.34011089405976236);
   * assertEquals(prng.random(), 0.6603851807303727);
   * assertEquals(prng.random(), 0.4863424440845847);
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
   * assertEquals(prng.randomSeed(), 7382748496997062591n);
   * ```
   */
  randomSeed(): bigint {
    return this.#randomUint64();
  }

  // port of minimal version at https://www.pcg-random.org/download.html
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
   * Convert a user-provided scalar seed value to a state tuple suitable for
   * usage by `SeededPrng`.
   *
   * Aims to provide good results for both well-randomized seeds (such as
   * 64-bit outputs from `crypto.getRandomValues`) and low-entropy seeds (such
   * as 1, 2, 3, keyboard mashing, etc.).
   */
  static #seedToState(seed: bigint): State {
    seed &= U64_MAX;
    const fnv1a = fnv1aUint64LittleEndian(seed);
    const prng = new SeededPrng({ seed: [seed ^ fnv1a, INITIAL_INC] });
    // advance the prng's internal state slightly to further reduce any bias
    prng.#randomUint32();
    // return a fresh random state
    return prng.#randomState();
  }
}

/**
 * Convert a 32-bit unsigned integer to a float64 in the range [0, 1).
 */
function uint32ToFloat64(u32: number | bigint): number {
  return Number(u32) / (2 ** 32);
}

const FNV_OFFSET_BASIS = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;
/**
 * 64-bit {@link https://en.wikipedia.org/wiki/Fowler–Noll–Vo_hash_function#FNV-1a_hash | FNV-1a} hash function.
 * We xor this with scalar seed inputs to ensure less-bad results for small or low-entropy seeds such as 1, 2, 3, etc.
 * Little-endian is used to give better distribution of the lower bits.
 */
function fnv1aUint64LittleEndian(num: bigint): bigint {
  const dv = new DataView(new BigUint64Array(1).buffer);
  dv.setBigUint64(0, num, true);

  let hash = FNV_OFFSET_BASIS;

  for (let i = 0; i < BigUint64Array.BYTES_PER_ELEMENT; ++i) {
    hash = (hash ^ BigInt(dv.getUint8(i))) % U64_CEIL;
    hash = (hash * FNV_PRIME) % U64_CEIL;
  }

  return hash;
}
