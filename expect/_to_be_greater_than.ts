// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";

export function toBeGreaterThan(
  context: MatcherContext,
  expected: number,
): MatchResult {
  const isGreater = Number(context.value) > Number(expected);
  if (context.isNot) {
    if (isGreater) {
      throw new AssertionError(
        `Expected ${context.value} to NOT be greater than ${expected}`,
      );
    }
  }
  if (!isGreater) {
    throw new AssertionError(
      `Expected ${context.value} to be greater than ${expected}`,
    );
  }
}
