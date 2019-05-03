// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

/**
 * Returns a numeric whose value is the value of `dividend` divided by `divisor`.
 * If the result has more fraction digits than is specified by `Big.DP`, it will be rounded to `Big.DP` decimal places using rounding mode `Big.RM`.
 * Throws if `divisor` is zero or otherwise invalid.
 * @param dividend
 * @param divisor
 */
export function div(dividend: BigSource, divisor: BigSource): string {
  return (dividend instanceof Big ? dividend : new Big(dividend))
    .div(divisor)
    .toString();
}
