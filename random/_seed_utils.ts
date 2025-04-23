import { INC, Pcg32 } from "./_pcg32.ts";

// `n`, `rot`, and return val are all u32
export function rotateRightU32(n: bigint, rot: bigint): bigint {
  const left = BigInt.asUintN(32, n << (-rot & 31n));
  const right = n >> rot;
  return left | right;
}

/**
 * Write entropy generated from a scalar bigint seed into the provided Uint8Array.
 * Modified from https://github.com/rust-random/rand/blob/f7bbccaedf6c63b02855b90b003c9b1a4d1fd1cb/rand_core/src/lib.rs#L359-L388
 */
export function seedBytesFromU64(u64: bigint, bytes: Uint8Array): Uint8Array {
  return new Pcg32(BigInt.asUintN(64, u64), INC)
    // We advance the state first (to get away from the input value,
    // in case it has low Hamming Weight).
    .step()
    .getRandomValues(bytes);
}
