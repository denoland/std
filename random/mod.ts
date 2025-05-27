// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Utilities for generating random numbers.
 *
 * ```ts
 * import { randomIntegerBetween } from "@std/random";
 * import { randomSeeded } from "@std/random";
 * import { assertEquals } from "@std/assert";
 *
 * const prng = randomSeeded(1n);
 *
 * assertEquals(randomIntegerBetween(1, 10, { prng }), 3);
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
