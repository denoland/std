// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { AnyConstructor, MatcherContext, MatchResult } from "./_types.ts";
import { assertInstanceOf } from "../assert/assert_instance_of.ts";
import { assertNotInstanceOf } from "../assert/assert_not_instance_of.ts";

export function toBeInstanceOf<T extends AnyConstructor>(
  context: MatcherContext,
  expected: T,
): MatchResult {
  if (context.isNot) {
    assertNotInstanceOf(context.value, expected);
  } else {
    assertInstanceOf(context.value, expected);
  }
}
