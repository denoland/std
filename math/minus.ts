// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

export function minus(minuend: BigSource, subtrahend: BigSource): string {
  return (minuend instanceof Big ? minuend : new Big(minuend))
    .minus(subtrahend)
    .toString();
}
