// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";

/* Similar to assertEqual(!!value) */
export function toBeTruthy(
  context: MatcherContext,
): MatchResult {
  const isTruthy = !!(context.value);
  if (context.isNot) {
    if (isTruthy) {
      throw new AssertionError(
        `Expected ${context.value} to NOT be truthy`,
      );
    }
  }
  if (!isTruthy) {
    throw new AssertionError(
      `Expected ${context.value} to be truthy`,
    );
  }
}
