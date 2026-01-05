// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Compare two values in ascending order using JavaScript's built in comparison
 * operators.
 *
 * @example Comparing numbers
 * ```ts
 * import { ascend } from "@std/data-structures";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(ascend(1, 2), -1);
 * assertEquals(ascend(2, 1), 1);
 * assertEquals(ascend(1, 1), 0);
 * ```
 *
 * @typeparam T The type of the values being compared.
 * @param a The left comparison value.
 * @param b The right comparison value.
 * @returns -1 if `a` is less than `b`, 0 if `a` is equal to `b`, and 1 if `a` is greater than `b`.
 */
export function ascend<T>(a: T, b: T): -1 | 0 | 1 {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Compare two values in descending order using JavaScript's built in comparison
 * operators.
 *
 * @example Comparing numbers
 * ```ts
 * import { descend } from "@std/data-structures";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(descend(1, 2), 1);
 * assertEquals(descend(2, 1), -1);
 * assertEquals(descend(1, 1), 0);
 * ```
 *
 * @typeparam T The type of the values being compared.
 * @param a The left comparison value.
 * @param b The right comparison value.
 * @returns -1 if `a` is greater than `b`, 0 if `a` is equal to `b`, and 1 if `a` is less than `b`.
 */
export function descend<T>(a: T, b: T): -1 | 0 | 1 {
  return a < b ? 1 : a > b ? -1 : 0;
}
