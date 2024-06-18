// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { stripAnsiCode } from "@std/internal/styles";

/**
 * Error thrown when a strict assertion fails.
 *
 * @example Usage
 * ```ts no-eval
 * import { StrictAssertionError } from "@std/internal/assert-strict";
 *
 * throw new StrictAssertionError("Assertion failed");
 * ```
 */
export class StrictAssertionError extends Error {
  /**
   * Constructs a new instance.
   *
   * @example Usage
   * ```ts no-eval
   * import { StrictAssertionError } from "@std/internal/assert-strict";
   *
   * throw new StrictAssertionError("Assertion failed");
   * ```
   *
   * @param message The error message.
   * @param options Error options.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

/**
 * Asserts that the error is an instance of the given error class and that the
 * error message is a given string.
 *
 * @throws {StrictAssertionError} If the error is not an instance of the given
 * error.
 * @typeParam E The type of the error to assert.
 * @param error The error to assert.
 * @param ErrorClass The error class to assert.
 * @param msgEquals The string to assert equals the error message.
 */
function assertStrictIsError<E extends Error = Error>(
  error: unknown,
  // deno-lint-ignore no-explicit-any
  errorClass: new (...args: any[]) => E,
  msgEquals: string,
): asserts error is E {
  if (!(error instanceof Error)) {
    throw new StrictAssertionError(`Expected "error" to be an Error object`);
  }
  if (!(error instanceof errorClass)) {
    throw new StrictAssertionError(
      `Expected error to be instance of "${errorClass.name}", but was "${error?.constructor.name}"`,
    );
  }
  if (stripAnsiCode(error.message) !== stripAnsiCode(msgEquals)) {
    throw new StrictAssertionError(
      `Expected error message to be ${JSON.stringify(msgEquals)}, but got ${
        JSON.stringify(error?.message)
      }`,
    );
  }
}

/**
 * Asserts that the given function throws an error that is an instance of the
 * given error class and that the error message is a given string.
 *
 * @example Usage
 * ```ts no-assert
 * import { assertStrictThrows } from "@std/internal/assert-strict";
 *
 * assertStrictThrows(
 *   () => {
 *     throw new RangeError("Out of range");
 *   },
 *   RangeError,
 *   "Out of range"
 * );
 * ```
 *
 * @throws {StrictAssertionError} If the function does not throw an error, or if
 * the error is not an instance of the given error class, or if the error
 * message is not the given string.
 * @typeParam E The type of the error to assert.
 * @param fn The function to assert throws an error.
 * @param errorClass The error class to assert.
 * @param msgEquals The string to assert equals the error message.
 */
export function assertStrictThrows<E extends Error = Error>(
  fn: () => unknown,
  // deno-lint-ignore no-explicit-any
  errorClass: new (...args: any[]) => E,
  msgEquals: string,
) {
  let thrownError;
  try {
    fn();
  } catch (error) {
    thrownError = error;
  }
  assertStrictIsError(thrownError, errorClass, msgEquals);
}

/**
 * Asserts that the given function rejects with an error that is an instance of
 * the given error class and that the error message is a given string.
 *
 * @example Usage
 * ```ts no-assert
 * import { assertStrictRejects } from "@std/internal/assert-strict";
 *
 * await assertStrictRejects(
 *   async () => {
 *     await Promise.reject(new RangeError("Out of range"));
 *   },
 *   RangeError,
 *   "Out of range"
 * );
 * ```
 *
 * @throws {StrictAssertionError} If the function does not reject with an error,
 * or if the error is not an instance of the given error class, or if the error
 * message is not the given string.
 * @typeParam E The type of the error to assert.
 * @param fn The function to assert rejects with an error.
 * @param errorClass The error class to assert.
 * @param msgEquals The string to assert equals the error message.
 */
export async function assertStrictRejects<E extends Error = Error>(
  fn: () => PromiseLike<unknown>,
  // deno-lint-ignore no-explicit-any
  errorClass: new (...args: any[]) => E,
  msgEquals: string,
) {
  let rejectedError;
  try {
    await fn();
  } catch (error) {
    rejectedError = error;
  }
  assertStrictIsError(rejectedError, errorClass, msgEquals);
}
