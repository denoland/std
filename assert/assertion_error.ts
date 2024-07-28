// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Error thrown when an assertion fails.
 *
 * @example Usage
 * ```ts no-eval
 * import { AssertionError } from "@std/assert";
 *
 * // Throw an AssertionError:
 * throw new AssertionError("Assertion failed");
 *
 * // Throw an AssertionError with a specified cause:
 * const originalError = new Error("foo");
 * try {
 *   try {
 *     throw originalError;
 *   } catch (cause) {
 *     throw new AssertionError("bar", { cause });
 *   }
 * } catch (cause) {
 *   cause instanceof AssertionError && // true
 *     cause.message === "bar" && // true
 *     cause.cause === originalError; // true
 * }
 * ```
 */
export class AssertionError extends Error {
  /** Constructs a new instance.
   *
   * @param message The error message.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AssertionError";
  }
}
