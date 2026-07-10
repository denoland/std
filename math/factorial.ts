// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Calculates the factorial of a number.
 *
 * @param n The number (must be a non-negative integer)
 * @returns The factorial of the number
 *
 * @example Usage
 * ```ts
 * import { factorial } from "@std/math/factorial";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(factorial(5), 120);
 * assertEquals(factorial(0), 1);
 * ```
 */
export function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError("`n` must be a non-negative integer");
  }
  if (n === 0) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}
