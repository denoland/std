// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { format } from "@std/internal/format";
import { AssertionError } from "./assertion_error.ts";

/**
 * Make an assertion that `actual` is greater than or equal to `expected`.
 * If not then throw.
 *
 * @example Usage
 * ```ts ignore
 * import { assertGreaterOrEqual } from "@std/assert";
 *
 * assertGreaterOrEqual(2, 1); // Doesn't throw
 * assertGreaterOrEqual(1, 1); // Doesn't throw
 * assertGreaterOrEqual(0, 1); // Throws
 * ```
 *
 * @typeParam T The type of the values to compare.
 * @param actual The actual value to compare.
 * @param expected The expected value to compare.
 * @param msg The optional message to display if the assertion fails.
 */
export function assertGreaterOrEqual<T>(
  actual: T,
  expected: T,
  msg?: string,
) {
  if (actual >= expected) return;

  const actualString = format(actual);
  const expectedString = format(expected);
  throw new AssertionError(
    msg ?? `Expect ${actualString} >= ${expectedString}`,
  );
}
