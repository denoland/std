// Copyright 2018-2026 the Deno authors. MIT license.
import { Pcg32 } from "./_pcg32.ts";
import type { Uint8Array_ } from "./_types.ts";

/** Initial increment for the PCG32 algorithm. Only used during seeding. */
const INITIAL_INCREMENT = 11634580027462260723n;

/**
 * Write entropy generated from a scalar bigint seed into the provided Uint8Array, for use as a seed.
 * Modified from https://github.com/rust-random/rand/blob/f7bbcca/rand_core/src/lib.rs#L359-L388
 */
export function seedBytesFromUint64(
  u64: bigint,
  bytes: Uint8Array_,
): Uint8Array_ {
  return new Pcg32({ state: u64, increment: INITIAL_INCREMENT })
    // We advance the state first (to get away from the input value,
    // in case it has low Hamming Weight).
    .step()
    .getRandomValues(bytes);
}
