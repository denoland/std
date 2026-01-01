// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { assertFalse } from "./false.ts";

/**
 * Make an assertion that `obj` is not an instance of `type`.
 * If so, then throw.
 *
 * @example Usage
 * ```ts ignore
 * import { assertNotInstanceOf } from "@std/assert";
 *
 * assertNotInstanceOf(new Date(), Number); // Doesn't throw
 * assertNotInstanceOf(new Date(), Date); // Throws
 * ```
 *
 * @typeParam A The type of the object to check.
 * @typeParam T The type of the class to check against.
 * @param actual The object to check.
 * @param unexpectedType The class constructor to check against.
 * @param msg The optional message to display if the assertion fails.
 */
export function assertNotInstanceOf<A, T>(
  actual: A,
  // deno-lint-ignore no-explicit-any
  unexpectedType: abstract new (...args: any[]) => T,
  msg?: string,
): asserts actual is Exclude<A, T> {
  const msgSuffix = msg ? `: ${msg}` : ".";
  msg =
    `Expected object to not be an instance of "${typeof unexpectedType}"${msgSuffix}`;
  assertFalse(actual instanceof unexpectedType, msg);
}
