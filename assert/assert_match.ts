// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { AssertionError } from "./assertion_error.ts";

/**
 * Make an assertion that `actual` match RegExp `expected`. If not
 * then throw.
 *
 * @example Usage
 * ```ts no-eval
 * import { assertMatch } from "@std/assert/assert-match";
 *
 * assertMatch("Raptor", RegExp(/Raptor/)); // Doesn't throw
 * assertMatch("Denosaurus", RegExp(/Raptor/)); // Throws
 * ```
 *
 * @param actual The actual value to be matched.
 * @param expected The expected pattern to match.
 * @param msg The optional message to display if the assertion fails.
 */
export function assertMatch(
  actual: string,
  expected: RegExp,
  msg?: string,
) {
  if (!expected.test(actual)) {
    const msgSuffix = msg ? `: ${msg}` : ".";
    msg = `Expected actual: "${actual}" to match: "${expected}"${msgSuffix}`;
    throw new AssertionError(msg);
  }
}
