import { BigSource, Big } from "./big/mod.ts";

export function gte(a: BigSource, b: BigSource): boolean {
  return (a instanceof Big ? a : new Big(a)).gte(b);
}
