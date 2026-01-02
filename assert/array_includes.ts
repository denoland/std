// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { equal } from "./equal.ts";
import { format } from "@std/internal/format";
import { AssertionError } from "./assertion_error.ts";

/** An array-like object (`Array`, `Uint8Array`, `NodeList`, etc.) that is not a string */
export type ArrayLikeArg<T> = ArrayLike<T> & object;

/**
 * Make an assertion that `actual` includes the `expected` values. If not then
 * an error will be thrown.
 *
 * Type parameter can be specified to ensure values under comparison have the
 * same type.
 *
 * @example Usage
 * ```ts ignore
 * import { assertArrayIncludes } from "@std/assert";
 *
 * assertArrayIncludes([1, 2], [2]); // Doesn't throw
 * assertArrayIncludes([1, 2], [3]); // Throws
 * ```
 *
 * @typeParam T The type of the elements in the array to compare.
 * @param actual The array-like object to check for.
 * @param expected The array-like object to check for.
 * @param msg The optional message to display if the assertion fails.
 */
export function assertArrayIncludes<T>(
  actual: ArrayLikeArg<T>,
  expected: ArrayLikeArg<T>,
  msg?: string,
) {
  const missing: unknown[] = [];
  for (let i = 0; i < expected.length; i++) {
    let found = false;
    for (let j = 0; j < actual.length; j++) {
      if (equal(expected[i], actual[j])) {
        found = true;
        break;
      }
    }
    if (!found) {
      missing.push(expected[i]);
    }
  }
  if (missing.length === 0) {
    return;
  }

  const msgSuffix = msg ? `: ${msg}` : ".";
  msg = `Expected actual: "${format(actual)}" to include: "${
    format(expected)
  }"${msgSuffix}\nmissing: ${format(missing)}`;
  throw new AssertionError(msg);
}
