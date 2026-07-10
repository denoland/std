// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Calculates the greatest common divisor of two numbers.
 *
 * @param a The first number
 * @param b The second number
 * @returns The greatest common divisor
 *
 * @example Usage
 * ```ts
 * import { gcd } from "@std/math/gcd";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(gcd(12, 8), 4);
 * assertEquals(gcd(7, 3), 1);
 * ```
 */
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}
