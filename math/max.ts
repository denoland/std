import { BigSource, Big } from "./big/mod.ts";

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
