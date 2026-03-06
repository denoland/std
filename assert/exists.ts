// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { AssertionError } from "./assertion_error.ts";

/**
 * Make an assertion that actual is not null or undefined.
 * If not then throw.
 *
 * @example Usage
 * ```ts ignore
 * import { assertExists } from "@std/assert";
 *
 * assertExists("something"); // Doesn't throw
 * assertExists(undefined); // Throws
 * ```
 *
 * @typeParam T The type of the actual value.
 * @param actual The actual value to check.
 * @param msg The optional message to include in the error if the assertion fails.
 */
export function assertExists<T>(
  actual: T,
  msg?: string,
): asserts actual is NonNullable<T> {
  if (actual === undefined || actual === null) {
    const msgSuffix = msg ? `: ${msg}` : ".";
    msg =
      `Expected actual: "${actual}" to not be null or undefined${msgSuffix}`;
    throw new AssertionError(msg);
  }
}
