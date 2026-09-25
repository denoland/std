// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { gcd } from "./gcd.ts";

/**
 * Calculates the least common multiple of two numbers.
 *
 * Both inputs must be integers; otherwise a `RangeError` is thrown. The result
 * is exact whenever the true least common multiple is a safe integer, since the
 * input is divided by the greatest common divisor before multiplying.
 *
 * @param a The first integer
 * @param b The second integer
 * @returns The least common multiple
 * @throws {RangeError} If either input is not an integer
 *
 * @example Usage
 * ```ts
 * import { lcm } from "@std/math/lcm";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(lcm(12, 8), 24);
 * assertEquals(lcm(7, 3), 21);
 * ```
 */
export function lcm(a: number, b: number): number {
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    throw new RangeError(
      `\`a\` and \`b\` must be integers: received ${a} and ${b}`,
    );
  }
  if (a === 0 || b === 0) return 0;
  return Math.abs(a / gcd(a, b) * b);
}
