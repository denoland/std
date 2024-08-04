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
 * const { random } = new SeededPrng(1722745269697);
 *
 * assertEquals(randomIntegerBetween(1, 10, { random }), 9);
 * ```
 *
 * @module
 */

export * from "./between.ts";
export * from "./pick.ts";
export * from "./seeded.ts";
export * from "./shuffle.ts";
