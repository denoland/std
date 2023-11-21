// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";
import { equal } from "../assert/equal.ts";
import { getMockCalls } from "./_mock_util.ts";
import { inspectArg } from "./_inspect_args.ts";

export function toHaveNthReturnedWith(
  context: MatcherContext,
  nth: number,
  expected: unknown,
): MatchResult {
  if (nth < 1) {
    throw new Error(`nth(${nth}) must be greater than 0`);
  }

  const calls = getMockCalls(context.value);
  const returned = calls.filter((call) => call.returns);
  const returnIndex = nth - 1;
  const maybeNthReturned = returned[returnIndex];
  const nthReturnedWithExpected = maybeNthReturned &&
    equal(maybeNthReturned.returned, expected);

  if (context.isNot) {
    if (nthReturnedWithExpected) {
      throw new AssertionError(
        `Expected the mock function to not have n-th (n=${nth}) returned with ${
          inspectArg(expected)
        }, but it did`,
      );
    }
  } else {
    if (!nthReturnedWithExpected) {
      throw new AssertionError(
        `Expected the mock function to have n-th (n=${nth}) returned with ${
          inspectArg(expected)
        }, but it did not`,
      );
    }
  }
}
