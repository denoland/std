// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";
import { equal } from "../assert/equal.ts";
import { getMockCalls } from "./_mock_util.ts";
import { inspectArgs } from "./_inspect_args.ts";

export function toHaveBeenNthCalledWith(
  context: MatcherContext,
  nth: number,
  ...expected: unknown[]
): MatchResult {
  if (nth < 1) {
    new Error(`nth must be greater than 0. ${nth} was given.`);
  }

  const calls = getMockCalls(context.value);
  const callIndex = nth - 1;
  const hasBeenCalled = calls.length > callIndex &&
    equal(calls[callIndex].args, expected);

  if (context.isNot) {
    if (hasBeenCalled) {
      throw new AssertionError(
        `Expected the n-th call (n=${nth}) of mock function is not with ${
          inspectArgs(expected)
        }, but it was`,
      );
    }
  } else {
    if (!hasBeenCalled) {
      const nthCall = calls[callIndex];
      if (!nth) {
        throw new AssertionError(
          `Expected the n-th call (n=${nth}) of mock function is with ${
            inspectArgs(expected)
          }, but the n-th call does not exist.`,
        );
      } else {
        throw new AssertionError(
          `Expected the n-th call (n=${nth}) of mock function is with ${
            inspectArgs(expected)
          }, but it was with ${inspectArgs(nthCall.args)}.`,
        );
      }
    }
  }
}
