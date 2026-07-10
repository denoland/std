// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Checks if a number is even.
 *
 * @param n The number to check
 * @returns `true` if the number is even, `false` otherwise
 *
 * @example Usage
 * ```ts
 * import { isEven } from "@std/math/is-even";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(isEven(4), true);
 * assertEquals(isEven(5), false);
 * ```
 */
export function isEven(n: number): boolean {
  return n % 2 === 0;
}
