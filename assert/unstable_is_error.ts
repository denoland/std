// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { AssertionError } from "./assertion_error.ts";
import { stripAnsiCode } from "@std/internal/styles";

/**
 * A predicate to be checked against the error:
 * - If a string is supplied, this must be present in the error's `message` property.
 * - If a RegExp is supplied, this must match against the error's `message` property.
 * - If a predicate function is provided, this must return `true` for the error.
 */
export type ErrorPredicate<E extends Error> =
  | string
  | RegExp
  | ((e: E) => boolean);

/**
 * Make an assertion that `error` is an `Error`.
 * If not then an error will be thrown.
 * An error class and a string that should be included in the
 * error message can also be asserted.
 *
 * @example Usage
 * ```ts ignore
 * import { assertIsError } from "@std/assert";
 *
 * assertIsError(null); // Throws
 * assertIsError(new RangeError("Out of range")); // Doesn't throw
 * assertIsError(new RangeError("Out of range"), SyntaxError); // Throws
 * assertIsError(new RangeError("Out of range"), RangeError, "Out of range"); // Doesn't throw
 * assertIsError(new RangeError("Out of range"), RangeError, "Within range"); // Throws
 * ```
 *
 * @typeParam E The type of the error to assert.
 * @param error The error to assert.
 * @param ErrorClass The optional error class to assert.
 * @param predicate An optional string or RegExp to match against the error message, or a callback that should return `true` for the error.
 * @param msg The optional message to display if the assertion fails.
 */
export function assertIsError<E extends Error = Error>(
  error: unknown,
  // deno-lint-ignore no-explicit-any
  ErrorClass?: abstract new (...args: any[]) => E,
  predicate?: ErrorPredicate<E>,
  msg?: string,
): asserts error is E {
  const msgSuffix = msg ? `: ${msg}` : ".";

  if (!(error instanceof Error)) {
    throw new AssertionError(
      `Expected "error" to be an Error object${msgSuffix}`,
    );
  }
  if (ErrorClass && !(error instanceof ErrorClass)) {
    msg =
      `Expected error to be instance of "${ErrorClass.name}", but was "${error?.constructor?.name}"${msgSuffix}`;
    throw new AssertionError(msg);
  }
  let msgCheck;
  if (typeof predicate === "string") {
    msgCheck = stripAnsiCode(error.message).includes(
      stripAnsiCode(predicate),
    );
  } else if (predicate instanceof RegExp) {
    msgCheck = predicate.test(stripAnsiCode(error.message));
  } else if (typeof predicate === "function") {
    msgCheck = predicate(error as E);
    if (!msgCheck) {
      msg = `Error failed the check${msgSuffix}`;
      throw new AssertionError(msg);
    }
  }

  if (predicate && !msgCheck) {
    msg = `Expected error message to ${
      predicate instanceof RegExp
        ? `match ${predicate}`
        : `include ${JSON.stringify(predicate)}`
    }, but got ${JSON.stringify(error?.message)}${msgSuffix}`;
    throw new AssertionError(msg);
  }
}
