// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";

export function toHaveLength(
  context: MatcherContext,
  expected: number,
): MatchResult {
  const { value } = context;
  // deno-lint-ignore no-explicit-any
  const maybeLength = (value as any)?.length;
  const hasLength = maybeLength === expected;

  if (context.isNot) {
    if (hasLength) {
      throw new AssertionError(
        `Expected value not to have length ${expected}, but it does`,
      );
    }
  } else {
    if (!hasLength) {
      throw new AssertionError(
        `Expected value to have length ${expected}, but it does not. (The value has length ${maybeLength})`,
      );
    }
  }
}
