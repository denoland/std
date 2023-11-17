// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { AssertionError } from "../assert/assertion_error.ts";
import { equal } from "../assert/equal.ts";
import { MatcherContext, MatchResult } from "./_types.ts";

export function toContainEqual(
  context: MatcherContext,
  expected: unknown,
): MatchResult {
  const { value } = context;
  assertIsIterable(value);
  let doesContain = false;
  for (const item of value) {
    if (equal(item, expected)) {
      doesContain = true;
      break;
    }
  }

  if (context.isNot) {
    if (doesContain) {
      throw new AssertionError("The value contains the expected item");
    }
  } else {
    if (!doesContain) {
      throw new AssertionError("The value doesn't contain the expected item");
    }
  }
}

// deno-lint-ignore no-explicit-any
function assertIsIterable(value: any): asserts value is Iterable<unknown> {
  if (value == null) {
    throw new AssertionError("The value is null or undefined");
  }
  if (typeof value[Symbol.iterator] !== "function") {
    throw new AssertionError("The value is not iterable");
  }
}
