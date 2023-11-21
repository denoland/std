// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";

// TODO(kt3k): tolerance handling is wrong
export function toBeCloseTo(
  context: MatcherContext,
  expected: number,
  numDigits = 2,
): MatchResult {
  if (numDigits < 0) {
    throw new Error(
      "toBeCloseTo second argument must be a non-negative integer. Got " +
        numDigits,
    );
  }
  const tolerance = 0.5 * Math.pow(10, -numDigits);
  const value = Number(context.value);
  const pass = Math.abs(expected - value) < tolerance;

  if (context.isNot) {
    if (pass) {
      throw new AssertionError(
        `Expected the value not to be close to ${expected} (using ${numDigits} digits), but it is`,
      );
    }
  } else {
    if (!pass) {
      throw new AssertionError(
        `Expected the value (${value} to be close to ${expected} (using ${numDigits} digits), but it is not`,
      );
    }
  }
}
