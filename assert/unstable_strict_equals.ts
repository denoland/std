// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { assertStrictEquals as _assertStrictEquals } from "./strict_equals.ts";
import { truncateDiff } from "@std/internal/truncate-build-message";
// deno-lint-ignore no-unused-vars
import type { DIFF_CONTEXT_LENGTH } from "@std/internal/truncate-build-message";

/**
 * Make an assertion that `actual` and `expected` are strictly equal, using
 * {@linkcode Object.is} for equality comparison. If not, then throw.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * The {@linkcode DIFF_CONTEXT_LENGTH} environment variable can be set to
 * enable truncation of long diffs, in which case its value should be a
 * positive integer representing the number of unchanged context lines to show
 * around each changed part of the diff. By default, diffs are not truncated.
 *
 * @example Usage
 * ```ts ignore
 * import { assertStrictEquals } from "@std/assert";
 *
 * const a = {};
 * const b = a;
 * assertStrictEquals(a, b); // Doesn't throw
 *
 * const c = {};
 * const d = {};
 * assertStrictEquals(c, d); // Throws
 * ```
 *
 * @typeParam T The type of the expected value.
 * @param actual The actual value to compare.
 * @param expected The expected value to compare.
 * @param msg The optional message to display if the assertion fails.
 */
export function assertStrictEquals<T>(
  actual: unknown,
  expected: T,
  msg?: string,
): asserts actual is T {
  const args: Parameters<typeof _assertStrictEquals> = [actual, expected, msg];
  // @ts-expect-error extra arg
  _assertStrictEquals(...args, truncateDiff);
}
