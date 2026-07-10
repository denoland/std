// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Checks if a number is odd.
 *
 * @param n The number to check
 * @returns `true` if the number is odd, `false` otherwise
 *
 * @example Usage
 * ```ts
 * import { isOdd } from "@std/math/is-odd";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(isOdd(5), true);
 * assertEquals(isOdd(4), false);
 * ```
 */
export function isOdd(n: number): boolean {
  return n % 2 !== 0;
}
