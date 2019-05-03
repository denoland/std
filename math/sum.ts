// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BigSource, Big } from "./big/mod.ts";

/**
 * Returns a numeric whose value is the sum of `values`.
 * Throws if this `values` contains a invalid numeric.
 * @param values
 */
export function sum(values: BigSource[]): string {
  if (!values.length) {
    return "0";
  }
  const result = values.reduce(
    (previousValue: BigSource, currentValue: BigSource): Big => {
      return (previousValue instanceof Big
        ? previousValue
        : new Big(previousValue)
      ).plus(currentValue);
    },
    0
  ) as Big;
  return result.toString();
}
