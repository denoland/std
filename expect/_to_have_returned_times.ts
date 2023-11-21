// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";
import { getMockCalls } from "./_mock_util.ts";

export function toHaveReturnedTimes(
  context: MatcherContext,
  expected: number,
): MatchResult {
  const calls = getMockCalls(context.value);
  const returned = calls.filter((call) => call.returns);

  if (context.isNot) {
    if (returned.length === expected) {
      throw new AssertionError(
        `Expected the mock function to not have returned ${expected} times, but it returned ${returned.length} times`,
      );
    }
  } else {
    if (returned.length !== expected) {
      throw new AssertionError(
        `Expected the mock function to have returned ${expected} times, but it returned ${returned.length} times`,
      );
    }
  }
}
