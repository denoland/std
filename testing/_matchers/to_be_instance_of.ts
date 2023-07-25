// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "../_types.ts";
import {
  assertInstanceOf,
  assertNotInstanceOf,
} from "../../testing/asserts.ts";
import { AnyConstructor } from "../../assert/assert_instance_of.ts";

/* Similar to assertInstanceOf(value, null) and  assertNotInstanceOf(value, null)*/
export function toBeInstanceOf<T extends AnyConstructor>(
  context: MatcherContext,
  expected: T,
): MatchResult {
  if (context.isNot) {
    return assertNotInstanceOf(context.value, expected);
  }
  return assertInstanceOf(context.value, expected);
}
