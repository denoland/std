// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { format } from "../internal/format.ts";
import { AssertionError } from "./assertion_error.ts";

/**
 * Make an assertion that `actual` is less than `expected`.
 * If not then throw.
 *
 * @example
 * ```ts
 * import { assertLess } from "https://deno.land/std@$STD_VERSION/assert/assert_less.ts";
 *
 * assertLess(1, 2); // Doesn't throw
 * assertLess(2, 1); // Throws
 * ```
 */
export function assertLess<T>(actual: T, expected: T, msg?: string) {
  if (actual < expected) return;

  const actualString = format(actual);
  const expectedString = format(expected);
  throw new AssertionError(msg ?? `Expect ${actualString} < ${expectedString}`);
}
