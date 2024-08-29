// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Equivalent to `PCG32_INITIALIZER` in the official C/C++ library.
 *
 * This can be used as a "default" seed in cases where uniqueness is not
 * required, as it will always generate the same results.
 *
 * May be suitable for testing, but not recommended for production use.
 */
// deno-fmt-ignore
export const PCG32_INITIALIZER: Readonly<SeededRandomState> = {
  algorithm: "pcg32",
  state: new Uint8Array([0x85, 0x3c, 0x49, 0xe6, 0x74, 0x8f, 0xea, 0x9b]),
  inc: new Uint8Array([0xda, 0x3e, 0x39, 0xcb, 0x94, 0xb9, 0x5b, 0xdb]),
}

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
 * Resumable state for a {@linkcode SeededRandom}.
 */
export type SeededRandomState = {
  /**
   * The algorithm. Currently, only `pcg32` is supported.
   */
  algorithm: "pcg32";
  /**
   * The current changeable state of the PCG random number generator.
   * This value changes upon each iteration of the random number generator.
   */
  state: Uint8Array;
  /**
   * The amount used to increment each iteration of the PCG random number generator.
   * This value affects the random numbers generated but remains constant.
   */
  inc: Uint8Array;
};

/**
 * A seeded pseudo-random number generator, implementing the
 * {@link https://en.wikipedia.org/wiki/Permuted_congruential_generator | PCG32}
 * algorithm.
 *
 * @example Usage
 * ```ts
 * import { SeededRandom } from "@std/random";
 * import { assertEquals } from "@std/assert";
 *
 * const prng = new SeededRandom(new Uint8Array([
 *  0x19, 0x57, 0xc5, 0x20, 0x6d, 0x56, 0xb3, 0xf4,
 *  0x6e, 0xa1, 0x3c, 0x00, 0xb4, 0x6b, 0xcf, 0xa9,
 * ]));
 * assertEquals(prng.random(), 0.9590322358999401);
 * assertEquals(prng.random(), 0.3763687589671463);
 * assertEquals(prng.random(), 0.5337617760524154);
 * ```
 */
export class SeededRandom {
  #state!: bigint;
  #inc!: bigint;

  /**
   * Constructs a new instance.
   *
   * @param seed - The seed for the random number generator, which can be
   * either a 2-tuple of bigints or a single bigint, which
   * will be converted to a state 2-tuple.
   *
   * @example Usage
   * ```ts no-assert
   * import { SeededRandom } from "@std/random";
   * const prng = new SeededRandom(new Uint8Array([
   *  0x19, 0x57, 0xc5, 0x20, 0x6d, 0x56, 0xb3, 0xf4,
   *  0x6e, 0xa1, 0x3c, 0x00, 0xb4, 0x6b, 0xcf, 0xa9,
   * ]));
   * ```
   */
  constructor(seed: Uint8Array) {
    this.#seed(seed);

    // For convenience, allowing destructuring and direct usage in callbacks
    // equivalently to Math.random()
    this.random = this.random.bind(this);
  }

  /**
   * Creates a new instance from a given state.
   *
   * @param state The state to use.
   * @returns A `SeededRandom` instance resumed from the given state.
   *
   * @example Usage
   * ```ts no-eval
   * import { SeededRandom } from "@std/random";
   * import { assertEquals } from "@std/assert";
   *
   * const prng = new SeededRandom(new Uint8Array([
   *  0x19, 0x57, 0xc5, 0x20, 0x6d, 0x56, 0xb3, 0xf4,
   *  0x6e, 0xa1, 0x3c, 0x00, 0xb4, 0x6b, 0xcf, 0xa9,
   * ]));
   * const state = prng.state;
   * const prng2 = SeededRandom.fromState(state);
   *
   * assertEquals(prng2.state, state);
   * ```
   */
  static fromState(state: Readonly<SeededRandomState>): SeededRandom {
    // seed with empty bytes as we'll overwrite the state anyway
    const prng = new SeededRandom(new Uint8Array(16));
    prng.state = state;

    return prng;
  }

