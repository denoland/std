// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Options for {@linkcode roundTo}.
 */
export type RoundingOptions = {
  /**
   * The strategy to use for rounding.
   * @default {"round"}
   */
  strategy?: "round" | "floor" | "ceil" | "trunc";
};

/**
 * Round a number to a specified number of digits.
 *
 * @param num The number to be rounded
 * @param digits The number of digits to round to
 * @param options Options for rounding
 * @returns The rounded number
 *
 * @example Usage
 * ```ts
 * import { roundTo } from "@std/math/round-to";
 * import { assertEquals } from "@std/assert";
 * assertEquals(roundTo(Math.PI, 2), 3.14);
 * assertEquals(roundTo(Math.PI, 2, { strategy: "ceil" }), 3.15);
 * assertEquals(roundTo(Math.PI, 3), 3.142);
 * assertEquals(roundTo(Math.PI, 3, { strategy: "floor" }), 3.141);
 * assertEquals(roundTo(-Math.PI, 3, { strategy: "trunc" }), -3.141);
 * ```
 */
export function roundTo(
  num: number,
  digits: number,
  options?: RoundingOptions,
): number {
  if (!Number.isSafeInteger(digits) || digits < 0) {
    throw new RangeError("`digits` must be a non-negative integer");
  }

  const { strategy = "round" } = options ?? {};
  const factor = 10 ** digits;
  return Math[strategy](num * factor) / factor;
}
