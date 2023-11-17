// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { AssertionError } from "../assert/assertion_error.ts";
import { MatcherContext, MatchResult } from "./_types.ts";

export function toContain(
  context: MatcherContext,
  expected: unknown,
): MatchResult {
  // deno-lint-ignore no-explicit-any
  const doesContain = (context.value as any)?.includes?.(expected);
  if (context.isNot) {
    if (doesContain) {
      throw new AssertionError("The value contains the expected item");
    }
  } else {
    if (!doesContain) {
      throw new AssertionError("The value doesn't contain the expected item");
    }
  }
}
