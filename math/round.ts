// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big, RoundingMode } from "./big/mod.ts";

export function round(
  value: BigSource,
  dp?: number,
  rm?: RoundingMode
): string {
  return (value instanceof Big ? value : new Big(value))
    .round(dp, rm)
    .toString();
}
