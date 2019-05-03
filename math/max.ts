// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

/**
 * Returns the larger of a set of supplied numeric expressions
 * @param values A set of `BigSource`
 * @returns The larger numeric of set
 */
export function max(values: BigSource[]): string {
  if (!values.length) {
    throw new Error("Max-array can not be empty.");
  }
  let maxValue = values[0] instanceof Big ? values[0] : new Big(values[0]);
  for (const value of values) {
    if ((value instanceof Big ? value : new Big(value)).gt(maxValue)) {
      maxValue = value;
    }
  }
  return maxValue.toString();
}
