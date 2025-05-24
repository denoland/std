// Copyright 2018-2025 the Deno authors. MIT license.
// Based on Rust `rand` crate (https://github.com/rust-random/rand). Apache-2.0 + MIT license.

import { seedBytesFromUint64 } from "./_seed_bytes_from_uint64.ts";

const b4 = new Uint8Array(4);
const dv4 = new DataView(b4.buffer);

abstract class Prng32 {
  /** Generates a pseudo-random 32-bit unsigned integer. */
  abstract nextUint32(): number;

  /**
   * Mutates the provided `Uint8Array` with pseudo-random values.
   * @returns The same `Uint8Array`, now populated with random values.
   */
  getRandomValues<T extends Uint8Array>(bytes: T): T {
    const { buffer, byteLength, byteOffset } = bytes;
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

    return bytes;
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
  set state(val) {
    this.#state[0] = val;
  }
  get inc() {
    return this.#state[1]!;
  }
  set inc(val) {
    this.#state[1] = val;
  }

  constructor({ state, inc }: { state: bigint; inc: bigint }) {
    super();
    this.state = state;
    this.inc = inc;
  }

  /** @returns The next pseudo-random 32-bit integer. */
  nextUint32(): number {
    const state = this.state;
    this.step();
    // Output function XSH RR: xorshift high (bits), followed by a random rotate
    const rot = state >> Pcg32.ROTATE;
    const xsh = BigInt.asUintN(
      32,
      (state >> Pcg32.XSHIFT ^ state) >> Pcg32.SPARE,
    );
    return Number(this.#rotateRightUint32(xsh, rot));
  }

  /** Mutates `pcg` by advancing `pcg.state`. */
  step(): this {
    this.state = this.state * Pcg32.MULTIPLIER + (this.inc | 1n);
    return this;
  }

  // `n`, `rot`, and return val are all u32
  #rotateRightUint32(n: bigint, rot: bigint): bigint {
    const left = BigInt.asUintN(32, n << (-rot & 31n));
    const right = n >> rot;
    return left | right;
  }

  /**
   * Creates a new `Pcg32` instance with entropy generated from the given
   * `seed`, treated as an unsigned 64-bit integer.
   */
  static seedFromUint64(seed: bigint): Pcg32 {
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
  static #fromStateIncr(state: bigint, inc: bigint): Pcg32 {
    // Move state away from initial value
    return new Pcg32({ state: state + inc, inc }).step();
  }
}
