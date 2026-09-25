// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Calculates the greatest common divisor of two numbers.
 *
 * Both inputs must be integers; otherwise a `RangeError` is thrown.
 *
 * @param a The first integer
 * @param b The second integer
 * @returns The greatest common divisor
 * @throws {RangeError} If either input is not an integer
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
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    throw new RangeError(
      `\`a\` and \`b\` must be integers: received ${a} and ${b}`,
    );
  }
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}
