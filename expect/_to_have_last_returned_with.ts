// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";
import { equal } from "../assert/equal.ts";
import { getMockCalls } from "./_mock_util.ts";
import { inspectArg } from "./_inspect_args.ts";

export function toHaveLastReturnedWith(
  context: MatcherContext,
  expected: unknown,
): MatchResult {
  const calls = getMockCalls(context.value);
  const returned = calls.filter((call) => call.returns);
  const lastReturnedWithExpected = returned.length > 0 &&
    equal(returned[returned.length - 1].returned, expected);

  if (context.isNot) {
    if (lastReturnedWithExpected) {
      throw new AssertionError(
        `Expected the mock function to not have last returned with ${
          inspectArg(expected)
        }, but it did`,
      );
    }
  } else {
    if (!lastReturnedWithExpected) {
      throw new AssertionError(
        `Expected the mock function to have last returned with ${
          inspectArg(expected)
        }, but it did not`,
      );
    }
  }
}
