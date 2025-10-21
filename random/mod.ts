// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Utilities for generating random numbers.
 *
 * ```ts no-assert
 * import { randomIntegerBetween } from "@std/random";
 * import { randomSeeded } from "@std/random";
 *
 * const prng = randomSeeded(BigInt(crypto.getRandomValues(new Uint32Array(1))[0]));
 *
 * const randomInteger = randomIntegerBetween(1, 10, { prng });
 * ```
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @module
 */

export * from "./between.ts";
export * from "./integer_between.ts";
export * from "./get_random_values_seeded.ts";
export * from "./next_float_64.ts";
export * from "./sample.ts";
export * from "./seeded.ts";
export * from "./shuffle.ts";
