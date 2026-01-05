// Copyright 2018-2026 the Deno authors. MIT license.

// This file is copied from `std/assert`.

import { AssertionError } from "@std/assert/assertion-error";
import { buildNotEqualErrorMessage } from "./_build_message.ts";
import { equal } from "./_equal.ts";
import type { EqualOptions } from "./_types.ts";

/**
 * Make an assertion that `actual` and `expected` are not equal, deeply.
 * If not then throw.
 *
 * Type parameter can be specified to ensure values under comparison have the same type.
 *
 * @example
 * ```ts ignore
 * import { assertNotEquals } from "@std/assert";
 *
 * assertNotEquals(1, 2); // Doesn't throw
 * assertNotEquals(1, 1); // Throws
 * ```
 */
export function assertNotEquals<T>(
  actual: T,
  expected: T,
  options: EqualOptions = {},
) {
  if (!equal(actual, expected, options)) {
    return;
  }

  const message = buildNotEqualErrorMessage(actual, expected, options ?? {});
  throw new AssertionError(message);
}
