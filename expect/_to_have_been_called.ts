// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { getMockCalls } from "./_mock_util.ts";
import { AssertionError } from "../assert/assertion_error.ts";

export function toHaveBeenCalled(context: MatcherContext): MatchResult {
  const calls = getMockCalls(context.value);
  const hasBeenCalled = calls.length > 0;

  if (context.isNot) {
    if (hasBeenCalled) {
      throw new AssertionError(
        `Expected mock function not to be called, but it was called ${calls.length} time(s)`,
      );
    }
  } else {
    if (!hasBeenCalled) {
      throw new AssertionError(
        `Expected mock function to be called, but it was not called`,
      );
    }
  }
}
