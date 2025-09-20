// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { Pcg32 } from "./_pcg32.ts";
import type { Prng } from "./_types.ts";
// deno-lint-ignore deno-std-docs/exported-symbol-documented
export type { Prng } from "./_types.ts";

/**
 * Creates a pseudo-random number generator that generates random numbers in
 * the range `[0, 1)`, based on the given seed, with 32 bits of entropy.
 * The algorithm used for generation is {@link https://www.pcg-random.org/download.html | PCG32}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param seed The seed used to initialize the random number generator's state.
 * @returns A pseudo-random number generator function, which will generate
 * different random numbers on each call.
 *
 * @example Usage
 * ```ts
 * import { randomSeeded } from "@std/random";
 * import { assertEquals } from "@std/assert";
 *
 * const prng = randomSeeded(1n);
 *
 * assertEquals(prng(), 0.20176767697557807);
 * assertEquals(prng(), 0.4911644416861236);
 * assertEquals(prng(), 0.7924694607499987);
 * ```
 */
export function randomSeeded(seed: bigint): Prng {
  const pcg = new Pcg32(seed);
  return () => pcg.nextUint32() / 2 ** 32;
}
