// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { assertNotStrictEquals } from "../assert/assert_not_strict_equals.ts";
import { assertStrictEquals } from "../assert/assert_strict_equals.ts";

export function toBeDefined(context: MatcherContext): MatchResult {
  if (context.isNot) {
    return assertStrictEquals(context.value, undefined, context.customMessage);
  }
  return assertNotStrictEquals(context.value, undefined, context.customMessage);
}
