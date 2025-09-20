// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { equal } from "./equal.ts";
import { buildMessage } from "@std/internal/build-message";
import { diff } from "@std/internal/diff";
import { diffStr } from "@std/internal/diff-str";
import { format } from "@std/internal/format";

import { AssertionError } from "./assertion_error.ts";
// deno-lint-ignore no-unused-vars
import type { DIFF_CONTEXT_LENGTH } from "@std/internal/build-message";

/**
 * Make an assertion that `actual` and `expected` are equal, deeply. If not
 * deeply equal, then throw.
 *
 * Type parameter can be specified to ensure values under comparison have the
 * same type.
 *
 * Note: When comparing `Blob` objects, you should first convert them to
 * `Uint8Array` using the `Blob.bytes()` method and then compare their
 * contents.
 *
 * The {@linkcode DIFF_CONTEXT_LENGTH} environment variable can be set to
 * enable truncation of long diffs, in which case its value should be a
 * positive integer representing the number of unchanged context lines to show
 * around each changed part of the diff. By default, diffs are not truncated.
 *
 * @example Usage
 * ```ts ignore
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals("world", "world"); // Doesn't throw
 * assertEquals("hello", "world"); // Throws
 * ```
 * @example Compare `Blob` objects
 * ```ts ignore
 * import { assertEquals } from "@std/assert";
 *
 * const bytes1 = await new Blob(["foo"]).bytes();
 * const bytes2 = await new Blob(["foo"]).bytes();
 *
 * assertEquals(bytes1, bytes2);
 * ```
 *
 * @typeParam T The type of the values to compare. This is usually inferred.
 * @param actual The actual value to compare.
 * @param expected The expected value to compare.
 * @param msg The optional message to display if the assertion fails.
 */
export function assertEquals<T>(
  actual: T,
  expected: T,
  msg?: string,
) {
  if (equal(actual, expected)) {
    return;
  }
  const msgSuffix = msg ? `: ${msg}` : ".";
  let message = `Values are not equal${msgSuffix}`;

  const actualString = format(actual);
  const expectedString = format(expected);
  const stringDiff = (typeof actual === "string") &&
    (typeof expected === "string");
  const diffResult = stringDiff
    ? diffStr(actual as string, expected as string)
    : diff(actualString.split("\n"), expectedString.split("\n"));
  const diffMsg = buildMessage(diffResult, { stringDiff }).join("\n");
  message = `${message}\n${diffMsg}`;
  throw new AssertionError(message);
}
