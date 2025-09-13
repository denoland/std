// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Computes the modulo of a number.
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
 * // 5 o'clock is always 5 o'clock, no matter how many twelve-hour cycles you add or remove
 * for (let n = -3; n <= 3; ++n) {
 *  const val = n * 12 + 5
 *  assertEquals(modulo(val, 12), 5);
 * }
 * ```
 */
export function modulo(num: number, modulus: number): number {
  if (!Number.isFinite(num) || Number.isNaN(modulus) || modulus === 0) {
    return NaN;
  }
  if (!Number.isFinite(modulus) || num === 0) return num;
  return ((num % modulus) + modulus) % modulus;
}
