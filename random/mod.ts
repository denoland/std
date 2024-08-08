// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Utilities for generating random numbers.
 *
 * ```ts
 * import { randomIntegerBetween } from "@std/random";
 * import { SeededRandom } from "@std/random";
 * import { assertEquals } from "@std/assert";
 *
 * const { random } = new SeededRandom({
 *  seed: new Uint8Array([166, 37, 217, 191, 201, 30, 251, 92, 186, 74, 134, 60, 164, 218, 137, 370]),
 * });
 *
 * assertEquals(randomIntegerBetween(1, 10, { random }), 5);
 * ```
 *
 * @module
 */

export * from "./between.ts";
export * from "./seeded.ts";
