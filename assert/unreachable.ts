// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { AssertionError } from "./assertion_error.ts";

/**
 * Use this to assert unreachable code.
 *
 * @example Usage
 * ```ts no-eval
 * import { unreachable } from "@std/assert/unreachable";
 *
 * unreachable(); // Throws
 * ```
 *
 * @param reason The reason why the code should be unreachable.
 * @returns Never returns, always throws.
 */
export function unreachable(reason?: string): never {
  throw new AssertionError(reason ?? "unreachable");
}
