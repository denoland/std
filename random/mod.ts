// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Utilities for generating random numbers.
 *
 * ```ts
 * import { randomIntegerBetween } from "@std/random";
 * import { SeededPrng } from "@std/random";
 * import { assertEquals } from "@std/assert";
 *
 * const { random } = new SeededPrng({ seed: 14614327452668470620n });
 *
 * assertEquals(randomIntegerBetween(1, 10, { random }), 5);
 * ```
 *
 * @module
 */

export * from "./between.ts";
export * from "./seeded.ts";
