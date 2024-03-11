// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertIsError } from "./assert_is_error.ts";
import { AssertionError } from "./assertion_error.ts";

type ExpectedErrorO = {
  // deno-lint-ignore no-explicit-any
  ErrorClass: (new (...args: any[]) => Error) | undefined;
  msgIncludes: string | undefined;
  msgSuffix: string;
  msg: string | undefined;
};

function parseAssertThrowsExpectedError<E extends Error>(
  // deno-lint-ignore no-explicit-any
  errorClassOrMsg?: (new (...args: any[]) => Error) | string,
  msgIncludesOrMsg?: string,
  msg?: string,
): ExpectedErrorO {
  // deno-lint-ignore no-explicit-any
  let ErrorClass: (new (...args: any[]) => E) | undefined = undefined;
  let msgIncludes: string | undefined = undefined;

  if (typeof errorClassOrMsg !== "string") {
    if (
      errorClassOrMsg === undefined ||
      errorClassOrMsg.prototype instanceof Error ||
      errorClassOrMsg.prototype === Error.prototype
    ) {
      // deno-lint-ignore no-explicit-any
      ErrorClass = errorClassOrMsg as new (...args: any[]) => E;
      msgIncludes = msgIncludesOrMsg;
    } else {
      msg = msgIncludesOrMsg;
    }
  } else {
    msg = errorClassOrMsg;
  }
  const msgSuffix = msg ? `: ${msg}` : ".";

  return {
    ErrorClass,
    msgIncludes,
    msgSuffix,
    msg,
  };
}

// deno-lint-ignore no-explicit-any
function parseAssertThrowsError(expectedError: ExpectedErrorO, error: any) {
  if (expectedError.ErrorClass) {
    if (error instanceof Error === false) {
      throw new AssertionError(
        `A non-Error object was thrown${expectedError.msgSuffix}`,
      );
    }
    assertIsError(
      error,
      expectedError.ErrorClass,
      expectedError.msgIncludes,
      expectedError.msg,
    );
  }
  return error;
}

/**
 * Executes a function, expecting it to throw. If it does not, then it
 * throws.
 *
 * @example
 * ```ts
 * import { assertThrows } from "https://deno.land/std@$STD_VERSION/assert/assert_throws.ts";
 *
 * assertThrows(() => { throw new TypeError("hello world!"); }); // Doesn't throw
 * assertThrows(() => console.log("hello world!")); // Throws
 * ```
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
 * @example
 * ```ts
 * import { assertThrows } from "https://deno.land/std@$STD_VERSION/assert/assert_throws.ts";
 *
 * assertThrows(() => { throw new TypeError("hello world!"); }, TypeError); // Doesn't throw
 * assertThrows(() => { throw new TypeError("hello world!"); }, RangeError); // Throws
 * ```
 */
export function assertThrows<E extends Error = Error>(
  fn: () => unknown,
  // deno-lint-ignore no-explicit-any
  ErrorClass: new (...args: any[]) => E,
  msgIncludes?: string,
  msg?: string,
): E;
export function assertThrows<E extends Error = Error>(
  fn: () => unknown,
  errorClassOrMsg?:
    // deno-lint-ignore no-explicit-any
    | (new (...args: any[]) => E)
    | string,
  msgIncludesOrMsg?: string,
  msg?: string,
): E | Error | unknown {
  let err;
  let doesThrow = false;
  const parsedExpectedError = parseAssertThrowsExpectedError<E>(
    errorClassOrMsg,
    msgIncludesOrMsg,
    msg,
  );

  try {
    fn();
  } catch (error) {
    doesThrow = true;
    err = parseAssertThrowsError(parsedExpectedError, error);
  }
  if (!doesThrow) {
    msg = `Expected function to throw${parsedExpectedError.msgSuffix}`;
    throw new AssertionError(msg);
  }
  return err;
}

/**
 * Executes an async function, expecting it to throw. If it does not, then it
 * throws.
 *
 * @example
 * ```ts
 * import { assertThrowsAsync } from "https://deno.land/std@$STD_VERSION/assert/assert_throws.ts";
 *
 * assertThrowsAsync(() => { throw new TypeError("hello world!"); }); // Doesn't throw
 * assertThrowsAsync(async () => await new Promise((_, reject) => { reject() })); // Throws
 * ```
 */
export async function assertThrowsAsync(
  fn: () => Promise<unknown>,
  msg?: string,
): Promise<unknown>;
/**
 * Executes a function, expecting it to throw. If it does not, then it
 * throws. An error class and a string that should be included in the
 * error message can also be asserted.
 *
 * @example
 * ```ts
 * import { assertThrowsAsync } from "https://deno.land/std@$STD_VERSION/assert/assert_throws.ts";
 *
 * assertThrowsAsync(() => { throw new TypeError("hello world!"); }, TypeError); // Doesn't throw
 * assertThrowsAsync(() => { throw new TypeError("hello world!"); }, RangeError); // Throws
 * ```
 */
export async function assertThrowsAsync<E extends Error = Error>(
  fn: () => Promise<unknown>,
  // deno-lint-ignore no-explicit-any
  ErrorClass: new (...args: any[]) => E,
  msgIncludes?: string,
  msg?: string,
): Promise<E>;
export async function assertThrowsAsync<E extends Error = Error>(
  fn: () => Promise<unknown>,
  errorClassOrMsg?:
    // deno-lint-ignore no-explicit-any
    | (new (...args: any[]) => E)
    | string,
  msgIncludesOrMsg?: string,
  msg?: string,
): Promise<E | Error | unknown> {
  let err;
  let doesThrow = false;
  const parsedExpectedError = parseAssertThrowsExpectedError<E>(
    errorClassOrMsg,
    msgIncludesOrMsg,
    msg,
  );

  try {
    await fn();
  } catch (error) {
    doesThrow = true;
    err = parseAssertThrowsError(parsedExpectedError, error);
  }
  if (!doesThrow) {
    msg = `Expected function to throw${parsedExpectedError.msgSuffix}`;
    throw new AssertionError(msg);
  }

  return err;
}
