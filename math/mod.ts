// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Functions for math tasks such as modulo and generating integer ranges.
 *
 * ```ts
 * import { modulo } from "@std/math/modulo";
 * import { assertEquals } from "@std/assert";
 * import { IntegerRange } from "@std/math/integer-range";
 *
 * // 5 o'clock is always 5 o'clock, no matter how many twelve-hour cycles you add or remove
 * for (const n of new IntegerRange(-3, 3, { includeEnd: true })) {
 *  const val = n * 12 + 5
 *  assertEquals(modulo(val, 12), 5);
 * }
 * ```
 *
 * @module
 */

export * from "./clamp.ts";
export * from "./integer_range.ts";
export * from "./modulo.ts";
export * from "./round_to.ts";
