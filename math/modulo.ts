// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

/**
 * Returns numeric whose value is the value of `a` modulo `b`. it will match that of JavaScript's `%` operator
 * i.e. the integer remainder of dividing `a` by `b`.
 * Throws if `a` or `b` is negative or otherwise invalid.
 * @param a
 * @param b
 */
export function mod(a: BigSource, b: BigSource): string {
  return (a instanceof Big ? a : new Big(a)).mod(b).toString();
}
