// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { gcd } from "./gcd.ts";

/**
 * Calculates the least common multiple of two numbers.
 *
 * @param a The first number
 * @param b The second number
 * @returns The least common multiple
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
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}
