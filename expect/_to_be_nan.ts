// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { assertNotEquals } from "../assert/assert_not_equals.ts";
import { assertEquals } from "../assert/assert_equals.ts";

export function toBeNaN(context: MatcherContext): MatchResult {
  if (context.isNot) {
    assertNotEquals(
      isNaN(Number(context.value)),
      true,
      context.customMessage || `Expected ${context.value} to not be NaN`,
    );
  } else {
    assertEquals(
      isNaN(Number(context.value)),
      true,
      context.customMessage || `Expected ${context.value} to be NaN`,
    );
  }
}
