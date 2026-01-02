// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { assertEquals as _assertEquals } from "./equals.ts";
import { truncateDiff } from "@std/internal/truncate-build-message";
// deno-lint-ignore no-unused-vars
import type { DIFF_CONTEXT_LENGTH } from "@std/internal/truncate-build-message";

/**
 * Make an assertion that `actual` and `expected` are equal, deeply. If not
 * deeply equal, then throw.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
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
  const args: Parameters<typeof _assertEquals> = [actual, expected, msg];
  // @ts-expect-error extra arg
  _assertEquals(...args, truncateDiff);
}
