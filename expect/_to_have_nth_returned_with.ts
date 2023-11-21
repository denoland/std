// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";
import { equal } from "../assert/equal.ts";
import { getMockCalls } from "./_mock_util.ts";

export function toHaveNthReturnedWith(
  context: MatcherContext,
  nth: number,
  expected: unknown,
): MatchResult {
  const calls = getMockCalls(context.value);
}
