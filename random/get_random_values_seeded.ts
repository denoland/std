// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { Pcg32 } from "./_pcg32.ts";
import type { RandomValueGenerator } from "./_types.ts";
// deno-lint-ignore deno-std-docs/exported-symbol-documented
export type { IntegerTypedArray, RandomValueGenerator } from "./_types.ts";

/**
 * Creates a pseudo-random value generator that populates typed arrays,
 * based on the given seed. The algorithm used for generation is
 * {@link https://www.pcg-random.org/download.html | PCG32}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param seed The seed used to initialize the random number generator's state.
 * @returns A pseudo-random value generator function, which will generate
 * different values on each call.
 *
 * @example Usage
 * ```ts
 * import { getRandomValuesSeeded } from "@std/random";
 * import { assertEquals } from "@std/assert";
 *
 * const getRandomValues = getRandomValuesSeeded(1n);
 * assertEquals(getRandomValues(new Uint8Array(5)), new Uint8Array([230, 11, 167, 51, 238]));
 * ```
 */
export function getRandomValuesSeeded(
  seed: bigint,
): RandomValueGenerator {
  const pcg = new Pcg32(seed);
  return pcg.getRandomValues.bind(pcg);
}
