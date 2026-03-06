// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Math functions such as modulo and clamp.
 *
 * ```ts
 * import { clamp, modulo } from "@std/math";
 * import { assertEquals } from "@std/assert";
 *
 * for (let n = -3; n <= 3; ++n) {
 *  const val = n * 12 + 5;
 *  // 5 o'clock is always 5 o'clock, no matter how many twelve-hour cycles you add or remove
 *  assertEquals(modulo(val, 12), 5);
 *  assertEquals(clamp(val, 0, 11), n === 0 ? 5 : n > 0 ? 11 : 0);
 * }
 * ```
 *
 * @module
 */

export * from "./clamp.ts";
export * from "./modulo.ts";
export * from "./round_to.ts";
