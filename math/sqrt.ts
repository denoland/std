// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

/**
 * Returns a numeric whose value is the square root of `value`.
 * If the result has more fraction digits than is specified by `Big.DP`, it will be rounded to `Big.DP` decimal places using rounding mode `Big.RM`.
 * Throws if this `value` is negative.
 * @param value
 */
export function sqrt(value: BigSource): string {
  return (value instanceof Big ? value : new Big(value)).sqrt().toString();
}
