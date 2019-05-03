// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

/**
 * Returns true if `a` less than `b`, otherwise returns false.
 * Throws if `a` or `b` is invalid.
 * @param a
 * @param b
 */
export function lt(a: BigSource, b: BigSource): boolean {
  return (a instanceof Big ? a : new Big(a)).lt(b);
}
