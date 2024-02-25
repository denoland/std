// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertIsError } from "./assert_is_error.ts";
import { AssertionError } from "./assertion_error.ts";

/**
 * Executes an async function, expecting it to throw. If it does not, then it
 * throws.
 *
 * @example
 * ```ts
 * import { assertThrowsAsync } from "https://deno.land/std@$STD_VERSION/assert/assert_throws_async.ts";
 *
 * await assertThrowsAsync(async () => { return await new Promise(() => { throw new TypeError("hello world!"); }) }); // Doesn't throw
 * await assertThrowsAsync(async () => { return await new Promise(() => console.log("hello world!"))}); // Throws
 * ```
 */
export function assertThrowsAsync(
  fn: () => Promise<unknown>,
  msg?: string,
): Promise<unknown>;
/**
 * Executes an async function, expecting it to throw. If it does not, then it
 * throws. An error class and a string that should be included in the
 * error message can also be asserted.
 *
 * @example
 * ```ts
 * import { assertThrows } from "https://deno.land/std@$STD_VERSION/assert/assert_throws.ts";
 *
 * await assertThrowsAsync(async () => { return await new Promise(() => { throw new TypeError("hello world!"); }) }, TypeError); // Doesn't throw
 * await assertThrowsAsync(async () => { return await new Promise(() => { throw new TypeError("hello world!"); }) }, RangeError); // Throws
 * ```
 */
export function assertThrowsAsync<E extends Error = Error>(
  fn: () => Promise<unknown>,
  // deno-lint-ignore no-explicit-any
  ErrorClass: new (...args: any[]) => E,
  msgIncludes?: string,
  msg?: string
): Promise<E>;
export async function assertThrowsAsync<E extends Error = Error>(
  fn: () => Promise<unknown>,
  errorClassOrMsg?: // deno-lint-ignore no-explicit-any
    (new (...args: any[]) => E) | string,
  msgIncludesOrMsg?: string,
  msg?: string,
): Promise<E | Error | unknown> {
  // deno-lint-ignore no-explicit-any
  let ErrorClass: (new (...args: any[]) => E) | undefined = undefined;
  let msgIncludes: string | undefined = undefined;
  let err;

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
  let doesThrow = false;
  const msgSuffix = msg ? `: ${msg}` : ".";
  try {
    await fn();
  } catch (error) {
    if (ErrorClass) {
      if (error instanceof Error === false) {
        throw new AssertionError(`A non-Error object was thrown${msgSuffix}`);
      }
      assertIsError(error, ErrorClass, msgIncludes, msg);
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
