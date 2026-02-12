// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Computes the floored modulo of a number.
 *
 * @param num The number to be reduced
 * @param modulus The modulus
 * @returns The reduced number
 *
 * @example Usage
 * ```ts
 * import { modulo } from "@std/math/modulo";
 * import { assertEquals } from "@std/assert";
 *
 * for (let n = -3; n <= 3; ++n) {
 *  const val = n * 12 + 5;
 *  // 5 o'clock is always 5 o'clock, no matter how many twelve-hour cycles you add or remove
 *  assertEquals(modulo(val, 12), 5);
 * }
 * ```
 */
export function modulo(num: number, modulus: number): number {
  num %= modulus;
  if (num === 0) {
    num = modulus < 0 ? -0 : 0;
  } else if ((num < 0) !== (modulus < 0)) {
    num += modulus;
  }
  return num;
}
