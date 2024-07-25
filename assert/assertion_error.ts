// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Error thrown when an assertion fails.
 *
 * @example
 * <caption>Usage</caption>

 * ```ts no-eval
 * import { AssertionError } from "@std/assert";
 *
 * throw new AssertionError("Assertion failed");
 * ```
 */
export class AssertionError extends Error {
  /** Constructs a new instance.
   *
   * @param message The error message.
   */
  constructor(message: string) {
    super(message);
    this.name = "AssertionError";
  }
}
