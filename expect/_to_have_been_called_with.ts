// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";
import { equal } from "../assert/equal.ts";
import { getMockCalls } from "./_mock_util.ts";
import { inspectArgs } from "./_inspect_args.ts";

export function toHaveBeenCalledWith(
  context: MatcherContext,
  ...expected: unknown[]
): MatchResult {
  const calls = getMockCalls(context.value);
  const hasBeenCalled = calls.some((call) => equal(call.args, expected));

  if (context.isNot) {
    if (hasBeenCalled) {
      throw new AssertionError(
        `Expected mock function not to be called with ${
          inspectArgs(expected)
        }, but it was`,
      );
    }
  } else {
    if (!hasBeenCalled) {
      let otherCalls = "";
      if (calls.length > 0) {
        otherCalls = `\n  Other calls:\n     ${
          calls.map((call) => inspectArgs(call.args)).join("\n    ")
        }`;
      }
      throw new AssertionError(
        `Expected mock function to be called with ${
          inspectArgs(expected)
        }, but it was not.${otherCalls}`,
      );
    }
  }
}
