// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "../_types.ts";
import {
  assertNotStrictEquals,
  assertStrictEquals,
} from "../../testing/asserts.ts";

/* Similar to assertStrictEquals and  assertNotStrictEquals*/
export function toBe(context: MatcherContext, expect: unknown): MatchResult {
  if (context.isNot) {
    return assertNotStrictEquals(context.value, expect, context.customMessage);
  }
  return assertStrictEquals(context.value, expect, context.customMessage);
}
