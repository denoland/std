// Copyright 2018-2025 the Deno authors. MIT license.
// Based on Rust `rand` crate (https://github.com/rust-random/rand). Apache-2.0 + MIT license.

import { rotateRightU32, seedBytesFromU64 } from "./_seed_utils.ts";

/** Multiplier for the PCG32 algorithm. */
const MUL = 6364136223846793005n;
/** Initial increment for the PCG32 algorithm. Only used during seeding. */
export const INC = 11634580027462260723n;

// Constants are for 64-bit state, 32-bit output
const ROTATE = 59n; // 64 - 5
const XSHIFT = 18n; // (5 + 32) / 2
const SPARE = 27n; // 64 - 32 - 5

// 0x1.0p-53
const F64_MULT = 2 ** -53;
// assert(1 / F64_MULT === Number.MAX_SAFE_INTEGER + 1)

abstract class Prng32 {
  /** Generates a pseudo-random 32-bit unsigned integer. */
  abstract nextUint32(): number;

  #b = new Uint8Array(8);
  #dv = new DataView(this.#b.buffer);

  /** Generates a pseudo-random float64 in the range `[0, 1)`. */
  nextFloat64(): number {
    this.getRandomValues(this.#b);
    const n53 = Number(this.#dv.getBigUint64(0, true) >> 11n);
    // assert(n53 <= Number.MAX_SAFE_INTEGER)
    return n53 * F64_MULT;
  }

  /**
   * Mutates the provided `Uint8Array` with pseudo-random values.
   * @returns The same `Uint8Array`, now populated with random values.
   */
  getRandomValues<T extends Uint8Array>(bytes: T): T {
    const { byteLength, byteOffset } = bytes;
    const rem = byteLength % 4;

    const dv = new DataView(bytes.buffer, byteOffset, byteLength);
    for (let i = 0; i < byteLength - rem; i += 4) {
      dv.setUint32(i, this.nextUint32(), true);
    }

    if (rem !== 0) {
      this.#dv.setUint32(0, this.nextUint32(), true);
      bytes.set(this.#b.subarray(0, rem), byteLength - rem);
    }

    return bytes;
  }
}

export class Pcg32 extends Prng32 {
  state: bigint;
  inc: bigint;

  constructor(state: bigint, inc: bigint) {
    super();
    this.state = state;
    this.inc = inc;
  }

  /**
   * Internal PCG32 implementation, used by both the public seeded random
   * function and the seed generation algorithm.
   *
   * Modified from https://github.com/rust-random/rand/blob/f7bbccaedf6c63b02855b90b003c9b1a4d1fd1cb/rand_pcg/src/pcg64.rs#L140-L153
   *
   * `pcg.state` is internally advanced by the function.
   *
   * @param pcg The state and increment values to use for the PCG32 algorithm.
   * @returns The next pseudo-random 32-bit integer.
   */
  nextUint32(): number {
    const state = this.state;
    this.step();
    // Output function XSH RR: xorshift high (bits), followed by a random rotate
    const rot = state >> ROTATE;
    const xsh = BigInt.asUintN(32, (state >> XSHIFT ^ state) >> SPARE);
    return Number(rotateRightU32(xsh, rot));
  }

  /**
   * Mutates `pcg` by advancing `pcg.state`.
   */
  step(): this {
    this.state = BigInt.asUintN(64, this.state * MUL + (this.inc | 1n));
    return this;
  }

  /**
   * Creates a new `Pcg32` instance with entropy generated from the given
   * `seed`, treated as an unsigned 64-bit integer.
   */
  static seedFromU64(seed: bigint): Pcg32 {
    return this.#fromSeed(seedBytesFromU64(seed, new Uint8Array(16)));
  }

  /**
   * Modified from https://github.com/rust-random/rand/blob/f7bbccaedf6c63b02855b90b003c9b1a4d1fd1cb/rand_pcg/src/pcg64.rs#L129-L135
   */
  static #fromSeed(seed: Uint8Array) {
    const d = new DataView(seed.buffer);
    return this.#fromStateIncr(
      d.getBigUint64(0, true),
      d.getBigUint64(8, true) | 1n,
    );
  }

  /**
   * Modified from https://github.com/rust-random/rand/blob/f7bbccaedf6c63b02855b90b003c9b1a4d1fd1cb/rand_pcg/src/pcg64.rs#L99-L105
   */
  static #fromStateIncr(state: bigint, inc: bigint): Pcg32 {
    const pcg = new Pcg32(state, inc);
    // Move away from initial value
    pcg.state = BigInt.asUintN(64, state + inc);
    pcg.step();
    return pcg;
  }
}
