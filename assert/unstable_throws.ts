// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { assertIsError, type ErrorCheck } from "./unstable_is_error.ts";
import { AssertionError } from "./assertion_error.ts";

/**
 * Executes a function, expecting it to throw. If it does not, then it
 * throws.
 *
 * To assert that an asynchronous function rejects, use
 * {@linkcode assertRejects}.
 *
 * @example Usage
 * ```ts ignore
 * import { assertThrows } from "@std/assert";
 *
 * assertThrows(() => { throw new TypeError("hello world!"); }); // Doesn't throw
 * assertThrows(() => console.log("hello world!")); // Throws
 * ```
 *
 * @param fn The function to execute.
 * @param msg The optional message to display if the assertion fails.
 * @returns The error that was thrown.
 */
export function assertThrows(
  fn: () => unknown,
  msg?: string,
): unknown;
/**
 * Executes a function, expecting it to throw. If it does not, then it
 * throws. An error class and a string that should be included in the
 * error message can also be asserted.
 *
 * To assert that an asynchronous function rejects, use
 * {@linkcode assertRejects}.
 *
 * @example Usage
 * ```ts ignore
 * import { assertThrows } from "@std/assert";
 *
 * assertThrows(() => { throw new TypeError("hello world!"); }, TypeError); // Doesn't throw
 * assertThrows(() => { throw new TypeError("hello world!"); }, RangeError); // Throws
 * ```
 *
 * @typeParam E The error class to assert.
 * @param fn The function to execute.
 * @param ErrorClass The error class to assert.
 * @param check A string that should be included in the error message, or a callback that should return `true` for the error.
 * @param msg The optional message to display if the assertion fails.
 * @returns The error that was thrown.
 */
export function assertThrows<E extends Error = Error>(
  fn: () => unknown,
  // deno-lint-ignore no-explicit-any
  ErrorClass: abstract new (...args: any[]) => E,
  check?: ErrorCheck<E>,
  msg?: string,
): E;
export function assertThrows<E extends Error = Error>(
  fn: () => unknown,
  errorClassOrMsg?:
    // deno-lint-ignore no-explicit-any
    | (abstract new (...args: any[]) => E)
    | string,
  check?: ErrorCheck<E>,
  msg?: string,
): E | Error | unknown {
  // deno-lint-ignore no-explicit-any
  let ErrorClass: (abstract new (...args: any[]) => E) | undefined;
  let err;

  if (typeof errorClassOrMsg !== "string") {
    if (
      errorClassOrMsg === undefined ||
      errorClassOrMsg?.prototype instanceof Error ||
      errorClassOrMsg?.prototype === Error.prototype
    ) {
      ErrorClass = errorClassOrMsg;
    } else {
      msg = check as string;
    }
  } else {
    msg = errorClassOrMsg;
  }
  let doesThrow = false;
  const msgSuffix = msg ? `: ${msg}` : ".";
  try {
    fn();
  } catch (error) {
    if (ErrorClass) {
      if (error instanceof Error === false) {
        throw new AssertionError(`A non-Error object was thrown${msgSuffix}`);
      }
      assertIsError(
        error,
        ErrorClass,
        check,
        msg,
      );
    }
    err = error;
    doesThrow = true;
  }
  if (!doesThrow) {
    msg = `Expected function to throw${msgSuffix}`;
    throw new AssertionError(msg);
  }
  return err;
}
