// Copyright 2018-2025 the Deno authors. MIT license.
// Based on Rust `rand` crate (https://github.com/rust-random/rand). Apache-2.0 + MIT license.

import { platform } from "./_platform.ts";
import { seedBytesFromUint64 } from "./_seed_bytes_from_uint64.ts";
import type { IntegerTypedArray } from "./_types.ts";

const b4 = new Uint8Array(4);
const dv4 = new DataView(b4.buffer);

abstract class Prng32 {
  /** Generates a pseudo-random 32-bit unsigned integer. */
  abstract nextUint32(): number;

  /**
   * Mutates the provided typed array with pseudo-random values.
   * @returns The same typed array, now populated with random values.
   */
  getRandomValues<T extends IntegerTypedArray>(arr: T): T {
    const { buffer, byteLength, byteOffset } = arr;
    const rem = byteLength % 4;
    const cutoffLen = byteLength - rem;

    const dv = new DataView(buffer, byteOffset, byteLength);
    for (let i = 0; i < cutoffLen; i += 4) {
      dv.setUint32(i, this.nextUint32(), true);
    }

    if (rem !== 0) {
      dv4.setUint32(0, this.nextUint32(), true);
      for (let i = 0; i < rem; ++i) {
        dv.setUint8(cutoffLen + i, b4[i]!);
      }
    }

    if (arr.BYTES_PER_ELEMENT !== 1 && !platform.littleEndian) {
      const bits = arr.BYTES_PER_ELEMENT * 8;
      const name = bits > 32
        ? `BigUint${bits as 64}` as const
        : `Uint${bits as 16 | 32}` as const;
      for (let i = 0; i < arr.length; ++i) {
        const idx = i * arr.BYTES_PER_ELEMENT;
        dv[`set${name}`](idx, dv[`get${name}`](idx, true) as never, false);
      }
    }

    return arr;
  }
}

/**
 * Internal PCG32 implementation, used by both the public seeded random
 * function and the seed generation algorithm.
 *
 * Modified from https://github.com/rust-random/rand/blob/f7bbcca/rand_pcg/src/pcg64.rs#L140-L153
 */
export class Pcg32 extends Prng32 {
  /** Multiplier for the PCG32 algorithm. */
  // deno-lint-ignore deno-style-guide/naming-convention
  static readonly MULTIPLIER = 6364136223846793005n;
  // Constants are for 64-bit state, 32-bit output
  // deno-lint-ignore deno-style-guide/naming-convention
  static readonly ROTATE = 59n; // 64 - 5
  // deno-lint-ignore deno-style-guide/naming-convention
  static readonly XSHIFT = 18n; // (5 + 32) / 2
  // deno-lint-ignore deno-style-guide/naming-convention
  static readonly SPARE = 27n; // 64 - 32 - 5

  #state = new BigUint64Array(2);
  get state() {
    return this.#state[0]!;
  }
  protected set state(val) {
    this.#state[0] = val;
  }
  get increment() {
    return this.#state[1]!;
  }
  protected set increment(val) {
    // https://www.pcg-random.org/posts/critiquing-pcg-streams.html#changing-the-increment
    // > Increments have just one rule: they must be odd.
    // We OR the increment with 1 upon setting to ensure this.
    this.#state[1] = val | 1n;
  }

  /**
   * Creates a new `Pcg32` instance with entropy generated from the seed.
   * @param seed A 64-bit unsigned integer used to seed the generator.
   */
  constructor(seed: bigint);
  /**
   * Creates a new `Pcg32` instance with the given `state` and `increment` values.
   * @param state The current state of the generator.
   * @param increment The increment value used in the generator.
   *
   * > [!NOTE]
   * > It is typically better to use the constructor that takes a single `seed` value.
   * > However, this constructor can be useful for resuming from a saved state.
   */
  constructor({ state, increment }: { state: bigint; increment: bigint });
  constructor(arg: bigint | { state: bigint; increment: bigint }) {
    if (typeof arg === "bigint") {
      return Pcg32.#seedFromUint64(arg);
    }

    super();
    this.state = arg.state;
    this.increment = arg.increment;
  }

  /** @returns The next pseudo-random 32-bit integer. */
  nextUint32(): number {
    // Output function XSH RR: xorshift high (bits), followed by a random rotate
    const rot = this.state >> Pcg32.ROTATE;
    const xsh = BigInt.asUintN(
      32,
      (this.state >> Pcg32.XSHIFT ^ this.state) >> Pcg32.SPARE,
    );
    this.step();
    return Number(this.#rotateRightUint32(xsh, rot));
  }

  /** Mutates `pcg` by advancing `pcg.state`. */
  step(): this {
    this.state = this.state * Pcg32.MULTIPLIER + this.increment;
    return this;
  }

  // `n`, `rot`, and return val are all u32
  #rotateRightUint32(n: bigint, rot: bigint): bigint {
    const left = BigInt.asUintN(32, n << (-rot & 31n));
    const right = n >> rot;
    return left | right;
  }

  static #seedFromUint64(seed: bigint): Pcg32 {
    return this.#fromSeed(seedBytesFromUint64(seed, new Uint8Array(16)));
  }

  /**
   * Modified from https://github.com/rust-random/rand/blob/f7bbcca/rand_pcg/src/pcg64.rs#L129-L135
   */
  static #fromSeed(seed: Uint8Array) {
    const d = new DataView(seed.buffer);
    return this.#fromStateIncr(
      d.getBigUint64(0, true),
      d.getBigUint64(8, true) | 1n,
    );
  }

  /**
   * Modified from https://github.com/rust-random/rand/blob/f7bbcca/rand_pcg/src/pcg64.rs#L99-L105
   */
  static #fromStateIncr(state: bigint, increment: bigint): Pcg32 {
    // Move state away from initial value
    return new Pcg32({ state: state + increment, increment }).step();
  }
}
