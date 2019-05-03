import { BigSource, Big } from "./big/mod.ts";

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
