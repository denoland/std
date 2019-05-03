// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

/**
 * Returns a string representing the value of `value` to the specified number of `sd` significant digits.
 * If the value of `value` has more digits than is specified by `sd`, the return value will be rounded to `sd` significant digits using rounding mode `Big.RM`.
 * If the value of `value` has fewer digits than is specified by `sd`, the return value will be appended with zeros accordingly.
 * If `sd` is less than the number of digits necessary to represent the integer part of the value in normal notation, exponential notation is used.
 * If `sd` is omitted or is undefined, the return value is the same as .toString().
 * @param value
 * @param sd integer, 1 to 1e+6 inclusive.
 */
export function toPrecision(value: BigSource, sd?: number): string {
  return (value instanceof Big ? value : new Big(value)).toPrecision(sd);
}
