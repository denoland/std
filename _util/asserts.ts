// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * These assertions exist to create a separation of concerns between internal and testing assertions.
 * All non-testing code within the codebase must use these assertions.
 */

export class DenoStdInternalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DenoStdInternalError";
  }
}

/** Make an assertion, if not `true`, then throw. */
export function assert(expr: unknown, msg = ""): asserts expr {
  if (!expr) {
    throw new DenoStdInternalError(msg);
  }
}

/** Use this to assert unreachable code. */
export function unreachable(): never {
  throw new DenoStdInternalError("unreachable");
}
