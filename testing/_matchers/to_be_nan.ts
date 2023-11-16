// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "../_types.ts";
import { assertEquals, assertNotEquals } from "../../testing/asserts.ts";

/* Similar to assertStrictEquals(isNaN(context.value as number), true) and  assertNotStrictEquals(isNaN(context.value as number), true)*/
export function toBeNan(context: MatcherContext): MatchResult {
  if (context.isNot) {
    return assertNotEquals(
      isNaN(Number(context.value)),
      true,
      context.customMessage || `Expected ${context.value} to not be NaN`,
    );
  }
  return assertEquals(
    isNaN(Number(context.value)),
    true,
    context.customMessage || `Expected ${context.value} to be NaN`,
  );
}
