// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Utilities for generating random numbers.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
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
 * @module
 */

export * from "./between.ts";
export * from "./integer_between.ts";
export * from "./sample.ts";
export * from "./seeded.ts";
export * from "./shuffle.ts";
export type * from "./_types.ts";
