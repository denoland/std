// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { Pcg32 } from "./_pcg32.ts";
import { nextFloat64 } from "./number_types.ts";
import type { ByteGenerator, Prng } from "./_types.ts";
export type { ByteGenerator, Prng } from "./_types.ts";

/**
 * Creates a pseudo-random number generator that generates random numbers in
 * the range `[0, 1)`, based on the given seed. The algorithm used for
 * generation is {@link https://www.pcg-random.org/download.html | PCG32}.
 *
 * @deprecated Use `randomSeeded53Bit` instead. The `randomSeeded` export will
 * be changed to point to `randomSeeded53Bit` in the future.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param seed The seed used to initialize the random number generator's state.
 * @returns A pseudo-random number generator function, which will generate
 * different random numbers on each call.
 *
 * @example Usage
 * ```ts
 * import { randomSeeded32Bit } from "@std/random";
 * import { assertEquals } from "@std/assert";
 *
 * const prng = randomSeeded32Bit(1n);
 *
 * assertEquals(prng(), 0.20176767697557807);
 * assertEquals(prng(), 0.4911644416861236);
 * assertEquals(prng(), 0.7924694607499987);
 * ```
 */
export function randomSeeded32Bit(seed: bigint): Prng {
  const pcg = Pcg32.seedFromUint64(seed);
  return () => pcg.nextUint32() / 2 ** 32;
}

export { randomSeeded32Bit as randomSeeded };

/**
 * Creates a pseudo-random number generator that generates random numbers in
 * the range `[0, 1)`, based on the given seed. The algorithm used for
 * generation is {@link https://www.pcg-random.org/download.html | PCG32}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param seed The seed used to initialize the random number generator's state.
 * @returns A pseudo-random number generator function, which will generate
 * different random numbers on each call.
 *
 * @example Usage
 * ```ts
 * import { randomSeeded53Bit } from "@std/random";
 * import { assertEquals } from "@std/assert";
 *
 * const prng = randomSeeded53Bit(1n);
 *
 * assertEquals(prng(), 0.49116444173310125);
 * assertEquals(prng(), 0.06903754193160427);
 * assertEquals(prng(), 0.16063206851777034);
 * ```
 */
export function randomSeeded53Bit(seed: bigint): Prng {
  const getRandomValues = seededByteGenerator(seed);
  return () => nextFloat64(getRandomValues);
}

/**
 * Creates a pseudo-random byte generator that populates `Uint8Array`s,
 * based on the given seed. The algorithm used for generation is
 * {@link https://www.pcg-random.org/download.html | PCG32}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param seed The seed used to initialize the random number generator's state.
 * @returns A pseudo-random byte generator function, which will generate
 * different bytes on each call.
 *
 * @example Usage
 * ```ts
 * import { seededByteGenerator } from "@std/random";
 * import { assertEquals } from "@std/assert";
 *
 * const getRandomValues = seededByteGenerator(1n);
 * assertEquals(getRandomValues(new Uint8Array(5)), new Uint8Array([230, 11, 167, 51, 238]));
 * ```
 */
export function seededByteGenerator(seed: bigint): ByteGenerator {
  const pcg = Pcg32.seedFromUint64(seed);
  return pcg.getRandomValues.bind(pcg);
}
