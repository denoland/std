// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

/**
 * Returns numeric whose value is the value of `minuend` minus `subtrahend`.
 * Throws if `minuend` or `subtrahend` is invalid.
 * @param minuend
 * @param subtrahend
 */
export function minus(minuend: BigSource, subtrahend: BigSource): string {
  return (minuend instanceof Big ? minuend : new Big(minuend))
    .minus(subtrahend)
    .toString();
}
