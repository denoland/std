// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

/**
 * Returns a numeric whose value is the value of `value` raised to the power `n`.
 * If `n` is negative and the result has more fraction digits than is specified by `Big.DP`, it will be rounded to `Big.DP` decimal places using rounding mode `Big.RM`.
 * Throws if `n` is invalid.
 * @param value
 * @param n must be a JavaScript number, not a Big number, because only small integers are allowed.
 */
export function pow(value: BigSource, n: number): string {
  return (value instanceof Big ? value : new Big(value)).pow(n).toString();
}
