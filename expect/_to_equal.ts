// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { assertNotEquals } from "../assert/assert_not_equals.ts";
import { assertEquals } from "../assert/assert_equals.ts";

export function toEqual(
  context: MatcherContext,
  expected: unknown,
): MatchResult {
  if (context.isNot) {
    return assertNotEquals(context.value, expected, context.customMessage);
  }
  return assertEquals(context.value, expected, context.customMessage);
}
