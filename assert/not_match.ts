// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { AssertionError } from "./assertion_error.ts";

/**
 * Make an assertion that `actual` not match RegExp `expected`. If match
 * then throw.
 *
 * @example Usage
 * ```ts ignore
 * import { assertNotMatch } from "@std/assert";
 *
 * assertNotMatch("Denosaurus", /Raptor/); // Doesn't throw
 * assertNotMatch("Raptor", /Raptor/); // Throws
 * ```
 *
 * @param actual The actual value to match.
 * @param expected The expected value to not match.
 * @param msg The optional message to display if the assertion fails.
 */
export function assertNotMatch(
  actual: string,
  expected: RegExp,
  msg?: string,
) {
  if (!expected.test(actual)) return;
  const msgSuffix = msg ? `: ${msg}` : ".";
  msg = `Expected actual: "${actual}" to not match: "${expected}"${msgSuffix}`;
  throw new AssertionError(msg);
}
