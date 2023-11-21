// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";
import { getMockCalls } from "./_mock_util.ts";
import { inspectArgs } from "./_inspect_args.ts";

export function toHaveBeenLastCalledWith(
  context: MatcherContext,
  ...expected: unknown[]
): MatchResult {
}
