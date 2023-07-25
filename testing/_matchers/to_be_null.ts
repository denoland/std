// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "../_types.ts";
import {
  assertNotStrictEquals,
  assertStrictEquals,
} from "../../testing/asserts.ts";

/* Similar to assertStrictEquals(value, null) and  assertNotStrictEquals(value, null)*/
export function toBeNull(context: MatcherContext): MatchResult {
  if (context.isNot) {
    return assertNotStrictEquals(
      context.value as number,
      null,
      context.customMessage || `Expected ${context.value} to not be null`,
    );
  }
  return assertStrictEquals(
    context.value as number,
    null,
    context.customMessage || `Expected ${context.value} to be null`,
  );
}
