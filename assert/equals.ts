// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { equal } from "./equal.ts";
import { buildMessage } from "@std/internal/build-message";
import { diff } from "@std/internal/diff";
import { diffStr } from "@std/internal/diff-str";
import { format } from "@std/internal/format";

import { AssertionError } from "./assertion_error.ts";

// Walks `value` (avoiding cycles) and returns true if any own property,
// array element, Map value, or Set element is a function. Used to surface
// a hint when assertEquals throws on inputs whose only difference is a
// function property, which prints as an identical-looking `[Function: …]`
// in the diff but compares by reference.
function containsFunction(value: unknown, seen: WeakSet<object>): boolean {
  if (typeof value === "function") return true;
  if (value === null || typeof value !== "object") return false;
  if (seen.has(value as object)) return false;
  seen.add(value as object);
  if (value instanceof Map) {
    for (const v of value.values()) {
      if (containsFunction(v, seen)) return true;
    }
    return false;
  }
  if (value instanceof Set) {
    for (const v of value.values()) {
      if (containsFunction(v, seen)) return true;
    }
    return false;
  }
  for (const k of Reflect.ownKeys(value as object)) {
    if (
      containsFunction(
        (value as Record<string | symbol, unknown>)[k],
        seen,
      )
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Make an assertion that `actual` and `expected` are equal, deeply. If not
 * deeply equal, then throw.
 *
 * Type parameter can be specified to ensure values under comparison have the
 * same type.
 *
 * Note: This function is based on value equality, but for some cases (such as
 * data that can only be read asynchronously or function properties) value
 * equality is not possible to determine. In such cases, reference equality is
 * used instead, which may cause false negatives for objects such as `Blob`s or
 * `Request`s.
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

  if (
    containsFunction(actual, new WeakSet()) ||
    containsFunction(expected, new WeakSet())
  ) {
    message +=
      "\n  Note: function properties are compared by reference, so two distinct functions print the same as `[Function: name]` but are not equal.";
  }

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
