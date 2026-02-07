// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { equal } from "./equal.ts";
import { buildMessage } from "@std/internal/build-message";
import { diff } from "@std/internal/diff";
import { diffStr } from "@std/internal/diff-str";
import { format } from "@std/internal/format";

import { AssertionError } from "./assertion_error.ts";

/**
 * Make an assertion that `actual` and `expected` are equal, deeply. If not
 * deeply equal, then throw.
 *
 * Type parameter can be specified to ensure values under comparison have the
 * same type.
 *
 * Note: Types whose state is not exposed as enumerable properties, such as
 * `Blob`, `ReadableStream`, `Request`, and `Response`, may produce unreliable
 * results. For `Blob` and `File`, compare via `Blob.bytes()` instead.
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
  const diffMsg = buildMessage(diffResult, { stringDiff }, arguments[3])
    .join("\n");
  message = `${message}\n${diffMsg}`;
  throw new AssertionError(message);
}
