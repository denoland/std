// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "../_types.ts";
import { AssertionError, assertObjectMatch } from "../../testing/asserts.ts";
import { format } from "../../assert/_format.ts";

/* Similar to assertObjectMatch(value, expected)*/
export function toMatchObject(
  context: MatcherContext,
  expected: Record<PropertyKey, unknown>,
): MatchResult {
  if (context.isNot) {
    let objectMatch = false;
    try {
      assertObjectMatch(
        // deno-lint-ignore no-explicit-any
        context.value as Record<PropertyKey, any>,
        expected,
        context.customMessage,
      );
      objectMatch = true;
      const actualString = format(context.value);
      const expectedString = format(expected);
      throw new AssertionError(
        `Expected ${actualString} to NOT match ${expectedString}`,
      );
    } catch (e) {
      if (objectMatch) {
        throw e;
      }
      return;
    }
  }
  return assertObjectMatch(
    // deno-lint-ignore no-explicit-any
    context.value as Record<PropertyKey, any>,
    expected,
    context.customMessage,
  );
}
