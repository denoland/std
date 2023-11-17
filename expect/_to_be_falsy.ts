// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";

export function toBeFalsy(
  context: MatcherContext,
): MatchResult {
  const isFalsy = !(context.value);
  if (context.isNot) {
    if (isFalsy) {
      throw new AssertionError(
        `Expected ${context.value} to NOT be falsy`,
      );
    }
  } else {
    if (!isFalsy) {
      throw new AssertionError(
        `Expected ${context.value} to be falsy`,
      );
    }
  }
}
