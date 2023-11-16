// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { assertNotStrictEquals } from "../assert/assert_not_strict_equals.ts";
import { assertStrictEquals } from "../assert/assert_strict_equals.ts";

/* Similar to assertStrictEquals */
export function toStrictEqual(
  context: MatcherContext,
  expected: unknown,
): MatchResult {
  if (context.isNot) {
    return assertNotStrictEquals(
      context.value,
      expected,
      context.customMessage,
    );
  }
  return assertStrictEquals(context.value, expected, context.customMessage);
}
