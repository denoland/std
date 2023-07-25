// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { MatcherContext, MatchResult } from "../_types.ts";
import {
  assertAlmostEquals,
} from '../../assert/assert_almost_equals.ts';
import { AssertionError } from '../../assert/assertion_error';

/* Similar to assertStrictEquals(value, undefined) and  assertNotStrictEquals(value, undefined)*/
export function toBeCloseTo(context: MatcherContext, expected: number, tolerance = 1e-7): MatchResult {
  if (context.isNot) {
      const actual = Number(context.value);
      const delta = Math.abs(expected - actual);
      if (delta > tolerance) {
        return;
      }
      const msgSuffix = context.customMessage ? `: ${context.customMessage}` : ".";
      const f = (n: number) => Number.isInteger(n) ? n : n.toExponential();
      throw new AssertionError(
          `Expected actual: "${f(actual)}" to NOT be close to "${f(expected)}": \
  delta "${f(delta)}" is greater than "${f(tolerance)}"${msgSuffix}`,
      );
  }
  return assertAlmostEquals(Number(context.value), expected, tolerance, context.customMessage);
}
