// Copyright 2018-2025 the Deno authors. MIT license.

import type { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "@std/assert/assertion-error";
import { equal } from "@std/assert/equal";
import { getMockCalls } from "./_mock_util.ts";
import { inspectArg } from "./_inspect_args.ts";

export function toHaveReturnedWith(
  context: MatcherContext,
  expected: unknown,
): MatchResult {
  const calls = getMockCalls(context.value);
  const returned = calls.filter((call) => call.returns);
  const returnedWithExpected = returned.some((call) =>
    equal(call.returned, expected)
  );

  if (context.isNot) {
    if (returnedWithExpected) {
      throw new AssertionError(
        `Expected the mock function to not have returned with ${
          inspectArg(expected)
        }, but it did`,
      );
    }
  } else {
    if (!returnedWithExpected) {
      throw new AssertionError(
        `Expected the mock function to have returned with ${
          inspectArg(expected)
        }, but it did not`,
      );
    }
  }
}
