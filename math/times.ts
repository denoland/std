// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

/**
 * Returns a numeric whose value is the value of `multiplicand` times `multiplier`.
 * Throws if `multiplicand` or `multiplier` is invalid.
 * @param multiplicand
 * @param multiplier
 */
export function times(multiplicand: BigSource, multiplier: BigSource): string {
  return (multiplicand instanceof Big ? multiplicand : new Big(multiplicand))
    .times(multiplier)
    .toString();
}
