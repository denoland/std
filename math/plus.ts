// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

export function plus(a: BigSource, b: BigSource): string {
  return (a instanceof Big ? a : new Big(a)).plus(b).toString();
}
