// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "../_types.ts";
import {
  assertNotStrictEquals,
  assertStrictEquals,
} from "../../testing/asserts.ts";

/* Similar to assertStrictEquals(value, undefined) and  assertNotStrictEquals(value, undefined)*/
export function toBeUndefined(context: MatcherContext): MatchResult {
  if (context.isNot) {
    return assertNotStrictEquals(
      context.value,
      undefined,
      context.customMessage,
    );
  }
  return assertStrictEquals(context.value, undefined, context.customMessage);
}
