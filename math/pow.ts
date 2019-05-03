// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

export function pow(value: BigSource, n: number): string {
  return (value instanceof Big ? value : new Big(value)).pow(n).toString();
}
