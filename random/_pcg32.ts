// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Based on Rust `rand` crate (https://github.com/rust-random/rand). Apache-2.0 + MIT license.

import { U32_CEIL, U64_CEIL } from "./_constants.ts";

/** Multiplier for the PCG32 algorithm. */
export const PCG32_MUL: bigint = 6364136223846793005n;
/** Initial increment for the PCG32 algorithm. */
export const PCG32_INC: bigint = 11634580027462260723n;

export type PcgMutableState = {
  state: bigint;
  inc: bigint;
};

function writeU32ToBytesLe(n: number): Uint8Array {
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setUint32(0, n, true);
  return new Uint8Array(buffer);
}
function getU64FromBytesLe(x: Uint8Array, offset: number): bigint {
  return new DataView(x.buffer).getBigUint64(offset * 8, true);
}

/**
 * Modified from https://github.com/rust-random/rand/blob/f7bbccaedf6c63b02855b90b003c9b1a4d1fd1cb/rand_pcg/src/pcg64.rs#L129-L135
 */
export function fromSeed(seed: Uint8Array) {
  const state = getU64FromBytesLe(seed, 0);
  const increment = getU64FromBytesLe(seed, 1) | 1n;
  return fromStateIncr(state, increment);
}

/**
 * Mutates `pcg` by advancing `pcg.state`.
 */
export function step(pgc: PcgMutableState) {
  pgc.state = (pgc.state * PCG32_MUL + (pgc.inc | 1n)) % U64_CEIL;
}

/**
 * Modified from https://github.com/rust-random/rand/blob/f7bbccaedf6c63b02855b90b003c9b1a4d1fd1cb/rand_pcg/src/pcg64.rs#L99-L105
 */
function fromStateIncr(state: bigint, increment: bigint): PcgMutableState {
  const pcg: PcgMutableState = { state, inc: increment };

  // Move away from initial value:
  pcg.state = (pcg.state + pcg.inc) % U64_CEIL;

  step(pcg);

  return pcg;
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
 * @returns A Uint8Array representing the next PCG32 32-bit integer as 4 bytes (little-endian).
 */
export function nextU32(pcg: PcgMutableState): number {
  const xorShifted = (((pcg.state >> 18n) ^ pcg.state) >> 27n) % U32_CEIL;
  const rot = (pcg.state >> 59n) % U32_CEIL;

  const x = Number(
    ((xorShifted >> rot) | (xorShifted << ((-rot) & 31n))) % U32_CEIL,
  );

  step(pcg);

  return Number(x);
}

/**
 * Convert a scalar bigint seed to a Uint8Array of the specified length.
 * Modified from https://github.com/rust-random/rand/blob/f7bbccaedf6c63b02855b90b003c9b1a4d1fd1cb/rand_core/src/lib.rs#L359-L388
 */
export function seedFromU64(state: bigint, numBytes: number): Uint8Array {
  // wrap to u64
  state = ((state % U64_CEIL) + U64_CEIL) % U64_CEIL;

  const seed = new Uint8Array(numBytes);

  const pgc: PcgMutableState = { state: state, inc: PCG32_INC };

  // We advance the state first (to get away from the input value,
  // in case it has low Hamming Weight).
  step(pgc);

  for (let i = 0; i < Math.floor(numBytes / 4); ++i) {
    seed.set(writeU32ToBytesLe(nextU32(pgc)), i * 4);
  }

  if (numBytes % 4) {
    const rem = numBytes % 4;
    seed.set(
      writeU32ToBytesLe(nextU32(pgc)).subarray(0, rem),
      seed.byteLength - rem,
    );
  }

  return seed;
}
