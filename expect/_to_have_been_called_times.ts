// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";
import { getMockCalls } from "./_mock_util.ts";

export function toHaveBeenCalledTimes(
  context: MatcherContext,
  expected: number,
): MatchResult {
  const calls = getMockCalls(context.value);

  if (context.isNot) {
    if (calls.length === expected) {
      throw new AssertionError(
        `Expected mock function not to be called ${expected} time(s), but it was`,
      );
    }
  } else {
    if (calls.length !== expected) {
      throw new AssertionError(
        `Expected mock function to be called ${expected} time(s), but it was called ${calls.length} time(s)`,
      );
    }
  }
}
