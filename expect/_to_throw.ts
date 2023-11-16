// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";
import { assertIsError } from "../assert/assert_is_error.ts";

/* Similar to assertIsError with value thrown error*/
export function toThrow<E extends Error = Error>(
  context: MatcherContext,
  // deno-lint-ignore no-explicit-any
  expected: new (...args: any[]) => E,
): MatchResult {
  if (typeof context.value === "function") {
    try {
      context.value = context.value();
    } catch (err) {
      context.value = err;
    }
  }
  if (context.isNot) {
    let isError = false;
    try {
      assertIsError(context.value, expected, undefined, context.customMessage);
      isError = true;
      throw new AssertionError(`Expected to NOT throw ${expected}`);
    } catch (e) {
      if (isError) {
        throw e;
      }
      return;
    }
  }
  return assertIsError(
    context.value,
    expected,
    undefined,
    context.customMessage,
  );
}
