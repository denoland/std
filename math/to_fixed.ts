// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

/**
 * Returns a string representing the value of `value` in normal notation to a fixed number of `dp` decimal places.
 * If the value of `value` in normal notation has more digits to the right of the decimal point than is specified by `dp`, the return value will be rounded to `dp` decimal places using rounding mode `Big.RM`.
 * If the value of `value` in normal notation has fewer fraction digits then is specified by `dp`, the return value will be appended with zeros accordingly.
 * Unlike `Number.prototype.toFixed`, which returns exponential notation if a number is greater or equal to `1021`, this method will always return normal notation.
 * Throws if `value` or `dp` is invalid.
 * @param value
 * @param dp integer, 0 to 1e+6 inclusive. If `dp` is omitted or is undefined, the return value is simply the value in normal notation. This is also unlike `Number.prototype.toFixed`, which returns the value to zero decimal places.
 */
export function toFixed(value: BigSource, dp?: number): string {
  return (value instanceof Big ? value : new Big(value)).toFixed(dp);
}
