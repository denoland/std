// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";

export function toBeGreaterThanOrEqual(
  context: MatcherContext,
  expected: number,
): MatchResult {
  const isGreaterOrEqual = Number(context.value) >= Number(expected);
  if (context.isNot) {
    if (isGreaterOrEqual) {
      throw new AssertionError(
        `Expected ${context.value} to NOT be greater than or equal ${expected}`,
      );
    }
  }
  if (!isGreaterOrEqual) {
    throw new AssertionError(
      `Expected ${context.value} to be greater than or equal ${expected}`,
    );
  }
}
