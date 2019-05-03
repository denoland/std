// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

/**
 * Returns true if `a` equals `b`, otherwise returns false.
 * Throws if `a` or `b` is invalid.
 * @param a
 * @param b
 */
export function eq(a: BigSource, b: BigSource): boolean {
  return (a instanceof Big ? a : new Big(a)).eq(b);
}
