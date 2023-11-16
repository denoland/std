// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";

export function toBeLessThan(
  context: MatcherContext,
  expected: number,
): MatchResult {
  const isLower = Number(context.value) < Number(expected);
  if (context.isNot) {
    if (isLower) {
      throw new AssertionError(
        `Expected ${context.value} to NOT be lower than ${expected}`,
      );
    }
  }
  if (!isLower) {
    throw new AssertionError(
      `Expected ${context.value} to be lower than ${expected}`,
    );
  }
}