  /**
   * The current state of the random number generator.
   * @returns The state as an object.
   *
   * @example Usage
   * ```ts
   * import { SeededRandom } from "@std/random";
   * import { assertEquals } from "@std/assert";
   *
   * const prng = new SeededRandom(new Uint8Array([
   *  0x19, 0x57, 0xc5, 0x20, 0x6d, 0x56, 0xb3, 0xf4,
   *  0x6e, 0xa1, 0x3c, 0x00, 0xb4, 0x6b, 0xcf, 0xa9,
   * ]));
   * assertEquals(prng.state, {
   *  algorithm: "pcg32",
   *  state: new Uint8Array([0xe9, 0xf5, 0xb9, 0x5f, 0x96, 0x9f, 0x7b, 0xce]),
   *  inc: new Uint8Array([0xdd, 0x42, 0x78, 0x01, 0x68, 0xd7, 0x9f, 0x53]),
   * });
   * ```
   */
  get state(): Readonly<SeededRandomState> {
    const u = new Uint8Array(8);
    const dv = new DataView(u.buffer);

    dv.setBigUint64(0, this.#state);
    const state = new Uint8Array([...u]);

    dv.setBigUint64(0, this.#inc);
    const inc = new Uint8Array([...u]);

    return {
      algorithm: "pcg32",
      state,
      inc,
    } as SeededRandomState;
  }

  set state(value: Readonly<SeededRandomState>) {
    const [state, inc] = getUint64s(
      new Uint8Array([...value.state, ...value.inc]),
      2,
    );
    this.#state = state!;
    this.#inc = inc!;
  }

  // https://github.com/imneme/pcg-c-basic/blob/bc39cd76ac3d541e618606bcc6e1e5ba5e5e6aa3/pcg_basic.c#L42-L49
  #seed(seed: Uint8Array): void {
    const [initState, initSeq] = getUint64s(seed, 2);

    this.#state = 0n;
    this.#inc = ((initSeq! << 1n) | 1n) % U64_CEIL;
    this.#randomUint32();
    this.#state += initState!;
    this.#randomUint32();
  }

  /**
   * Generates a random number using the current state of the prng.
   * @returns A random number between 0 and 1
   *
   * @example Usage
   * ```ts
   * import { SeededRandom } from "@std/random";
   * import { assertEquals } from "@std/assert";
   *
   * const prng = new SeededRandom(new Uint8Array([
   *  0x19, 0x57, 0xc5, 0x20, 0x6d, 0x56, 0xb3, 0xf4,
   *  0x6e, 0xa1, 0x3c, 0x00, 0xb4, 0x6b, 0xcf, 0xa9,
   * ]));
   *
   * assertEquals(prng.random(), 0.9590322358999401);
   * assertEquals(prng.random(), 0.3763687589671463);
   * assertEquals(prng.random(), 0.5337617760524154);
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
   * import { SeededRandom } from "@std/random";
   * import { assertEquals } from "@std/assert";
   *
   * const prng = new SeededRandom(new Uint8Array([25, 87, 197, 32, 109, 86, 179, 244, 110, 161, 60, 0, 180, 107, 207, 169]));
   * assertEquals(
   *  prng.randomSeed(),
   *  new Uint8Array([245, 131, 34, 249, 96, 89, 179, 247, 136, 164, 156, 156, 42, 174, 157, 149]),
   * );
   * ```
   */
  randomSeed(): Uint8Array {
    const bytes = new Uint8Array(16);
    const dv = new DataView(bytes.buffer);

    for (let i = 0; i < 4; i++) {
      dv.setUint32(i * 4, this.#randomUint32());
    }

    return bytes;
  }

  // https://github.com/imneme/pcg-c-basic/blob/bc39cd76ac3d541e618606bcc6e1e5ba5e5e6aa3/pcg_basic.c#L60-L67
  #randomUint32(): number {
    const oldState = this.#state;

    this.#state = (this.#state * 6364136223846793005n + (this.#inc | 1n)) %
      U64_CEIL;

    const xorShifted = (((oldState >> 18n) ^ oldState) >> 27n) % U32_CEIL;
    const rot = (oldState >> 59n) % U32_CEIL;

    return Number(
      ((xorShifted >> rot) | (xorShifted << ((-rot) & 31n))) % U32_CEIL,
    );
  }
}

/** Convert a 32-bit unsigned integer to a float64 in the range [0, 1). */
function uint32ToFloat64(u32: number): number {
  return u32 / (2 ** 32);
}

/** Convert byte array to array of `n` uint64s, reading big-endian. */
function getUint64s(arr: Uint8Array, n: number) {
  const dv = new DataView(Uint8Array.from(arr).buffer);
  if (dv.byteLength !== n * 8) {
    throw new Error(`Expected byte length ${n * 8}; got ${dv.byteLength}`);
  }
  return Array.from({ length: n }, (_, i) => dv.getBigUint64(i * 8));
}
