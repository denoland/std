// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "../_types.ts";
import { assertMatch, assertNotMatch } from "../../testing/asserts.ts";

/* Similar to assertStrictEquals(value, undefined) and  assertNotStrictEquals(value, undefined)*/
export function toMatch(
  context: MatcherContext,
  expected: RegExp,
): MatchResult {
  if (context.isNot) {
    return assertNotMatch(
      String(context.value),
      expected,
      context.customMessage,
    );
  }
  return assertMatch(String(context.value), expected, context.customMessage);
}
