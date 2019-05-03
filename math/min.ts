// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

/**
 * Returns the smaller of a set of supplied numeric expressions.
 * @param values A set of `BigSource`
 * @returns The smaller numeric of set
 */
export function min(values: BigSource[]): string {
  if (!values.length) {
    throw new Error("Min-array can not be empty.");
  }
  let minValue = values[0] instanceof Big ? values[0] : new Big(values[0]);
  for (const value of values) {
    if ((value instanceof Big ? value : new Big(value)).lt(minValue)) {
      minValue = value;
    }
  }
  return minValue.toString();
}
