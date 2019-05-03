// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

/**
 * Returns a string representing the value of `value` in exponential notation to a fixed number of `dp` decimal places.
 * Throws if `value` or `dp` is invalid.
 * @param value
 * @param dp integer, 0 to 1e+6 inclusive
 */
export function toExponential(value: BigSource, dp?: number): string {
  return (value instanceof Big ? value : new Big(value)).toExponential(dp);
}
