// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

/**
 * Returns the absolute value of a `numberic`
 * @param value a type in `BigSource`
 * @returns absolute value string
 */
export function abs(value: BigSource): string {
  return (value instanceof Big ? value : new Big(value)).abs().toString();
}
