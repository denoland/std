// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Error thrown when an assertion fails.
 *
 * @example Usage
 * ```ts no-eval
 * import { AssertionError } from "@std/assert/assertion-error";
 *
 * throw new AssertionError("Assertion failed");
 * ```
 */
export class AssertionError extends Error {
  /** Constructs a new instance.
   *
   * @example Usage
   * ```ts no-eval
   * import { AssertionError } from "@std/assert/assertion-error";
   *
   * throw new AssertionError("Assertion failed");
   * ```
   *
   * @param message The error message.
   */
  constructor(message: string) {
    super(message);
    this.name = "AssertionError";
  }
}
