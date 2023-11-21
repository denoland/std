// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";
import { equal } from "../assert/equal.ts";
import { getMockCalls } from "./_mock_util.ts";
import { inspectArgs } from "./_inspect_args.ts";

export function toHaveBeenLastCalledWith(
  context: MatcherContext,
  ...expected: unknown[]
): MatchResult {
  const calls = getMockCalls(context.value);
  const hasBeenCalled = calls.length > 0 &&
    equal(calls[calls.length - 1].args, expected);

  if (context.isNot) {
    if (hasBeenCalled) {
      throw new AssertionError(
        `Expected mock function not to be last called with ${
          inspectArgs(expected)
        }, but it was`,
      );
    }
  } else {
    if (!hasBeenCalled) {
      const lastCall = calls.at(-1);
      if (!lastCall) {
        throw new AssertionError(
          `Expected mock function to be last called with ${
            inspectArgs(expected)
          }, but it was not.`,
        );
      } else {
        throw new AssertionError(
          `Expected mock function to be last called with ${
            inspectArgs(expected)
          }, but it was last called with ${inspectArgs(lastCall.args)}.`,
        );
      }
    }
  }
}
