import { BigSource, Big } from "./big/mod.ts";

export function toPrecision(value: BigSource, dp?: number): string {
  return (value instanceof Big ? value : new Big(value)).toPrecision(dp);
}
