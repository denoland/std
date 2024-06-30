// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { buildMessage, diff, diffStr, format, red } from "@std/internal";
import { AssertionError } from "./assertion_error.ts";

/**
 * Make an assertion that `actual` and `expected` are strictly equal, using
 * {@linkcode Object.is} for equality comparison. If not, then throw.
 *
 * @example Usage
 * ```ts no-eval
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
  if (Object.is(actual, expected)) {
    return;
  }

  const msgSuffix = msg ? `: ${msg}` : ".";
  let message: string;

  const actualString = format(actual);
  const expectedString = format(expected);

  if (actualString === expectedString) {
    const withOffset = actualString
      .split("\n")
      .map((l) => `    ${l}`)
      .join("\n");
    message =
      `Values have the same structure but are not reference-equal${msgSuffix}\n\n${
        red(withOffset)
      }\n`;
  } else {
    const stringDiff = (typeof actual === "string") &&
      (typeof expected === "string");
    const diffResult = stringDiff
      ? diffStr(actual as string, expected as string)
      : diff(actualString.split("\n"), expectedString.split("\n"));
    const diffMsg = buildMessage(diffResult, { stringDiff }).join("\n");
    message = `Values are not strictly equal${msgSuffix}\n${diffMsg}`;
  }

  throw new AssertionError(message);
}
