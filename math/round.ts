// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big, RoundingMode } from "./big/mod.ts";

/**
 * Returns numeric whose value is the value of `value` rounded using rounding mode `rm` to a maximum of `dp` decimal places
 * or if `dp` is negative, rounded to an integer which is a multiple of 10**-dp.
 * Throws if `dp` or `rm` is invalid.
 * @param value
 * @param dp if `dp` is omitted or is `undefined`, the return value is the value of `value` rounded to a whole number.
 * @param rm if `rm` is omitted or is `undefined`, the current `Big.RM` setting is used.
 */
export function round(
  value: BigSource,
  dp?: number,
  rm?: RoundingMode
): string {
  return (value instanceof Big ? value : new Big(value))
    .round(dp, rm)
    .toString();
}
