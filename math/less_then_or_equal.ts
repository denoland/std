// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

export function lte(a: BigSource, b: BigSource): boolean {
  return (a instanceof Big ? a : new Big(a)).lte(b);
}
