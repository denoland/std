import { BigSource, Big } from "./big/mod.ts";

export function toFixed(value: BigSource, dp?: number): string {
  return (value instanceof Big ? value : new Big(value)).toFixed(dp);
}
