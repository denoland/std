// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { equal } from "./equal.ts";
import { AssertionError } from "./assertion_error.ts";

/**
 * Make an assertion that `actual` and `expected` are not equal, deeply.
 * If not then throw.
 *
 * Type parameter can be specified to ensure values under comparison have the same type.
 *
 * @example
 * ```ts
 * import { assertNotEquals } from "@std/assert/assert-not-equals";
 *
 * assertNotEquals(1, 2); // Doesn't throw
 * assertNotEquals(1, 1); // Throws
 * ```
 */
export function assertNotEquals<T>(actual: T, expected: T, msg?: string) {
  if (!equal(actual, expected)) {
    return;
  }
  const actualString = String(actual);
  const expectedString = String(expected);
  const msgSuffix = msg ? `: ${msg}` : ".";
  throw new AssertionError(
    `Expected actual: ${actualString} not to be: ${expectedString}${msgSuffix}`,
  );
}
